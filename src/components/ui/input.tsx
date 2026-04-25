"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, iconLeft, iconRight, invalid, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {iconLeft ? (
          <span className="pointer-events-none absolute left-3 flex h-4 w-4 items-center justify-center text-muted-foreground">
            {iconLeft}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm transition-smooth placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
            iconLeft && "pl-9",
            iconRight && "pr-9",
            invalid && "border-destructive focus-visible:border-destructive",
            className
          )}
          {...props}
        />
        {iconRight ? (
          <span className="pointer-events-none absolute right-3 flex h-4 w-4 items-center justify-center text-muted-foreground">
            {iconRight}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
