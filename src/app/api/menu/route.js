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
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  const { data, error } = await supabase.from("menu_items").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
