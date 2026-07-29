import { supabase } from "@/lib/supabase";
import { generateReceiptNumber } from "@/lib/utils";
import { validateOrderStock } from "@/lib/order-stock";
import { getPaymentDetailsNote } from "@/lib/payment";

export async function getOrders({ status, search, page = 1, limit = 20 } = {}) {
  let query = supabase
    .from("orders")
    .select("*, order_items(id,name,price,quantity,subtotal)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status && status !== "All") query = query.eq("status", status);
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,receipt_number.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id,name,price,quantity,subtotal,menu_item_id)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createOrder({ customerName, phone, paymentMethod, paymentDetails, items, subtotal, discount, tax, total, notes, servedBy }) {
  await validateOrderStock(supabase, items);
  const paymentNote = getPaymentDetailsNote(paymentMethod, paymentDetails);

  const receiptNumber = generateReceiptNumber();

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      receipt_number: receiptNumber,
      customer_name: customerName || "Walk-in",
      phone: phone || "",
      payment_method: paymentMethod,
      subtotal,
      discount,
      tax,
      total,
      notes: [notes, paymentNote].filter(Boolean).join("\n"),
      served_by: servedBy || null,
      status: "Pending",
    })
    .select()
    .single();

  if (oErr) throw oErr;

  const orderItems = items.map((i) => ({
    order_id: order.id,
    menu_item_id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    subtotal: i.price * i.quantity,
  }));

  const { error: iErr } = await supabase.from("order_items").insert(orderItems);
  if (iErr) throw iErr;

  const { error: stockError } = await supabase.rpc("deduct_inventory_for_order", {
    p_order_id: order.id,
  });
  if (stockError) {
    await supabase.from("orders").update({ status: "Cancelled" }).eq("id", order.id);
    throw new Error(`Order could not be placed because inventory could not be deducted: ${stockError.message}`);
  }

  return order;
}

export async function updateOrderStatus(id, status) {
  const existingOrder = status === "Completed" ? await getOrder(id) : null;
  if (existingOrder && existingOrder.status !== "Completed") {
    await validateOrderStock(
      supabase,
      existingOrder.order_items.map((item) => ({
        id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
      }))
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Record the sale only after an order is completed. Stock is reserved when
  // the order is placed, preventing later orders from overselling it.
  if (status === "Completed" && existingOrder?.status !== "Completed") {
    const { error: saleError } = await supabase.rpc("record_sale_for_order", { p_order_id: id });
    if (saleError) throw saleError;
  }

  return data;
}

export async function deleteOrder(id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function getTodayStats() {
  const { data, error } = await supabase.rpc("get_dashboard_stats");
  if (error) throw error;
  return data;
}
