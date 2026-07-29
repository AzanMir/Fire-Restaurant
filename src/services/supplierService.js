import { supabase } from "@/lib/supabase";

export async function getSuppliers({ search } = {}) {
  let query = supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getSupplier(id) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSupplier(payload) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(id, payload) {
  const { data, error } = await supabase
    .from("suppliers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id) {
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function getSupplierPurchases(supplierId) {
  const { data, error } = await supabase
    .from("purchases")
    .select("*, ingredient:ingredients(name,unit)")
    .eq("supplier_id", supplierId)
    .order("purchase_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function createPurchase(payload) {
  const { data, error } = await supabase
    .from("purchases")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  // Update ingredient stock
  const { data: ing } = await supabase
    .from("ingredients")
    .select("current_stock")
    .eq("id", payload.ingredient_id)
    .single();

  await supabase
    .from("ingredients")
    .update({ current_stock: Number(ing.current_stock) + Number(payload.quantity) })
    .eq("id", payload.ingredient_id);

  // Log movement
  await supabase.from("inventory").insert({
    ingredient_id: payload.ingredient_id,
    type: "purchase",
    quantity: payload.quantity,
    note: `Purchase from supplier. Ref: ${data.id}`,
    reference_id: data.id,
    created_by: payload.created_by,
  });

  return data;
}
