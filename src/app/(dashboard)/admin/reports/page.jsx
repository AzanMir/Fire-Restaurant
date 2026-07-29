"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import useReports from "@/hooks/useReports";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileDown, TrendingUp, Package, DollarSign, BarChart2, AlertTriangle } from "lucide-react";
import { useReactToPrint } from "react-to-print";

const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#ef4444"];

export default function ReportsPage() {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const reportRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: reportRef });

  const { data, loading, loadBestSelling, loadInventoryReport, loadProfitReport } = useReports();
  const [reportType, setReportType] = useState(null);

  async function run(type) {
    setReportType(type);
    if (type === "best-selling") await loadBestSelling(10);
    else if (type === "inventory") await loadInventoryReport();
    else if (type === "profit") await loadProfitReport(startDate, endDate);
  }

  const totalInventoryValue = reportType === "inventory" && data?.ingredients
    ? data.ingredients.reduce((s, i) => s + Number(i.current_stock) * Number(i.purchase_price), 0)
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Analytics and business insights">
        {data && (
          <Button onClick={() => handlePrint()} variant="outline">
            <FileDown className="size-4 mr-1" /> Export / Print
          </Button>
        )}
      </PageHeader>

      {/* Date Range */}
      <Card><CardContent className="p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40 h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40 h-8 text-sm" /></div>
      </CardContent></Card>

      {/* Report Types */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { key: "best-selling", icon: TrendingUp, label: "Best Selling Items", color: "bg-orange-500" },
          { key: "profit", icon: DollarSign, label: "Profit Report", color: "bg-green-500" },
          { key: "inventory", icon: Package, label: "Inventory Report", color: "bg-blue-500" },
        ].map(({ key, icon: Icon, label, color }) => (
          <button
            key={key}
            onClick={() => run(key)}
            className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left hover:border-primary transition ${reportType === key ? "border-orange-500 bg-orange-50" : ""}`}
          >
            <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="size-5 text-white" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Report Output */}
      {loading && <Loader text="Generating report..." />}

      {!loading && data && (
        <div ref={reportRef}>
          {/* Best Selling */}
          {reportType === "best-selling" && Array.isArray(data) && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="size-4 text-orange-500" /> Top 10 Best Selling Items</CardTitle></CardHeader>
                <CardContent>
                  {data.length === 0 ? <EmptyState title="No data" /> : (
                    <div className="grid lg:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="item_name" tick={{ fontSize: 11 }} width={120} />
                          <Tooltip formatter={(v, n) => n === "total_revenue" ? formatCurrency(v) : v} />
                          <Bar dataKey="total_quantity" fill="#f97316" radius={[0, 4, 4, 0]} name="Qty Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div>
                        <Table>
                          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Revenue</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {data.map((item, i) => (
                              <TableRow key={item.menu_item_id}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell>{item.total_quantity}</TableCell>
                                <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_revenue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profit Report */}
          {reportType === "profit" && data.revenue !== undefined && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Revenue", value: data.revenue, color: "text-green-600" },
                  { label: "COGS", value: data.cogs, color: "text-red-500" },
                  { label: "Gross Profit", value: data.grossProfit, color: "text-blue-600" },
                  { label: "Tax", value: data.taxes, color: "text-orange-500" },
                  { label: "Discounts", value: data.discounts, color: "text-yellow-600" },
                  { label: "Net Profit", value: data.netProfit, color: "text-emerald-600" },
                ].map(({ label, value, color }) => (
                  <Card key={label}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-bold mt-0.5 ${color}`}>{formatCurrency(value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Profit Breakdown</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={[
                        { name: "COGS", value: Math.max(0, data.cogs) },
                        { name: "Tax", value: Math.max(0, data.taxes) },
                        { name: "Net Profit", value: Math.max(0, data.netProfit) },
                      ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {["#ef4444", "#f97316", "#22c55e"].map((color, i) => <Cell key={i} fill={color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Inventory Report */}
          {reportType === "inventory" && data.ingredients && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{data.ingredients.length}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-red-600">{data.lowStockItems.length}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inventory Value</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalValue)}</p></CardContent></Card>
              </div>
              {data.lowStockItems.length > 0 && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{data.lowStockItems.length} items below minimum stock.</span>
                </div>
              )}
              <Card><CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Price/Unit</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ingredients.map((item) => {
                      const isLow = Number(item.current_stock) <= Number(item.minimum_stock);
                      return (
                        <TableRow key={item.id} className={isLow ? "bg-red-50/40" : ""}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className={isLow ? "text-red-600 font-semibold" : ""}>{item.current_stock}</TableCell>
                          <TableCell>{item.minimum_stock}</TableCell>
                          <TableCell>{formatCurrency(item.purchase_price)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(Number(item.current_stock) * Number(item.purchase_price))}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={isLow ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}>
                              {isLow ? "Low Stock" : "OK"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </div>
          )}
        </div>
      )}

      {!loading && !data && (
        <EmptyState icon={BarChart2} title="Select a report" description="Choose a report type above to generate insights." />
      )}
    </div>
  );
}
