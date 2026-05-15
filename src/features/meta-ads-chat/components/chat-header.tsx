'use client';
import { X } from 'lucide-react';
import { ChatSessionsMenu } from './chat-sessions-menu';
import type { ChatSession } from '../types';

export function ChatHeader({
  accountId,
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
    <header className="flex items-center justify-between gap-2 border-b border-border bg-popover px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">Chat IA</span>
        <span className="text-xs text-muted-foreground">Conta {accountId}</span>
      </div>
      <div className="flex items-center gap-2">
        <ChatSessionsMenu sessions={sessions} activeId={activeId} onPick={onPick} onNew={onNew} />
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
