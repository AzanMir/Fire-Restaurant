import { supabase } from "@/lib/supabase";

export async function getSalesSummary(startDate, endDate) {
  const { data, error } = await supabase.rpc("get_sales_summary", {
    p_start: startDate,
    p_end: endDate,
  });
  if (error) throw error;
  return data;
}

export async function getDailySales(date) {
  const { data, error } = await supabase
    .from("sales")
    .select("*, order:orders(receipt_number,customer_name,payment_method)")
    .eq("date", date)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMonthlySales(year, month) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().split("T")[0];
  return getSalesSummary(start, end);
}

export async function getYearlySales(year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return getSalesSummary(start, end);
}

export async function getSalesTransactions({ startDate, endDate, paymentMethod, page = 1, limit = 20 } = {}) {
  let query = supabase
    .from("sales")
    .select("*, order:orders(receipt_number,customer_name,payment_method,status)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (paymentMethod && paymentMethod !== "All") {
    query = query.eq("payment_method", paymentMethod);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function getSalesTotals(startDate, endDate) {
  const { data, error } = await supabase
    .from("sales")
    .select("total, tax, discount")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw error;

  return data.reduce(
    (acc, row) => ({
      total: acc.total + Number(row.total),
      tax: acc.tax + Number(row.tax),
      discount: acc.discount + Number(row.discount),
    }),
    { total: 0, tax: 0, discount: 0 }
  );
}
