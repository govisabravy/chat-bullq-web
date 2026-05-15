'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { metaAdsChatService } from '../services/meta-ads-chat.service';

export function useChatSessions(accountId: string) {
  return useQuery({
    queryKey: ['meta-ads-chat-sessions', accountId],
    queryFn: () => metaAdsChatService.listSessions(accountId),
    enabled: !!accountId,
  });
}

export function useCreateChatSession(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => metaAdsChatService.createSession(accountId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta-ads-chat-sessions', accountId] }),
  });
}

export function useDeleteChatSession(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => metaAdsChatService.deleteSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta-ads-chat-sessions', accountId] }),
  });
}
