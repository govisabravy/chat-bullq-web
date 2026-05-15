'use client';
import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { metaAdsChatService } from '../services/meta-ads-chat.service';
import type { ChatMessage, ChatToolCall, AiProvider } from '../types';

export interface SendState {
  streaming: boolean;
  partial: string;
  toolCalls: ChatToolCall[];
  error: { code: 'NEEDS_KEY' | 'LLM_ERROR' | 'TIMEOUT'; message: string; provider?: AiProvider } | null;
}

export function useSendChatMessage(sessionId: string | null) {
  const qc = useQueryClient();
  const [state, setState] = useState<SendState>({ streaming: false, partial: '', toolCalls: [], error: null });
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (message: string, model: string) => {
    if (!sessionId) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    qc.setQueryData<ChatMessage[]>(['meta-ads-chat-messages', sessionId], (prev) => {
      const optimistic: ChatMessage = {
        id: `tmp-${Date.now()}`,
        role: 'USER',
        content: message,
        createdAt: new Date().toISOString(),
      };
      return prev ? [...prev, optimistic] : [optimistic];
    });

    setState({ streaming: true, partial: '', toolCalls: [], error: null });

    try {
      for await (const ev of metaAdsChatService.streamMessage(sessionId, { message, model }, ac.signal)) {
        if (ev.type === 'token') {
          setState((s) => ({ ...s, partial: s.partial + ev.delta }));
        } else if (ev.type === 'tool_call_start') {
          setState((s) => ({ ...s, toolCalls: [...s.toolCalls, { name: ev.name, args: ev.args, result: null, durationMs: 0 }] }));
        } else if (ev.type === 'tool_call_result') {
          setState((s) => {
            const next = [...s.toolCalls];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].name === ev.name && next[i].result === null) {
                next[i] = { ...next[i], result: ev.result, durationMs: ev.durationMs };
                break;
              }
            }
            return { ...s, toolCalls: next };
          });
        } else if (ev.type === 'tool_call_error') {
          setState((s) => {
            const next = [...s.toolCalls];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].name === ev.name && next[i].result === null) {
                next[i] = { ...next[i], error: ev.error };
                break;
              }
            }
            return { ...s, toolCalls: next };
          });
        } else if (ev.type === 'error') {
          setState((s) => ({ ...s, error: { code: ev.code, message: ev.message, provider: ev.provider } }));
        } else if (ev.type === 'done') {
          await qc.invalidateQueries({ queryKey: ['meta-ads-chat-messages', sessionId] });
          await qc.invalidateQueries({ queryKey: ['meta-ads-chat-sessions'] });
          setState({ streaming: false, partial: '', toolCalls: [], error: null });
          return;
        }
      }
    } catch (err: any) {
      setState((s) => ({ ...s, error: { code: 'LLM_ERROR', message: err?.message ?? 'stream failed' } }));
    } finally {
      setState((s) => ({ ...s, streaming: false }));
    }
  }, [sessionId, qc]);

  const abort = useCallback(() => abortRef.current?.abort(), []);
  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return { ...state, send, abort, clearError };
}
