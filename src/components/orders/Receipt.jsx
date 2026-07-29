"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

export default function Receipt({ order }) {
  if (!order) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        No receipt available.
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = order.tax ?? 0;
  const discount = order.discount ?? 0;
  const total = subtotal + tax - discount;

  return (
    <div className="max-w-sm mx-auto bg-card shadow-md rounded-xl p-6 print:shadow-none print:rounded-none">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">FIRE Restaurant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Restaurant Management System</p>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Receipt #</span><span>{order.id}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{order.date}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{order.customer_name}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{order.phone}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{order.payment_method}</span></div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between text-sm font-semibold mb-2">
        <span>Item</span>
        <span>Total</span>
      </div>

      {order.items.map((item) => (
        <div key={item.id} className="flex justify-between py-1.5 border-b last:border-0 text-sm">
          <div>
            <p>{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.price)}</p>
          </div>
          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
        </div>
      ))}

      <Separator className="my-4" />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
        {discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
        <Separator />
        <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
      </div>

      <div className="mt-6 text-center text-muted-foreground text-sm">
        <p>Thank You!</p>
        <p>Please Visit Again</p>
      </div>

      <Button className="w-full mt-4 print:hidden" onClick={() => window.print()}>
        Print Receipt
      </Button>
    </div>
  );
}
