import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, size = "default", ...props }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-5 overflow-hidden rounded-2xl bg-card py-5 text-sm text-card-foreground shadow-sm ring-1 ring-foreground/5",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min items-start gap-1.5 px-5", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <div data-slot="card-title" className={cn("text-base font-medium", className)} {...props} />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div data-slot="card-content" className={cn("px-5", className)} {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-5", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
