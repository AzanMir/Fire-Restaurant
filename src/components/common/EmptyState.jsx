import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "No data found", description, children, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
