"use client";

import { useEffect, useState, useCallback } from "react";
import { getIngredients } from "@/services/inventoryService";

export default function useInventory(filters = {}) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIngredients(filters);
      setIngredients(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { ingredients, loading, error, refresh: load };
}
