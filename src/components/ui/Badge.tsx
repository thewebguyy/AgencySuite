import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "brand" | "surface" | "accent" | "success" | "warning" | "error";
}

const Badge = ({
  className,
  variant = "surface",
  ...props
}: BadgeProps) => {
  const variants = {
    brand: "bg-brand text-white",
    surface: "bg-surface text-mid border border-border",
    accent: "bg-accent text-brand",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    error: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
