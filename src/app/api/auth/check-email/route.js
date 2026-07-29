import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ exists: false });

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createSupabaseAdminClient();

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    return NextResponse.json({ exists: !!data?.id });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
