import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("category_id");
  const available = searchParams.get("available");

  let query = supabase
    .from("menu_items")
    .select("*, category:categories(id,name)")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (available !== null) query = query.eq("is_available", available === "true");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let variants = [];
  try {
    const result = await supabase
      .from("menu_item_variants")
      .select("id,menu_item_id,name,price,is_available,sort_order")
      .in("menu_item_id", (data || []).map((item) => item.id));
    if (result.error) throw result.error;
    variants = result.data || [];
  } catch {
    // The menu remains usable on databases that have not run the variants migration yet.
  }
  const variantsByMenuItem = new Map();
  variants.forEach((variant) => variantsByMenuItem.set(variant.menu_item_id, [...(variantsByMenuItem.get(variant.menu_item_id) || []), variant]));
  return NextResponse.json((data || []).map((item) => ({ ...item, variants: variantsByMenuItem.get(item.id) || [] })));
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  const { data, error } = await supabase.from("menu_items").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
