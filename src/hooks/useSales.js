"use client";

import { useEffect, useState, useCallback } from "react";
import { getSalesTransactions, getSalesTotals } from "@/services/salesService";

export default function useSales(filters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ total: 0, tax: 0, discount: 0 });
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txResult, totalsResult] = await Promise.all([
        getSalesTransactions(filters),
        filters.startDate && filters.endDate
          ? getSalesTotals(filters.startDate, filters.endDate)
          : Promise.resolve({ total: 0, tax: 0, discount: 0 }),
      ]);
      setTransactions(txResult.data);
      setCount(txResult.count ?? 0);
      setTotals(totalsResult);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { transactions, totals, count, loading, error, refresh: load };
}
