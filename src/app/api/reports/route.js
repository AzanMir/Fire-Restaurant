import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (type === "best-selling") {
    const limit = parseInt(searchParams.get("limit") || "10");
    const { data, error } = await supabase.rpc("get_best_selling_items", { p_limit: limit });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (type === "inventory") {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*, supplier:suppliers(name)")
      .eq("is_active", true)
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (type === "sales-summary" && start && end) {
    const { data, error } = await supabase.rpc("get_sales_summary", { p_start: start, p_end: end });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
