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
          {partial
            ? <ChatMessage role="ASSISTANT" content={partial} streaming />
            : toolCalls.length === 0 && <ThinkingBubble />}
        </div>
      )}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5">
        <div className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-white/[0.08]">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-violet-200"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <span className="text-xs text-white/60">Pensando</span>
        <TypingDots />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1 w-1 rounded-full bg-white/70"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
