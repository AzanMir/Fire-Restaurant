import { supabase } from "@/lib/supabase";

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateSettings(id, payload) {
  const { data, error } = await supabase
    .from("settings")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertSettings(payload) {
  const existing = await getSettings();
  if (existing) {
    return updateSettings(existing.id, payload);
  }
  const { data, error } = await supabase
    .from("settings")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
