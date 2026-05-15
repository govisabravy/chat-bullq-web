'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { metaAdsChatService } from '../services/meta-ads-chat.service';
import type { AiProvider } from '../types';

export function useChatKeys() {
  return useQuery({
    queryKey: ['meta-ads-chat-keys'],
    queryFn: () => metaAdsChatService.listKeys(),
  });
}

export function useUpsertChatKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: AiProvider; apiKey: string }) =>
      metaAdsChatService.upsertKey(provider, apiKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta-ads-chat-keys'] }),
  });
}
