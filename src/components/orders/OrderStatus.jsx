import { Badge } from "@/components/ui/badge";

export default function OrderStatus({ status }) {
    const variants = {
        Pending: "bg-yellow-500 hover:bg-yellow-500",
        Preparing: "bg-blue-500 hover:bg-blue-500",
        Ready: "bg-green-500 hover:bg-green-500",
        Completed: "bg-gray-600 hover:bg-gray-600",
        Cancelled: "bg-red-500 hover:bg-red-500",
    };

    return (
        <Badge className={`text-white ${variants[status] || "bg-gray-500"}`}>
            {status}
        </Badge>
    );
}