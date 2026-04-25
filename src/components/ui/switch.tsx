"use client";
import * as React from "react";
import { Switch as HuiSwitch } from "@headlessui/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Switch({ checked, onChange, disabled, className, ...props }: SwitchProps) {
  return (
    <HuiSwitch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-smooth focus-visible:outline-none focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted",
        className
      )}
      {...props}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-background shadow-xs",
          checked ? "ml-4" : "ml-0.5"
        )}
      />
    </HuiSwitch>
  );
}
