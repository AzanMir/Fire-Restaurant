import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, category:categories(id,name), recipe:recipes(id,notes,recipe_items(id,quantity,unit,ingredient:ingredients(id,name,unit)))")
    .eq("id", params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  let variants = [];
  try {
    const result = await supabase.from("menu_item_variants").select("id,name,price,is_available,sort_order").eq("menu_item_id", data.id);
    if (result.error) throw result.error;
    variants = result.data || [];
  } catch {
    // See the menu route: variants are optional until its migration is deployed.
  }
  return NextResponse.json({ ...data, variants });
}

export async function PUT(request, { params }) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  const { data, error } = await supabase.from("menu_items").update(body).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_, { params }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("menu_items").update({ is_active: false }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
