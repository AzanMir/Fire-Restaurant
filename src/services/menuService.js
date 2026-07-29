import { supabase } from "@/lib/supabase";

export async function getMenuItems({ categoryId, search, available } = {}) {
  let query = supabase
    .from("menu_items")
    .select("*, category:categories(id,name)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (available !== undefined) query = query.eq("is_available", available);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMenuItem(id) {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, category:categories(id,name), recipe:recipes(id,notes,recipe_items(id,quantity,unit,ingredient:ingredients(id,name,unit)))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createMenuItem(payload) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id, payload) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

// Recipe helpers
export async function upsertRecipe(menuItemId, notes, items) {
  // Upsert recipe
  const { data: recipe, error: rErr } = await supabase
    .from("recipes")
    .upsert({ menu_item_id: menuItemId, notes }, { onConflict: "menu_item_id" })
    .select()
    .single();
  if (rErr) throw rErr;

  // Delete old items then re-insert
  await supabase.from("recipe_items").delete().eq("recipe_id", recipe.id);

  if (items && items.length > 0) {
    const { error: iErr } = await supabase.from("recipe_items").insert(
      items.map((i) => ({
        recipe_id: recipe.id,
        ingredient_id: i.ingredient_id,
        quantity: i.quantity,
        unit: i.unit,
      }))
    );
    if (iErr) throw iErr;
  }
  return recipe;
}
