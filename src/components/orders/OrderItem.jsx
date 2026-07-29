"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function OrderItem({ item }) {
    const { increase, decrease, removeItem } = useCart();

    return (
        <div className="flex items-center justify-between border-b py-3">

            <div>
                <h3 className="font-semibold">{item.name}</h3>

                <p className="text-sm text-gray-500">
                    Rs. {item.price}
                </p>
            </div>

            <div className="flex items-center gap-2">

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => decrease(item.id)}
                >
                    <Minus size={16} />
                </Button>

                <span className="w-8 text-center">
                    {item.quantity}
                </span>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => increase(item.id)}
                >
                    <Plus size={16} />
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                >
                    <Trash2 size={16} />
                </Button>

            </div>

        </div>
    );
}