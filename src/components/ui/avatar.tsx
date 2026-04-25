"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  square?: boolean;
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

function deriveInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt,
  fallback,
  initials,
  size = "md",
  square,
  className,
  ...props
}: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const label = initials ?? fallback ?? alt ?? "?";
  const showImg = src && !errored;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-muted font-medium text-muted-foreground",
        square ? "rounded-md" : "rounded-full",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials ?? deriveInitials(label)}</span>
      )}
    </span>
  );
}
