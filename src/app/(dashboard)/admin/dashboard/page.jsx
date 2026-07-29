"use client";

import { useEffect, useState } from "react";
import { getTodayStats } from "@/services/orderService";
import { getSalesSummary } from "@/services/salesService";
import { getLowStockIngredients } from "@/services/inventoryService";
import { getBestSellingItems } from "@/services/reportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle,
  AlertTriangle, DollarSign, UtensilsCrossed, Users,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value ?? <Skeleton className="h-8 w-24 mt-1" />}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`flex size-11 items-center justify-center rounded-2xl ${color}`}>
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const [statsData, salesData, lowStockData, bestSellingData] = await Promise.all([
          getTodayStats(),
          getSalesSummary(
            sevenDaysAgo.toISOString().split("T")[0],
            today.toISOString().split("T")[0]
          ),
          getLowStockIngredients(),
          getBestSellingItems(5),
        ]);

        setStats(statsData);
        setChartData(
          salesData.map((d) => ({
            date: formatDate(d.sale_date),
            revenue: Number(d.total_sales),
            orders: Number(d.order_count),
          }))
        );
        setLowStock(lowStockData);
        setBestSelling(bestSellingData ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Overview for ${formatDate(new Date())}`} />

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Orders"
          value={stats ? stats.today_orders : undefined}
          icon={ShoppingBag}
          color="bg-blue-500"
          sub="Total orders today"
        />
        <StatCard
          title="Today's Sales"
          value={stats ? formatCurrency(stats.today_sales) : undefined}
          icon={DollarSign}
          color="bg-green-500"
          sub="Revenue generated"
        />
        <StatCard
          title="Pending Orders"
          value={stats ? stats.pending_orders : undefined}
          icon={Clock}
          color="bg-yellow-500"
          sub="Awaiting preparation"
        />
        <StatCard
          title="Completed Orders"
          value={stats ? stats.completed_orders : undefined}
          icon={CheckCircle}
          color="bg-emerald-500"
          sub="Done today"
        />
        <StatCard
          title="Low Stock Items"
          value={stats ? stats.low_stock_count : undefined}
          icon={AlertTriangle}
          color="bg-red-500"
          sub="Need restocking"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats ? formatCurrency(stats.month_revenue) : undefined}
          icon={TrendingUp}
          color="bg-purple-500"
          sub="This month"
        />
        <StatCard
          title="Menu Items"
          value={stats ? stats.total_menu_items : undefined}
          icon={UtensilsCrossed}
          color="bg-orange-500"
          sub="Active items"
        />
        <StatCard
          title="Total Staff"
          value={stats ? stats.total_staff : undefined}
          icon={Users}
          color="bg-cyan-500"
          sub="Active employees"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No sales data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No order data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock + Best Selling */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All stock levels are healthy</p>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.minimum_stock} {item.unit}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      {item.current_stock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-green-500" /> Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : bestSelling.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No completed orders yet</p>
            ) : (
              <div className="space-y-2">
                {bestSelling.map((item, idx) => (
                  <div key={item.menu_item_id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">{item.total_quantity} sold</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(item.total_revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
