import { supabase } from "@/lib/supabase";

const LEGACY_SIZE_ORDER = { S: 1, M: 2, L: 3, XL: 4 };

function groupLegacySizedItems(items) {
  const groups = new Map();
  const unchanged = [];

  items.forEach((item) => {
    const match = item.name.match(/^(.*?)\s*\((S|M|L|XL)\)$/i);
    if (!match) {
      unchanged.push({ ...item, variants: [] });
      return;
    }
    const baseName = match[1].trim();
    const size = match[2].toUpperCase();
    const key = `${item.category_id || "uncategorized"}:${baseName.toLowerCase()}`;
    const group = groups.get(key) || { ...item, name: baseName, variants: [] };
    group.variants.push({
      id: item.id,
      name: size,
      price: item.price,
      is_available: item.is_available,
      sort_order: LEGACY_SIZE_ORDER[size],
      legacy: true,
    });
    groups.set(key, group);
  });

  return [...unchanged, ...groups.values()];
}

async function attachVariants(items) {
  if (!items?.length) return items || [];
  try {
    const { data, error } = await supabase
      .from("menu_item_variants")
      .select("id,menu_item_id,name,price,is_available,sort_order")
      .in("menu_item_id", items.map((item) => item.id));
    if (error) throw error;
    const byMenuItem = new Map();
    for (const variant of data || []) {
      const current = byMenuItem.get(variant.menu_item_id) || [];
      current.push(variant);
      byMenuItem.set(variant.menu_item_id, current);
    }
    return items.map((item) => ({ ...item, variants: byMenuItem.get(item.id) || [] }));
  } catch {
    // Keep the existing menu available while the optional variants migration is
    // being applied to an older database.
    return groupLegacySizedItems(items);
  }
}

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
  return attachVariants(data);
}

export async function getMenuItem(id) {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, category:categories(id,name), recipe:recipes(id,notes,recipe_items(id,quantity,unit,ingredient:ingredients(id,name,unit)))")
    .eq("id", id)
    .single();
  if (error) throw error;
  const [item] = await attachVariants([data]);
  return item;
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

export async function replaceMenuItemVariants(menuItemId, variants) {
  const { error: deleteError } = await supabase
    .from("menu_item_variants")
    .delete()
    .eq("menu_item_id", menuItemId);
  if (deleteError) throw deleteError;

  if (!variants.length) return;
  const { error } = await supabase.from("menu_item_variants").insert(
    variants.map((variant, index) => ({
      menu_item_id: menuItemId,
      name: variant.name.trim(),
      price: Number(variant.price),
      is_available: variant.is_available !== false,
      sort_order: index,
    }))
  );
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
