import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (err) {
    // Surface the misconfiguration explicitly — a bare throw would become a
    // generic bodyless 500 in production.
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const { userId, newPassword } = await request.json();
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
