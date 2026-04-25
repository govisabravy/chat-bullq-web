"use client";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";

export type BubbleDirection = "inbound" | "outbound";
export type BubbleStatus = "sent" | "delivered" | "read" | "failed";

export interface ChatBubbleProps {
  direction: BubbleDirection;
  children: React.ReactNode;
  timestamp: string;
  status?: BubbleStatus;
}

export function ChatBubble({ direction, children, timestamp, status }: ChatBubbleProps) {
  const outbound = direction === "outbound";
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("flex w-full", outbound ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-xs",
          outbound
            ? "bg-primary/90 text-primary-foreground rounded-br-sm"
            : "bg-card border border-border text-card-foreground rounded-bl-sm"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{children}</div>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
          <span>{timestamp}</span>
          {outbound && status ? (
            status === "read" ? <CheckCheck className="h-3 w-3" />
            : status === "delivered" ? <CheckCheck className="h-3 w-3 opacity-60" />
            : status === "sent" ? <Check className="h-3 w-3" />
            : null
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
