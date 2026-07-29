"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderStatus from "./OrderStatus";
import { formatCurrency } from "@/lib/utils";

export default function OrderCard({ order }) {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="font-bold text-xl">Order #{order.id}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{order.customer_name}</p>
        </div>
        <OrderStatus status={order.status} />
      </div>

      <div className="mt-4 space-y-1.5">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.quantity} × {item.name}</span>
            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between items-center border-t pt-4">
        <span className="font-semibold text-sm">Total</span>
        <span className="font-bold">{formatCurrency(order.total)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="flex-1">View</Button>
        <Button variant="outline" className="flex-1">Print</Button>
      </div>
    </Card>
  );
}
