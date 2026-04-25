"use client";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

export function ChatEmptyState() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-6 w-6" />
      </div>
      <p className="text-sm">Selecione uma conversa para começar</p>
    </motion.div>
  );
}
