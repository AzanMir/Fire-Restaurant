import { cn } from "@/lib/utils";

export default function Spinner({ size = "md", className }) {
  const sizes = { sm: "size-4", md: "size-6", lg: "size-10" };
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizes[size],
        className
      )}
    />
  );
}
