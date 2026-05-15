'use client';
import { useEffect, useRef } from 'react';
import { useChatMessages } from '../hooks/use-chat-messages';
import { ChatMessage } from './chat-message';
import { ToolCallChip } from './tool-call-chip';
import type { ChatToolCall } from '../types';

export function ChatMessages({ sessionId, partial, streaming, toolCalls }:
  { sessionId: string | null; partial: string; streaming: boolean; toolCalls: ChatToolCall[] }) {
  const { data, isLoading } = useChatMessages(sessionId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [data, partial, toolCalls.length]);

  return (
    <div ref={ref} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {isLoading && <div className="text-xs text-muted-foreground">Carregando…</div>}
      {(data ?? []).map((m) => (
        <div key={m.id}>
          <ChatMessage role={m.role} content={m.content} />
          {m.toolCalls?.map((t, i) => <ToolCallChip key={i} call={t} />)}
        </div>
      ))}
      {streaming && (
        <div>
          {toolCalls.map((t, i) => <ToolCallChip key={`stream-tc-${i}`} call={t} />)}
          {partial && <ChatMessage role="ASSISTANT" content={partial} streaming />}
        </div>
      )}
    </div>
  );
}
