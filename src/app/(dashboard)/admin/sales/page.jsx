"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSalesSummary, getSalesTransactions, getSalesTotals } from "@/services/salesService";
import { DollarSign, TrendingUp, ShoppingBag, Percent } from "lucide-react";

function SummaryCard({ title, value, icon: Icon, color, loading }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="h-7 w-28 mt-1" /> : <p className="text-2xl font-bold mt-0.5">{value}</p>}
          </div>
          <div className={`flex size-10 items-center justify-center rounded-2xl ${color}`}>
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [tab, setTab] = useState("overview");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const TX_LIMIT = 20;

  useEffect(() => { loadOverview(); }, [startDate, endDate]);
  useEffect(() => { if (tab === "transactions") loadTransactions(); }, [tab, txPage, startDate, endDate]);

  async function loadOverview() {
    setLoading(true);
    try {
      const [summary, totalsData] = await Promise.all([
        getSalesSummary(startDate, endDate),
        getSalesTotals(startDate, endDate),
      ]);
      setChartData(summary.map((d) => ({
        date: formatDate(d.sale_date),
        revenue: Number(d.total_sales),
        orders: Number(d.order_count),
        tax: Number(d.total_tax),
        discount: Number(d.total_discount),
      })));
      setTotals(totalsData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadTransactions() {
    setTxLoading(true);
    try {
      const { data, count } = await getSalesTransactions({ startDate, endDate, page: txPage, limit: TX_LIMIT });
      setTransactions(data);
      setTxTotal(count);
    } catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  }

  const totalPages = Math.ceil(txTotal / TX_LIMIT);

  return (
    <div className="space-y-4">
      <PageHeader title="Sales" description="Revenue and transaction overview" />

      {/* Date Range */}
      <Card><CardContent className="p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40 h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40 h-8 text-sm" />
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={loadOverview}>Apply</Button>
        <div className="flex gap-1 ml-auto">
          {["today", "week", "month", "year"].map((p) => (
            <Button key={p} variant="outline" size="sm" onClick={() => {
              const now = new Date();
              const e = now.toISOString().split("T")[0];
              let s;
              if (p === "today") s = e;
              else if (p === "week") { const d = new Date(now); d.setDate(d.getDate() - 6); s = d.toISOString().split("T")[0]; }
              else if (p === "month") s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
              else { s = `${now.getFullYear()}-01-01`; }
              setStartDate(s); setEndDate(e);
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </CardContent></Card>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Revenue" value={totals ? formatCurrency(totals.total) : "—"} icon={DollarSign} color="bg-green-500" loading={loading} />
        <SummaryCard title="Tax Collected" value={totals ? formatCurrency(totals.tax) : "—"} icon={Percent} color="bg-blue-500" loading={loading} />
        <SummaryCard title="Total Discounts" value={totals ? formatCurrency(totals.discount) : "—"} icon={TrendingUp} color="bg-orange-500" loading={loading} />
        <SummaryCard title="Transactions" value={loading ? "—" : chartData.reduce((s, d) => s + d.orders, 0)} icon={ShoppingBag} color="bg-purple-500" loading={loading} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Revenue</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-52 w-full" /> : chartData.length === 0 ? <EmptyState title="No data" className="py-8" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#rev)" strokeWidth={2} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Orders</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-52 w-full" /> : chartData.length === 0 ? <EmptyState title="No data" className="py-8" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            {txLoading ? <Loader /> : transactions.length === 0 ? <EmptyState title="No transactions" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.order?.receipt_number}</TableCell>
                      <TableCell className="text-sm">{tx.order?.customer_name}</TableCell>
                      <TableCell><Badge variant="outline">{tx.payment_method}</Badge></TableCell>
                      <TableCell className="text-sm">{formatCurrency(tx.tax)}</TableCell>
                      <TableCell className="text-sm text-red-500">{tx.discount > 0 ? `-${formatCurrency(tx.discount)}` : "—"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(tx.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
          <div className="flex items-center justify-between pt-3">
            <p className="text-xs text-muted-foreground">{txTotal} total transactions</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={txPage === 1} onClick={() => setTxPage((p) => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={txPage >= totalPages} onClick={() => setTxPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
