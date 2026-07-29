"use client";

import { useState, useCallback } from "react";
import { getBestSellingItems, getInventoryReport, getProfitReport, getDailyReport } from "@/services/reportService";

export default function useReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBestSelling = useCallback(async (limit = 10) => {
    setLoading(true);
    try { setData(await getBestSellingItems(limit)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadInventoryReport = useCallback(async () => {
    setLoading(true);
    try { setData(await getInventoryReport()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadProfitReport = useCallback(async (start, end) => {
    setLoading(true);
    try { setData(await getProfitReport(start, end)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadDailyReport = useCallback(async (date) => {
    setLoading(true);
    try { setData(await getDailyReport(date)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  return { data, loading, error, loadBestSelling, loadInventoryReport, loadProfitReport, loadDailyReport };
}
