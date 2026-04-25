"use client";
import * as React from "react";
import { Checkbox as HuiCheckbox } from "@headlessui/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({ checked, onChange, disabled, className, ...props }: CheckboxProps) {
  return (
    <HuiCheckbox
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "group relative flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background transition-smooth data-[checked]:bg-primary data-[checked]:border-primary focus-visible:outline-none focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <motion.svg
        viewBox="0 0 16 16"
        className="h-3 w-3 pointer-events-none text-primary-foreground"
        initial={false}
      >
        <motion.path
          d="M3 8 L7 12 L13 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.svg>
    </HuiCheckbox>
  );
}
