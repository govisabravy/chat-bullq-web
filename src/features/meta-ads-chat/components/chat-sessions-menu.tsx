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
        className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
      >
        <span className="max-w-[140px] truncate">{active?.title ?? active?.lastMessagePreview ?? 'Nova conversa'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-md border border-white/[0.08] bg-black/90 backdrop-blur-xl shadow-2xl">
          <div className="max-h-64 overflow-y-auto">
            {sessions.length === 0 && <div className="p-3 text-xs text-white/40">Nenhuma conversa</div>}
            {sessions.map((s) => (
              <button
                key={s.id} type="button"
                onClick={() => { onPick(s.id); setOpen(false); }}
                className={`block w-full truncate px-3 py-2 text-left text-xs transition-colors ${
                  s.id === activeId ? 'bg-white/[0.08] text-white' : 'text-white/70 hover:bg-white/[0.05] hover:text-white/90'
                }`}
              >
                {s.title ?? s.lastMessagePreview ?? 'Sem título'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { onNew(); setOpen(false); }}
            className="flex w-full items-center gap-2 border-t border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Plus className="h-3 w-3" /> Nova conversa
          </button>
        </div>
      )}
    </div>
  );
}
