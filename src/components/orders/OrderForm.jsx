"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function OrderForm({ onSubmit }) {
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    function handleSubmit(e) {
        e.preventDefault();

        onSubmit({
            customerName,
            phone,
            paymentMethod,
        });

        setCustomerName("");
        setPhone("");
        setPaymentMethod("Cash");
    }

    return (
        <Card className="p-6">

            <h2 className="text-2xl font-bold mb-6">
                New Order
            </h2>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >

                <div>

                    <label className="text-sm font-medium">
                        Customer Name
                    </label>

                    <Input
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />

                </div>

                <div>

                    <label className="text-sm font-medium">
                        Phone Number
                    </label>

                    <Input
                        placeholder="03xxxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                </div>

                <div>

                    <label className="text-sm font-medium">
                        Payment Method
                    </label>

                    <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                    >

                        <SelectTrigger>

                            <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                            <SelectItem value="Cash">
                                Cash
                            </SelectItem>

                            <SelectItem value="Card">
                                Card
                            </SelectItem>

                            <SelectItem value="Online">
                                Online
                            </SelectItem>

                        </SelectContent>

                    </Select>

                </div>

                <Button
                    className="w-full"
                    type="submit"
                >
                    Continue
                </Button>

            </form>

        </Card>
    );
}