"use client";

import { useRef, useState, useMemo } from "react";
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
  CreditCard, Banknote, Smartphone, RefreshCw, X,
} from "lucide-react";
import useMenu from "@/hooks/useMenu";
import useCategories from "@/hooks/useCategories";
import useOrders from "@/hooks/useOrders";
import useSettings from "@/hooks/useSettings";
import { createOrder, updateOrderStatus } from "@/services/orderService";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import { useReactToPrint } from "react-to-print";

function Receipt({ order, settings, ref: fwdRef }) {
  if (!order) return null;
  return (
    <div ref={fwdRef} className="p-5 font-mono text-sm max-w-sm mx-auto">
      <div className="text-center mb-3">
        {settings?.logo_url && <img src={settings.logo_url} alt="logo" className="h-10 mx-auto mb-1" />}
        <h2 className="font-bold text-lg">{settings?.restaurant_name || "FIRE Restaurant"}</h2>
        <p className="text-xs text-muted-foreground">{settings?.address}</p>
        <p className="text-xs text-muted-foreground">{settings?.phone}</p>
      </div>
      <Separator className="my-2" />
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between"><span>Receipt#</span><span>{order.receipt_number}</span></div>
        <div className="flex justify-between"><span>Customer</span><span>{order.customer_name}</span></div>
        <div className="flex justify-between"><span>Date</span><span>{formatDateTime(order.created_at)}</span></div>
        <div className="flex justify-between"><span>Payment</span><span>{order.payment_method}</span></div>
      </div>
      <Separator className="my-2" />
      {order.order_items?.map((item) => (
        <div key={item.id ?? item.name} className="flex justify-between text-xs">
          <span>{item.name} x{item.quantity}</span>
          <span>{formatCurrency(item.subtotal ?? item.price * item.quantity)}</span>
        </div>
      ))}
      <Separator className="my-2" />
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
        {Number(order.discount) > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
        <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
        <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t"><span>TOTAL</span><span>{formatCurrency(order.total)}</span></div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3">Thank you!</p>
    </div>
  );
}

function POSInner({ categories, menuItems, onDone }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useSettings();
  const {
    items: cart, addItem, increase, decrease, removeItem,
    clearCart, subtotal, totalItems, discount, setDiscount,
  } = useCart();

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

  const taxRate = settings?.tax_percentage ?? 5;
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const filtered = useMemo(() => {
    let list = menuItems.filter((i) => i.is_available);
    if (activeCat !== "all") list = list.filter((i) => i.category_id === activeCat);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [menuItems, activeCat, search]);

  async function place() {
    if (!cart.length) { toast({ title: "Cart is empty", type: "error" }); return; }
    setPlacing(true);
    try {
      const order = await createOrder({
        customerName, phone, paymentMethod,
        paymentDetails: { provider: paymentProvider, reference: paymentReference },
        items: cart, subtotal, discount: discountAmt, tax: taxAmt, total, servedBy: user?.id,
      });
      const fullOrder = { ...order, order_items: cart.map((i) => ({ name: i.name, quantity: i.quantity, subtotal: i.price * i.quantity })) };
      setReceiptOrder(fullOrder);
      setReceiptOpen(true);
      setCartOpen(false);
      clearCart();
      setCustomerName(""); setPhone(""); setPaymentProvider(""); setPaymentReference(""); setDiscount(0);
      toast({ title: "Order placed!", description: order.receipt_number, type: "success" });
      onDone?.();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setPlacing(false);
    }
  }

  const payIcons = { Cash: Banknote, Card: CreditCard, Online: Smartphone };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] relative">
      {/* ── Mobile cart overlay ─────────────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Left — Menu */}
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

        {/* Category filters */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1 flex-wrap">
            <Button size="sm" variant={activeCat === "all" ? "default" : "outline"} className={activeCat === "all" ? "bg-orange-500 hover:bg-orange-600" : ""} onClick={() => setActiveCat("all")}>All</Button>
            {categories.filter((c) => c.is_active).map((c) => (
              <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"} className={activeCat === c.id ? "bg-orange-500 hover:bg-orange-600 shrink-0" : "shrink-0"} onClick={() => setActiveCat(c.id)}>{c.name}</Button>
            ))}
          </div>
        </ScrollArea>

        {/* Menu grid */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? <EmptyState title="No items" className="py-10" /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="flex flex-col items-start rounded-2xl border bg-card p-3 text-left hover:border-orange-300 hover:bg-orange-50 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-24 object-cover rounded-xl mb-2" />
                    : <div className="flex w-full h-24 items-center justify-center rounded-xl bg-muted mb-2 text-2xl">🍽️</div>
                  }
                  <p className="text-xs font-semibold line-clamp-2">{item.name}</p>
                  <p className="text-orange-600 font-bold text-sm mt-0.5">{formatCurrency(item.price)}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right — Cart (slide-over on mobile, static on desktop) */}
      <Card className={`
        fixed inset-y-0 right-0 z-50 w-80 shrink-0 flex flex-col overflow-hidden transition-transform duration-300 rounded-none
        lg:static lg:inset-auto lg:z-auto lg:rounded-xl lg:translate-x-0 lg:h-full lg:w-72
        ${cartOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingCart className="size-4" />
            Cart
            {totalItems > 0 && <Badge className="bg-orange-500 ml-auto">{totalItems}</Badge>}
            <button
              onClick={() => setCartOpen(false)}
              className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Close cart"
            >
              <X className="size-4" />
            </button>
          </CardTitle>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name" className="h-7 text-xs" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-7 text-xs" />
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 px-3">
          {!cart.length ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <ShoppingCart className="size-8 opacity-20 mb-2" />
              <p className="text-xs">Empty cart</p>
            </div>
          ) : (
            <div className="space-y-1.5 pb-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 rounded-xl bg-muted/50 p-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                  </div>
                  <Button variant="outline" size="icon-xs" onClick={() => decrease(item.id)}><Minus className="size-3" /></Button>
                  <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon-xs" onClick={() => increase(item.id)}><Plus className="size-3" /></Button>
                  <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="size-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-3 pb-3 pt-2 shrink-0 border-t space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-14 shrink-0">Discount</Label>
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-6 text-xs" min={0} />
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(discountAmt)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmt)}</span></div>
            <div className="flex justify-between font-bold text-sm pt-1 border-t"><span>Total</span><span className="text-orange-600">{formatCurrency(total)}</span></div>
          </div>

          <div className="flex gap-1">
            {PAYMENT_METHODS.map((m) => {
              const I = payIcons[m];
              return (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl border py-1 text-xs transition ${paymentMethod === m ? "border-orange-500 bg-orange-50 text-orange-700" : "hover:bg-muted"}`}
                >
                  <I className="size-3" />{m}
                </button>
              );
            })}
          </div>

          <Button onClick={place} disabled={placing || !cart.length} className="w-full bg-orange-500 hover:bg-orange-600 text-sm h-8">
            {placing ? "Placing..." : `Place · ${formatCurrency(total)}`}
          </Button>
        </div>
      </Card>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Order Placed</DialogTitle></DialogHeader>
          <Receipt order={receiptOrder} settings={settings} ref={receiptRef} />
          <Button onClick={() => handlePrint()} className="w-full bg-orange-500 hover:bg-orange-600">
            <Printer className="size-4 mr-2" /> Print Receipt
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersList() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("All");
  const { orders, loading, refresh } = useOrders({ status: statusFilter, limit: 30 });

  async function handleStatus(id, status) {
    try {
      await updateOrderStatus(id, status);
      toast({ title: "Updated", type: "success" });
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="size-4 mr-1" />Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {orders.length === 0 ? <EmptyState title="No orders" className="py-10" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.receipt_number}</TableCell>
                    <TableCell className="text-sm">{o.customer_name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(o.total)}</TableCell>
                    <TableCell><Badge variant="outline">{o.payment_method}</Badge></TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => handleStatus(o.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
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

export default function StaffOrdersPage() {
  const { items, loading: ml } = useMenu();
  const { categories, loading: cl } = useCategories();
  if (ml || cl) return <Loader />;
  return (
    <CartProvider>
      <Tabs defaultValue="pos">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Orders</h1>
          <TabsList>
            <TabsTrigger value="pos">New Order</TabsTrigger>
            <TabsTrigger value="list">Order List</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="pos">
          <POSInner categories={categories.filter((c) => c.is_active)} menuItems={items} />
        </TabsContent>
        <TabsContent value="list">
          <OrdersList />
        </TabsContent>
      </Tabs>
    </CartProvider>
  );
}
