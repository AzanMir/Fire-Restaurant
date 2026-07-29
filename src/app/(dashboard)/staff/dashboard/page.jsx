"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { getOrders, updateOrderStatus } from "@/services/orderService";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { ShoppingBag, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {value === undefined
              ? <Skeleton className="h-8 w-16 mt-1" />
              : <p className="text-3xl font-bold mt-0.5">{value}</p>}
          </div>
          <div className={`flex size-10 items-center justify-center rounded-2xl ${color}`}>
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await getOrders({ limit: 50 });
      setOrders(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(todayStr));
  const pending = orders.filter((o) => o.status === "Pending").length;
  const completed = todayOrders.filter((o) => o.status === "Completed").length;
  const active = orders.filter((o) => ["Pending", "Preparing", "Ready"].includes(o.status));

  async function handleStatusChange(orderId, status) {
    try {
      await updateOrderStatus(orderId, status);
      toast({ title: "Status updated", type: "success" });
      load(true);
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`size-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <StatCard title="Today's Orders" value={loading ? undefined : todayOrders.length} icon={ShoppingBag} color="bg-blue-500" />
        <StatCard title="Pending" value={loading ? undefined : pending} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Completed Today" value={loading ? undefined : completed} icon={CheckCircle} color="bg-green-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Orders ({active.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : active.length === 0 ? (
            <EmptyState title="No active orders" description="New orders will appear here." className="py-10" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.receipt_number}</TableCell>
                    <TableCell className="text-sm font-medium">{order.customer_name}</TableCell>
                    <TableCell className="text-sm">{order.order_items?.length ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
