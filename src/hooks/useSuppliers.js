"use client";

import { useEffect, useState, useCallback } from "react";
import { getSuppliers } from "@/services/supplierService";

export default function useSuppliers(filters = {}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuppliers(filters);
      setSuppliers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { suppliers, loading, error, refresh: load };
}
