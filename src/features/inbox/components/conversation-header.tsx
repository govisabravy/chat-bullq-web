'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  UserPlus,
  XCircle,
  RotateCcw,
  MessageSquare,
  Smartphone,
  Instagram,
} from 'lucide-react';
import { inboxService, type Conversation } from '../services/inbox.service';

const channelIcons: Record<string, React.ElementType> = {
  WHATSAPP_ZAPPFY: MessageSquare,
  WHATSAPP_OFFICIAL: Smartphone,
  INSTAGRAM: Instagram,
};

interface ConversationHeaderProps {
  conversation: Conversation;
  onUpdate: () => void;
}

export function ConversationHeader({ conversation, onUpdate }: ConversationHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const Icon = channelIcons[conversation.channel.type] || MessageSquare;

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    setIsLoading(true);
    try {
      await action();
      toast.success(successMsg);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {conversation.contact.name?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {conversation.contact.name || conversation.contact.phone || 'Desconhecido'}
            </span>
            <Icon className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {conversation.contact.phone && <span>{conversation.contact.phone}</span>}
            {conversation.protocol && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono dark:bg-zinc-800">
                #{conversation.protocol}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {conversation.status !== 'CLOSED' && !conversation.assignedToId && (
          <button
            onClick={() =>
              handleAction(
                () => inboxService.assignToMe(conversation.id),
                'Conversa atribuída a você',
              )
            }
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Atribuir a mim
          </button>
        )}
        {conversation.status !== 'CLOSED' && (
          <button
            onClick={() =>
              handleAction(
                () => inboxService.closeConversation(conversation.id),
                'Conversa encerrada',
              )
            }
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <XCircle className="h-3.5 w-3.5" />
            Encerrar
          </button>
        )}
        {conversation.status === 'CLOSED' && (
          <button
            onClick={() =>
              handleAction(
                () => inboxService.reopenConversation(conversation.id),
                'Conversa reaberta',
              )
            }
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reabrir
          </button>
        )}
      </div>
    </div>
  );
}
