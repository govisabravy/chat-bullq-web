'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useChatMessages } from '../hooks/use-chat-messages';
import { ChatMessage } from './chat-message';
import { ToolCallChip } from './tool-call-chip';
import type { ChatToolCall } from '../types';

export function ChatMessages({ sessionId, partial, streaming, toolCalls }:
  { sessionId: string | null; partial: string; streaming: boolean; toolCalls: ChatToolCall[] }) {
  const { data, isLoading } = useChatMessages(sessionId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: streaming ? 'auto' : 'smooth' });
  }, [data, partial, toolCalls.length, streaming]);

  const empty = !isLoading && !streaming && (!data || data.length === 0);

  return (
    <div ref={ref} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {isLoading && <div className="text-xs text-white/40">Carregando…</div>}

      {empty && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <h2 className="bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 text-2xl font-medium tracking-tight pb-1">
              Como posso ajudar?
            </h2>
            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
            <p className="text-xs text-white/40">Pergunte sobre campanhas, leads, CPL, top ads…</p>
          </motion.div>
        </div>
      )}

      {(data ?? []).map((m) => (
        <div key={m.id} className="space-y-1">
          <ChatMessage role={m.role} content={m.content} />
          {m.toolCalls?.map((t, i) => <ToolCallChip key={i} call={t} />)}
        </div>
      ))}
      {streaming && (
        <div className="space-y-1">
          {toolCalls.map((t, i) => <ToolCallChip key={`stream-tc-${i}`} call={t} />)}
          <ChatMessage role="ASSISTANT" content={partial} streaming />
        </div>
      )}
    </div>
  );
}
