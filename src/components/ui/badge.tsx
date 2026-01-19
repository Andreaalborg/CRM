import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] text-white",
        secondary: "bg-[var(--color-secondary)] text-white",
        outline: "border border-[var(--color-border)] text-[var(--color-foreground)]",
        success: "bg-[var(--color-success-light)] text-[var(--color-success)]",
        warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
        error: "bg-[var(--color-error-light)] text-[var(--color-error)]",
        info: "bg-[var(--color-info-light)] text-[var(--color-info)]",
        muted: "bg-[var(--color-input)] text-[var(--color-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };



