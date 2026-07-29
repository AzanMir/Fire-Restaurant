"use client";

import { useState, useMemo, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { CartProvider, useCart } from "@/context/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Printer,
  CreditCard, Banknote, Smartphone, RefreshCw, Eye, X,
} from "lucide-react";
import useMenu from "@/hooks/useMenu";
import useCategories from "@/hooks/useCategories";
import useOrders from "@/hooks/useOrders";
import { createOrder, updateOrderStatus } from "@/services/orderService";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import MenuItemCard from "@/components/orders/MenuItemCard";
import useSettings from "@/hooks/useSettings";
import { useReactToPrint } from "react-to-print";

// ─── Receipt Component ─────────────────────────────────────────────────────
function Receipt({ order, settings, ref: forwardedRef }) {
  if (!order) return null;
  return (
    <div ref={forwardedRef} className="p-6 font-mono text-sm max-w-sm mx-auto print:p-2">
      <div className="text-center mb-4">
        {settings?.logo_url && <img src={settings.logo_url} alt="logo" className="h-12 mx-auto mb-2" />}
        <h1 className="text-xl font-bold">{settings?.restaurant_name || "FIRE Restaurant"}</h1>
        <p className="text-xs text-muted-foreground">{settings?.address}</p>
        <p className="text-xs text-muted-foreground">{settings?.phone}</p>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span>Receipt#</span><span>{order.receipt_number}</span></div>
        <div className="flex justify-between"><span>Customer</span><span>{order.customer_name}</span></div>
        {order.phone && <div className="flex justify-between"><span>Phone</span><span>{order.phone}</span></div>}
        <div className="flex justify-between"><span>Date</span><span>{formatDateTime(order.created_at)}</span></div>
        <div className="flex justify-between"><span>Payment</span><span>{order.payment_method}</span></div>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1 text-xs">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.name} x{item.quantity}</span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>
      <Separator className="my-2" />
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
        {order.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
        <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatCurrency(order.total)}</span></div>
      </div>
      <Separator className="my-2" />
      <p className="text-center text-xs text-muted-foreground mt-2">Thank you for visiting!</p>
    </div>
  );
}

