'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { inboxService, type Conversation, type Message } from '../services/inbox.service';
import { ChatInput } from './chat-input';
import { ConversationHeader } from './conversation-header';
import { useSocket } from '../hooks/use-socket';

interface ChatPanelProps {
  conversation: Conversation;
  onConversationUpdate: () => void;
}

const statusIcons: Record<string, React.ElementType> = {
  QUEUED: Clock,
  SENT: Check,
  DELIVERED: CheckCheck,
  READ: CheckCheck,
  FAILED: AlertCircle,
};

export function ChatPanel({ conversation, onConversationUpdate }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { on, emit } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => inboxService.getMessages(conversation.id),
  });

  const messages = data?.messages || [];

  useEffect(() => {
    emit('join:conversation', { conversationId: conversation.id });
    return () => {
      emit('leave:conversation', { conversationId: conversation.id });
    };
  }, [conversation.id, emit]);

  useEffect(() => {
    const unsub = on('message:new', (payload: any) => {
      if (payload.conversationId === conversation.id || payload.message?.conversationId === conversation.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });
    return unsub;
  }, [conversation.id, on, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    await inboxService.sendMessage({
      conversationId: conversation.id,
      type: 'TEXT',
      content: { text },
    });
    queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-1 flex-col">
      <ConversationHeader
        conversation={conversation}
        onUpdate={onConversationUpdate}
      />

      <div className="flex-1 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-900/50">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Nenhuma mensagem ainda
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-2">
            {messages.map((msg) => {
              const isOutbound = msg.direction === 'OUTBOUND';
              const StatusIcon = statusIcons[msg.status] || Clock;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOutbound
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-white shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {msg.type === 'TEXT' ? (
                      <p className="whitespace-pre-wrap text-sm">{msg.content?.text}</p>
                    ) : msg.type === 'IMAGE' ? (
                      <div>
                        {msg.content?.mediaUrl && (
                          <img
                            src={msg.content.mediaUrl}
                            alt="Image"
                            className="max-h-64 rounded-lg"
                          />
                        )}
                        {msg.content?.caption && (
                          <p className="mt-1.5 text-sm">{msg.content.caption}</p>
                        )}
                      </div>
                    ) : msg.type === 'AUDIO' ? (
                      <div className="flex items-center gap-2 text-sm">
                        🎵 Mensagem de áudio
                      </div>
                    ) : (
                      <p className="text-sm italic opacity-70">[{msg.type}]</p>
                    )}
                    <div
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        isOutbound ? 'justify-end opacity-70' : 'text-zinc-400'
                      }`}
                    >
                      <span>{formatTime(msg.createdAt)}</span>
                      {isOutbound && (
                        <StatusIcon
                          className={`h-3 w-3 ${msg.status === 'READ' ? 'text-blue-300' : ''}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={conversation.status === 'CLOSED'} />
    </div>
  );
}
