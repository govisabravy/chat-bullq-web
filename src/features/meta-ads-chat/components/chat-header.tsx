'use client';
import { Sparkles, X } from 'lucide-react';
import { ChatSessionsMenu } from './chat-sessions-menu';
import type { ChatSession } from '../types';

export function ChatHeader({
  sessions,
  activeId,
  onPick,
  onNew,
  onClose,
}: {
  accountId: string;
  sessions: ChatSession[];
  activeId: string | null;
  onPick: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-xl px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-white/[0.08]">
          <Sparkles className="h-3.5 w-3.5 text-violet-200" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-white/90">Camila Analytics</span>
          <span className="text-[10px] text-white/40">Análise de Meta Ads</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ChatSessionsMenu sessions={sessions} activeId={activeId} onPick={onPick} onNew={onNew} />
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-white/50 hover:bg-white/[0.06] hover:text-white/90 transition-colors" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
