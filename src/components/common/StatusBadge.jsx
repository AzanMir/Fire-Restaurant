import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  Pending:   { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Preparing: { className: "bg-blue-100 text-blue-800 border-blue-200" },
  Ready:     { className: "bg-green-100 text-green-800 border-green-200" },
  Completed: { className: "bg-gray-100 text-gray-700 border-gray-200" },
  Cancelled: { className: "bg-red-100 text-red-800 border-red-200" },
  active:    { className: "bg-green-100 text-green-800 border-green-200" },
  inactive:  { className: "bg-gray-100 text-gray-700 border-gray-200" },
  low:       { className: "bg-red-100 text-red-800 border-red-200" },
  ok:        { className: "bg-green-100 text-green-800 border-green-200" },
};

export default function StatusBadge({ status, label }) {
  const config = statusConfig[status] ?? { className: "bg-gray-100 text-gray-700" };
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {label ?? status}
    </Badge>
  );
}
