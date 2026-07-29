import { supabase } from "@/lib/supabase";

export async function getIngredients({ search, lowStock } = {}) {
  let query = supabase
    .from("ingredients")
    .select("*, supplier:suppliers(id,name)")
    .eq("is_active", true)
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);
  if (lowStock) query = query.lte("current_stock", supabase.raw("minimum_stock"));

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getLowStockIngredients() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*, supplier:suppliers(id,name)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  // Filter client-side as Supabase doesn't support column comparison in filter
  return data?.filter((i) => Number(i.current_stock) <= Number(i.minimum_stock)) ?? [];
}

export async function getIngredient(id) {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*, supplier:suppliers(id,name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createIngredient(payload) {
  const { data, error } = await supabase
    .from("ingredients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIngredient(id, payload) {
  const { data, error } = await supabase
    .from("ingredients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIngredient(id) {
  const { error } = await supabase
    .from("ingredients")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function getStockHistory(ingredientId) {
  const { data, error } = await supabase
    .from("inventory")
    .select("*, created_by:profiles(full_name)")
    .eq("ingredient_id", ingredientId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function addStockMovement({ ingredientId, type, quantity, note, createdBy }) {
  const { error } = await supabase.from("inventory").insert({
    ingredient_id: ingredientId,
    type,
    quantity,
    note,
    created_by: createdBy,
  });
  if (error) throw error;

  // Update current_stock
  const sign = type === "usage" || type === "waste" ? -1 : 1;
  const { error: uErr } = await supabase.rpc("adjust_stock", {
    p_ingredient_id: ingredientId,
    p_delta: sign * quantity,
  }).maybeSingle();

  // Fallback manual update if RPC not available
  if (uErr) {
    const { data: ing } = await supabase
      .from("ingredients")
      .select("current_stock")
      .eq("id", ingredientId)
      .single();
    await supabase
      .from("ingredients")
      .update({ current_stock: Math.max(0, Number(ing.current_stock) + sign * Number(quantity)) })
      .eq("id", ingredientId);
  }
}
