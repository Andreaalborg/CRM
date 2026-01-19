"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, iconPosition = "left", ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border-2 bg-[var(--color-card)] px-4 py-2 text-base text-[var(--color-foreground)] transition-all duration-200",
            "border-[var(--color-border)]",
            "placeholder:text-[var(--color-muted-foreground)]",
            "hover:border-[var(--color-muted)]",
            "focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-input)]",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
            icon && iconPosition === "left" && "pl-10",
            icon && iconPosition === "right" && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
            {icon}
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };



