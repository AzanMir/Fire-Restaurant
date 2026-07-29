import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase.from("profiles").select("*").order("full_name");
  if (search) query = query.ilike("full_name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (err) {
    // Surface the misconfiguration explicitly — a bare throw would become a
    // generic bodyless 500 in production.
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const { full_name, email, password, role, phone } = await request.json();

  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

  const { error: profileErr } = await adminClient.from("profiles").upsert({
    id: newUser.user.id,
    email,
    full_name,
    role: role || "staff",
    phone: phone || "",
  });

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 });

  return NextResponse.json({ id: newUser.user.id, email, full_name, role }, { status: 201 });
}
