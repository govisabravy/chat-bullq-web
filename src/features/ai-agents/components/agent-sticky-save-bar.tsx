"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export interface AgentStickySaveBarProps {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function AgentStickySaveBar({ dirty, saving, onSave, onDiscard }: AgentStickySaveBarProps) {
  return (
    <AnimatePresence>
      {dirty ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="sticky bottom-4 z-20 mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-lg border border-border bg-popover/95 backdrop-blur px-4 py-2.5 shadow-soft"
        >
          <span className="text-sm text-muted-foreground">Alterações não salvas</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>Descartar</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={onSave}>Salvar</Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
