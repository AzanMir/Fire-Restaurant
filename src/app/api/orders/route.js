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
  const { items, customerName, phone, paymentMethod, paymentDetails, subtotal, discount, tax, total, notes } = body;

  let paymentNote;
  try {
    await validateOrderStock(supabase, items);
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
      subtotal, discount, tax, total,
      notes: [notes, paymentNote].filter(Boolean).join("\n"),
      served_by: user.id,
      status: "Pending",
    })
    .select()
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 400 });

  const orderItems = items.map((i) => ({
    order_id: order.id,
    menu_item_id: i.id,
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
