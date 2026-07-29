function toNumber(value) {
  return Number(value) || 0;
}

function formatQuantity(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.0+$/, "");
}

/**
 * Verifies that every ordered menu item has a recipe and that the total recipe
 * requirements for the cart are available in stock.
 */
export async function validateOrderStock(supabase, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one item before placing an order.");
  }

  const requestedItems = items.map((item) => ({
    id: item.id,
    name: item.name || "Menu item",
    quantity: toNumber(item.quantity),
  }));

  if (requestedItems.some((item) => !item.id || item.quantity <= 0)) {
    throw new Error("Each order item must have a valid quantity.");
  }

  const menuItemIds = [...new Set(requestedItems.map((item) => item.id))];
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("menu_item_id, recipe_items(quantity, ingredient:ingredients(id,name,unit,current_stock,is_active))")
    .in("menu_item_id", menuItemIds);

  if (error) throw error;

  const recipesByMenuItem = new Map(
    (recipes ?? []).map((recipe) => [recipe.menu_item_id, recipe.recipe_items ?? []])
  );
  const missingRecipes = requestedItems
    .filter((item) => !recipesByMenuItem.get(item.id)?.length)
    .map((item) => item.name);

  if (missingRecipes.length > 0) {
    throw new Error(
      `Cannot place this order because ${missingRecipes.join(", ")} ${
        missingRecipes.length === 1 ? "has" : "have"
      } no recipe. Add the ingredient quantities in Menu before selling it.`
    );
  }

  const requirements = new Map();
  for (const item of requestedItems) {
    for (const recipeItem of recipesByMenuItem.get(item.id)) {
      const ingredient = Array.isArray(recipeItem.ingredient)
        ? recipeItem.ingredient[0]
        : recipeItem.ingredient;
      if (!ingredient?.id || !ingredient.is_active) {
        throw new Error(`Cannot place this order because ${item.name} has an unavailable recipe ingredient.`);
      }

      const required = toNumber(recipeItem.quantity) * item.quantity;
      const previous = requirements.get(ingredient.id);
      requirements.set(ingredient.id, {
        ingredient,
        required: (previous?.required ?? 0) + required,
      });
    }
  }

  const shortages = [...requirements.values()].filter(
    ({ ingredient, required }) => toNumber(ingredient.current_stock) < required
  );

  if (shortages.length > 0) {
    const details = shortages
      .map(({ ingredient, required }) =>
        `${ingredient.name}: need ${formatQuantity(required)} ${ingredient.unit}, have ${formatQuantity(
          toNumber(ingredient.current_stock)
        )} ${ingredient.unit}`
      )
      .join("; ");
    throw new Error(`Insufficient inventory. ${details}.`);
  }
}
