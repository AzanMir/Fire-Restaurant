import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { generateReceiptNumber } from "@/lib/utils";
import { validateOrderStock } from "@/lib/order-stock";
import { getPaymentDetailsNote } from "@/lib/payment";

export async function GET(request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = supabase
    .from("orders")
    .select("*, order_items(id,name,price,quantity,subtotal)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status && status !== "All") query = query.eq("status", status);
  if (search) query = query.or(`customer_name.ilike.%${search}%,receipt_number.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { items, customerName, phone, paymentMethod, paymentDetails, discount, notes } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Add at least one item before placing an order." }, { status: 400 });
  }

  const menuItemIds = [...new Set(items.map((item) => item.menu_item_id || item.id))];
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id,name,price,is_available")
    .in("id", menuItemIds)
    .eq("is_active", true);
  if (menuError) return NextResponse.json({ error: menuError.message }, { status: 500 });

  let variants = [];
  try {
    const result = await supabase
      .from("menu_item_variants")
      .select("id,menu_item_id,name,price,is_available")
      .in("menu_item_id", menuItemIds);
    if (result.error) throw result.error;
    variants = result.data || [];
  } catch {
    // Older databases can continue selling normal menu items until the
    // optional variants migration has been applied.
  }
  const variantsByMenuItem = new Map();
  variants.forEach((variant) => variantsByMenuItem.set(variant.menu_item_id, [...(variantsByMenuItem.get(variant.menu_item_id) || []), variant]));

  const menuById = new Map((menuItems || []).map((item) => [item.id, { ...item, variants: variantsByMenuItem.get(item.id) || [] }]));
  let normalizedItems;
  try {
    normalizedItems = items.map((item) => {
      const menuItem = menuById.get(item.menu_item_id || item.id);
      const quantity = Number(item.quantity);
      if (!menuItem || !menuItem.is_available || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("One or more menu items are unavailable or have an invalid quantity.");
      }
      const variants = (menuItem.variants || []).filter((variant) => variant.is_available);
      const variant = item.variant_id ? variants.find((candidate) => candidate.id === item.variant_id) : null;
      if ((variants.length && !variant) || (!variants.length && item.variant_id)) {
        throw new Error(`${menuItem.name} requires a valid size selection.`);
      }
      return {
        id: menuItem.id,
        menu_item_id: menuItem.id,
        variant_id: variant?.id || null,
        name: variant ? `${menuItem.name} (${variant.name})` : menuItem.name,
        price: Number(variant?.price ?? menuItem.price),
        quantity,
      };
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const appliedDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - appliedDiscount;

  let paymentNote;
  try {
    await validateOrderStock(supabase, normalizedItems);
    paymentNote = getPaymentDetailsNote(paymentMethod, paymentDetails);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  const receiptNumber = generateReceiptNumber();

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      receipt_number: receiptNumber,
      customer_name: customerName || "Walk-in",
      phone: phone || "",
      payment_method: paymentMethod,
      subtotal, discount: appliedDiscount, tax: 0, total,
      notes: [notes, paymentNote].filter(Boolean).join("\n"),
      served_by: user.id,
      status: "Pending",
    })
    .select()
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 400 });

  const orderItems = normalizedItems.map((i) => ({
    order_id: order.id,
    menu_item_id: i.id,
    menu_item_variant_id: i.variant_id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    subtotal: i.price * i.quantity,
  }));

  const { error: iErr } = await supabase.from("order_items").insert(orderItems);
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });

  const { error: stockError } = await supabase.rpc("deduct_inventory_for_order", {
    p_order_id: order.id,
  });
  if (stockError) {
    await supabase.from("orders").update({ status: "Cancelled" }).eq("id", order.id);
    return NextResponse.json(
      { error: `Order could not be placed because inventory could not be deducted: ${stockError.message}` },
      { status: 409 }
    );
  }

  return NextResponse.json(order, { status: 201 });
}
