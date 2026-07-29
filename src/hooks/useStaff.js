"use client";

import { useEffect, useState, useCallback } from "react";
import { getStaff } from "@/services/staffService";

export default function useStaff(filters = {}) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStaff(filters);
      setStaff(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { staff, loading, error, refresh: load };
}
