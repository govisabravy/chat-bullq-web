'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsString } from 'nuqs';
import { ConversationList } from '@/features/inbox/components/conversation-list';
import { ChatPanel } from '@/features/inbox/components/chat-panel';
import { ChatEmptyState } from '@/features/inbox/components/chat-empty-state';
import { inboxService } from '@/features/inbox/services/inbox.service';
import { useInboxRealtime } from '@/features/inbox/hooks/use-inbox-realtime';
import { useHandoffNotifications } from '@/features/inbox/hooks/use-handoff-notifications';

export default function InboxPage() {
  const [activeId, setActiveId] = useQueryState('c', parseAsString);
  const queryClient = useQueryClient();
  useInboxRealtime();
  useHandoffNotifications();

  const { data: activeConversation } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => inboxService.getConversation(activeId as string),
    enabled: !!activeId,
    staleTime: 60 * 1000,
  });

  const handleConversationUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeId] });
      queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
    }
  }, [queryClient, activeId]);

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id);
    },
    [setActiveId],
  );

  const handlePrefetch = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: ['messages', id],
        queryFn: () => inboxService.getMessages(id),
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: ['conversation', id],
        queryFn: () => inboxService.getConversation(id),
        staleTime: 60 * 1000,
      });
    },
    [queryClient],
  );

  return (
    <div className="flex h-full min-h-0 flex-1">
      <ConversationList
        activeId={activeId}
        onSelect={handleSelect}
        onPrefetch={handlePrefetch}
      />

      {activeId && activeConversation ? (
        <ChatPanel
          key={activeId}
          conversation={activeConversation}
          onConversationUpdate={handleConversationUpdate}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background">
          <ChatEmptyState />
        </div>
      )}
    </div>
  );
}