// ─── POS Panel (uses CartContext) ──────────────────────────────────────────
function POSPanel({ categories, menuItems, onOrderPlaced }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { items: cartItems, discount, setDiscount, addItem, increase, decrease, removeItem, clearCart, subtotal, totalItems } = useCart();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [placing, setPlacing] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const receiptRef = useRef(null);

  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const afterDiscount = subtotal - discountAmt;
  const total = afterDiscount;

  const filtered = useMemo(() => {
    let list = menuItems.filter((i) => i.is_available);
    if (activeCat !== "all") list = list.filter((i) => i.category_id === activeCat);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [menuItems, activeCat, search]);

  async function handlePlaceOrder() {
    if (cartItems.length === 0) { toast({ title: "Cart is empty", type: "error" }); return; }
    setPlacing(true);
    try {
      const order = await createOrder({
        customerName, phone, paymentMethod,
        paymentDetails: { provider: paymentProvider, reference: paymentReference },
        items: cartItems,
        subtotal,
        discount: discountAmt,
        tax: 0,
        total,
        servedBy: user?.id,
      });
      const fullOrder = { ...order, order_items: cartItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, subtotal: i.price * i.quantity })) };
      setReceiptOrder(fullOrder);
      setReceiptOpen(true);
      setCartOpen(false);
      clearCart();
      setCustomerName("");
      setPhone("");
      setPaymentProvider("");
      setPaymentReference("");
      setDiscount(0);
      toast({ title: "Order placed!", description: `Receipt: ${order.receipt_number}`, type: "success" });
      onOrderPlaced?.();
    } catch (e) {
      toast({ title: "Error placing order", description: e.message, type: "error" });
    } finally {
      setPlacing(false);
    }
  }

  const paymentIcons = { Cash: Banknote, Card: CreditCard, Online: Smartphone };

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)] relative">
      {/* ── Mobile cart overlay ────────────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Left — Menu Grid */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Search + mobile cart toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." className="pl-9" />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden shrink-0 relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="size-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
        {/* Category Tabs */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            <Button size="sm" variant={activeCat === "all" ? "default" : "outline"} onClick={() => setActiveCat("all")} className={activeCat === "all" ? "bg-orange-500 hover:bg-orange-600" : ""}>All</Button>
            {categories.filter((c) => c.is_active).map((c) => (
              <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"} onClick={() => setActiveCat(c.id)} className={activeCat === c.id ? "bg-orange-500 hover:bg-orange-600 shrink-0" : "shrink-0"}>
                {c.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
        {/* Menu Grid */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState title="No items found" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
              {filtered.map((item) => <MenuItemCard key={item.id} item={item} onAdd={addItem} />)}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right — Cart (fixed slide-over on mobile, static panel on desktop) */}
      <Card className={`
        fixed inset-y-0 right-0 z-50 w-80 shrink-0 flex flex-col overflow-hidden transition-transform duration-300 rounded-none
        lg:static lg:inset-auto lg:z-auto lg:rounded-xl lg:translate-x-0 lg:h-full
        ${cartOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" /> Cart
            {totalItems > 0 && <Badge className="bg-orange-500 ml-auto">{totalItems}</Badge>}
            <button onClick={() => setCartOpen(false)} className="ml-auto lg:hidden text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </CardTitle>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="text-xs h-7" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="text-xs h-7" />
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 px-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ShoppingCart className="size-10 mb-2 opacity-20" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="icon-xs" onClick={() => decrease(item.id)}><Minus className="size-3" /></Button>
                    <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                    <Button variant="outline" size="icon-xs" onClick={() => increase(item.id)}><Plus className="size-3" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 pb-4 space-y-3 shrink-0 border-t pt-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-20 shrink-0">Discount</Label>
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-7 text-xs" min={0} max={subtotal} />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(discountAmt)}</span></div>}
            <div className="flex justify-between font-bold text-sm pt-1 border-t"><span>Total</span><span className="text-orange-600">{formatCurrency(total)}</span></div>
          </div>

          <div className="flex gap-1">
            {PAYMENT_METHODS.map((m) => {
              const Icon = paymentIcons[m];
              return (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl border py-1.5 text-xs transition ${paymentMethod === m ? "border-orange-500 bg-orange-50 text-orange-700" : "hover:bg-muted"}`}
                >
                  <Icon className="size-3.5" />
                  {m}
                </button>
              );
            })}
          </div>

          <Button onClick={handlePlaceOrder} disabled={placing || cartItems.length === 0} className="w-full bg-orange-500 hover:bg-orange-600">
            {placing ? "Placing..." : `Place Order · ${formatCurrency(total)}`}
          </Button>
        </div>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Order Placed</DialogTitle></DialogHeader>
          <Receipt order={receiptOrder} settings={settings} ref={receiptRef} />
          <Button onClick={() => handlePrint()} className="w-full mt-2 bg-orange-500 hover:bg-orange-600">
            <Printer className="size-4 mr-2" /> Print Receipt
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Orders List ──────────────────────────────────────────────────────────
function OrdersList() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  const { orders, total, loading, refresh } = useOrders({ status: statusFilter, search, page, limit: 20 });

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({ title: "Status updated", type: "success" });
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    }
  }

  async function viewReceipt(order) {
    const { getOrder } = await import("@/services/orderService");
    const full = await getOrder(order.id);
    setReceiptOrder(full);
    setReceiptOpen(true);
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="size-4 mr-1" /> Refresh</Button>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No orders found" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.receipt_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{order.customer_name}</p>
                      {order.phone && <p className="text-xs text-muted-foreground">{order.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{order.order_items?.length ?? 0} items</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                  <TableCell><Badge variant="outline">{order.payment_method}</Badge></TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => viewReceipt(order)} title="View receipt">
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          <Receipt order={receiptOrder} settings={settings} ref={receiptRef} />
          <Button onClick={() => handlePrint()} className="w-full mt-2 bg-orange-500 hover:bg-orange-600">
            <Printer className="size-4 mr-2" /> Print Receipt
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { items: menuItems, loading: menuLoading } = useMenu();
  const { categories, loading: catLoading } = useCategories();

  if (menuLoading || catLoading) return <Loader />;

  return (
    <CartProvider>
      <div className="space-y-4">
        <Tabs defaultValue="pos">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Orders & POS</h1>
            <TabsList>
              <TabsTrigger value="pos">New Order</TabsTrigger>
              <TabsTrigger value="list">Order List</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="pos">
            <POSPanel categories={categories.filter((category) => category.is_active)} menuItems={menuItems} />
          </TabsContent>
          <TabsContent value="list">
            <OrdersList />
          </TabsContent>
        </Tabs>
      </div>
    </CartProvider>
  );
}
