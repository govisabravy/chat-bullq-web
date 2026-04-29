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
  PauseCircle,
  PlayCircle,
  Bot,
  BotOff,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { inboxService, type Conversation } from '../services/inbox.service';

const channelIcons: Record<string, React.ElementType> = {
  WHATSAPP_ZAPPFY: MessageSquare,
  WHATSAPP_OFFICIAL: Smartphone,
  INSTAGRAM: Instagram,
};

type StatusVariant = 'success' | 'warning' | 'default' | 'info' | 'outline';

const statusVariantMap: Record<string, StatusVariant> = {
  OPEN: 'success',
  PENDING: 'warning',
  CLOSED: 'default',
  BOT: 'info',
  WAITING: 'outline',
};

interface ConversationHeaderProps {
  conversation: Conversation;
  onUpdate: () => void;
}

export function ConversationHeader({ conversation, onUpdate }: ConversationHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const Icon = channelIcons[conversation.channel.type] || MessageSquare;
  const statusVariant = statusVariantMap[conversation.status] ?? 'default';

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

  const queryClient = useQueryClient();

  const pauseMutation = useMutation({
    mutationFn: () => inboxService.pauseAi(conversation.id),
    onSuccess: () => {
      toast.success('IA pausada — você assumiu a conversa');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onUpdate();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Erro ao pausar IA'),
  });

  const resumeMutation = useMutation({
    mutationFn: () => inboxService.resumeAi(conversation.id),
    onSuccess: () => {
      toast.success('IA retomada');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onUpdate();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Erro ao retomar IA'),
  });

  const activateMutation = useMutation({
    mutationFn: () => inboxService.activateAi(conversation.id),
    onSuccess: () => {
      toast.success('IA ativada nesta conversa');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onUpdate();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Erro ao ativar IA'),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => inboxService.deactivateAi(conversation.id),
    onSuccess: () => {
      toast.success('IA desativada nesta conversa');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onUpdate();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Erro ao desativar IA'),
  });

  const displayName =
    conversation.contact.name || conversation.contact.phone || 'Desconhecido';

  return (
    <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-border bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          size="md"
          src={conversation.contact.avatarUrl ?? undefined}
          alt={conversation.contact.name || ''}
          fallback={conversation.contact.name?.slice(0, 2).toUpperCase() || '??'}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </span>
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Badge variant={statusVariant}>{conversation.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {conversation.contact.phone && <span>{conversation.contact.phone}</span>}
            {conversation.protocol && (
              <Badge variant="outline" className="font-mono text-[10px]">
                #{conversation.protocol}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {!conversation.activeAiAgentId && conversation.status !== 'CLOSED' && (
          <Tooltip content="Ativar IA nesta conversa" side="bottom">
            <Button
              variant="primary"
              size="icon"
              onClick={() => activateMutation.mutate()}
              loading={activateMutation.isPending}
            >
              <Bot />
            </Button>
          </Tooltip>
        )}
        {conversation.activeAiAgentId && (
          <Tooltip content="Desativar IA nesta conversa" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deactivateMutation.mutate()}
              loading={deactivateMutation.isPending}
            >
              <BotOff />
            </Button>
          </Tooltip>
        )}
        {conversation.activeAiAgentId && !conversation.aiPaused && (
          <Tooltip content="Pausar IA" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => pauseMutation.mutate()}
              loading={pauseMutation.isPending}
            >
              <PauseCircle />
            </Button>
          </Tooltip>
        )}
        {conversation.activeAiAgentId && conversation.aiPaused && (
          <Tooltip content="Retomar IA" side="bottom">
            <Button
              variant="primary"
              size="icon"
              onClick={() => resumeMutation.mutate()}
              loading={resumeMutation.isPending}
            >
              <PlayCircle />
            </Button>
          </Tooltip>
        )}
        {conversation.status !== 'CLOSED' && !conversation.assignedToId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              handleAction(
                () => inboxService.assignToMe(conversation.id),
                'Conversa atribuída a você',
              )
            }
            loading={isLoading}
          >
            <UserPlus />
            Atribuir a mim
          </Button>
        )}
        {conversation.status !== 'CLOSED' && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-destructive hover:bg-destructive/10"
            onClick={() =>
              handleAction(
                () => inboxService.closeConversation(conversation.id),
                'Conversa encerrada',
              )
            }
            loading={isLoading}
          >
            <XCircle />
            Encerrar
          </Button>
        )}
        {conversation.status === 'CLOSED' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              handleAction(
                () => inboxService.reopenConversation(conversation.id),
                'Conversa reaberta',
              )
            }
            loading={isLoading}
          >
            <RotateCcw />
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
}
