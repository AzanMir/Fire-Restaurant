import { supabase } from "@/lib/supabase";

export async function getBestSellingItems(limit = 10) {
  const { data, error } = await supabase.rpc("get_best_selling_items", { p_limit: limit });
  if (error) throw error;
  return data;
}

export async function getInventoryReport() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*, supplier:suppliers(name)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;

  const low = data.filter((i) => Number(i.current_stock) <= Number(i.minimum_stock));
  const totalValue = data.reduce(
    (sum, i) => sum + Number(i.current_stock) * Number(i.purchase_price),
    0
  );
  return { ingredients: data, lowStockItems: low, totalValue };
}

export async function getProfitReport(startDate, endDate) {
  const { data: sales, error: sErr } = await supabase
    .from("sales")
    .select("total, tax, discount")
    .gte("date", startDate)
    .lte("date", endDate);
  if (sErr) throw sErr;

  const revenue = sales.reduce((s, r) => s + Number(r.total), 0);
  const taxes = sales.reduce((s, r) => s + Number(r.tax), 0);
  const discounts = sales.reduce((s, r) => s + Number(r.discount), 0);

  // COGS: sum of (recipe_item qty * ingredient purchase price * order qty) for completed orders
  const { data: costData, error: cErr } = await supabase
    .from("order_items")
    .select(`
      quantity,
      menu_item:menu_items(
        recipe:recipes(
          recipe_items(quantity, ingredient:ingredients(purchase_price))
        )
      ),
      order:orders!inner(status, created_at)
    `)
    .eq("order.status", "Completed")
    .gte("order.created_at", startDate)
    .lte("order.created_at", endDate);

  let cogs = 0;
  if (!cErr && costData) {
    costData.forEach((oi) => {
      const recipeItems = oi.menu_item?.recipe?.recipe_items ?? [];
      recipeItems.forEach((ri) => {
        cogs += Number(ri.quantity) * Number(ri.ingredient?.purchase_price ?? 0) * Number(oi.quantity);
      });
    });
  }

  return { revenue, taxes, discounts, cogs, grossProfit: revenue - cogs, netProfit: revenue - cogs - taxes };
}

export async function getDailyReport(date) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(name, quantity, subtotal)")
    .eq("status", "Completed")
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`);
  if (error) throw error;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;
  const paymentBreakdown = orders.reduce((acc, o) => {
    acc[o.payment_method] = (acc[o.payment_method] || 0) + Number(o.total);
    return acc;
  }, {});

  return { date, orders, totalRevenue, totalOrders, paymentBreakdown };
}
