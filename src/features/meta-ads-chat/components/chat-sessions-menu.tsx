'use client';
import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ChatSession } from '../types';

export function ChatSessionsMenu({ sessions, activeId, onPick, onNew }:
  { sessions: ChatSession[]; activeId: string | null; onPick: (id: string) => void; onNew: () => void }) {
  const [open, setOpen] = useState(false);
  const active = sessions.find((s) => s.id === activeId);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
      >
        <span className="max-w-[140px] truncate">{active?.title ?? active?.lastMessagePreview ?? 'Nova conversa'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-64 overflow-hidden rounded border border-border bg-popover shadow-md">
          <div className="max-h-64 overflow-y-auto">
            {sessions.length === 0 && <div className="p-3 text-xs text-muted-foreground">Nenhuma conversa</div>}
            {sessions.map((s) => (
              <button
                key={s.id} type="button"
                onClick={() => { onPick(s.id); setOpen(false); }}
                className={`block w-full truncate px-3 py-2 text-left text-xs hover:bg-muted ${s.id === activeId ? 'bg-muted' : ''}`}
              >
                {s.title ?? s.lastMessagePreview ?? 'Sem título'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { onNew(); setOpen(false); }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-xs hover:bg-muted"
          >
            <Plus className="h-3 w-3" /> Nova conversa
          </button>
        </div>
      )}
    </div>
  );
}
