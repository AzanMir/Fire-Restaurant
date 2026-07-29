import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request, { params }) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  const { data, error } = await supabase.from("categories").update(body).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_, { params }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
