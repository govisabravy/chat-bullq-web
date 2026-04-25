"use client";
import * as React from "react";
import {
  Dialog as HuiDialog,
  DialogPanel,
  DialogTitle as HuiDialogTitle,
  DialogBackdrop,
} from "@headlessui/react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <HuiDialog open={open} onClose={() => onOpenChange(false)} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </HuiDialog>
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
} as const;

export function DialogContent({ children, className, size = "md", ...props }: DialogContentProps) {
  return (
    <DialogPanel
      transition
      className={cn(
        "w-full transform rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-soft transition duration-200 data-[closed]:scale-95 data-[closed]:opacity-0",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {children}
    </DialogPanel>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <HuiDialogTitle
      as="h2"
      className={cn("text-base font-semibold text-foreground", className)}
    >
      {children}
    </HuiDialogTitle>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}
