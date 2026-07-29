import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { validateOrderStock } from "@/lib/order-stock";

export async function GET(_, { params }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id,name,price,quantity,subtotal,menu_item_id)")
    .eq("id", params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request, { params }) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  let existingOrder = null;

  if (body.status === "Completed") {
    const { data, error } = await supabase
      .from("orders")
      .select("status, order_items(menu_item_id,name,quantity)")
      .eq("id", params.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    existingOrder = data;

    if (existingOrder.status !== "Completed") {
      try {
        await validateOrderStock(supabase, existingOrder.order_items.map((item) => ({
          id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
        })));
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.status === "Completed" && existingOrder?.status !== "Completed") {
    const { error: saleError } = await supabase.rpc("record_sale_for_order", { p_order_id: params.id });
    if (saleError) return NextResponse.json({ error: saleError.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_, { params }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("orders").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
