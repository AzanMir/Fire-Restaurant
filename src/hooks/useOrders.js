"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrders } from "@/services/orderService";

export default function useOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await getOrders(filters);
      setOrders(data);
      setTotal(count ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { orders, total, loading, error, refresh: load };
}
