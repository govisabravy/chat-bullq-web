'use client';
import { ChevronDown, Wrench } from 'lucide-react';
import { useState } from 'react';
import type { ChatToolCall } from '../types';

export function ToolCallChip({ call }: { call: ChatToolCall }) {
  const [open, setOpen] = useState(false);
  const errored = !!call.error;
  return (
    <div
      className={`mt-1 rounded-md border text-xs ${
        errored ? 'border-red-500/40 bg-red-500/10' : 'border-border bg-muted/40'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-2 py-1"
      >
        <span className="flex items-center gap-2">
          <Wrench className="h-3 w-3" />
          <code>{call.name}</code>
          {call.durationMs > 0 && <span className="text-muted-foreground">{call.durationMs}ms</span>}
          {errored && <span className="text-red-500">erro</span>}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <pre className="max-h-48 overflow-auto border-t border-border bg-background/40 p-2 text-[11px] leading-snug">
{JSON.stringify({ args: call.args, ...(errored ? { error: call.error } : { result: call.result }) }, null, 2)}
        </pre>
      )}
    </div>
  );
}
