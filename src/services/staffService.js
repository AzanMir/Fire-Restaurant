import { supabase } from "@/lib/supabase";

export async function getStaff({ search } = {}) {
  let query = supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (search) query = query.ilike("full_name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getStaffMember(id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateStaffMember(id, payload) {
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleStaffStatus(id, isActive) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

// Admin creates staff via API route (needs service_role key)
export async function createStaffMember(payload) {
  const res = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create staff");
  }
  return res.json();
}

export async function resetStaffPassword(userId, newPassword) {
  const res = await fetch("/api/staff/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to reset password");
  }
  return res.json();
}
