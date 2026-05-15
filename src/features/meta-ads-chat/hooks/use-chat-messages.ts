'use client';
import { useQuery } from '@tanstack/react-query';
import { metaAdsChatService } from '../services/meta-ads-chat.service';

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['meta-ads-chat-messages', sessionId],
    queryFn: () => metaAdsChatService.listMessages(sessionId!),
    enabled: !!sessionId,
  });
}
