'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './use-socket';

export function useInboxRealtime() {
  const qc = useQueryClient();
  const { on } = useSocket();

  useEffect(() => {
    const unsubs = [
      on('message:new', (payload: any) => {
        qc.invalidateQueries({ queryKey: ['conversations'] });
        const convId = payload?.conversationId || payload?.message?.conversationId;
        if (convId) {
          qc.invalidateQueries({ queryKey: ['messages', convId] });
          qc.invalidateQueries({ queryKey: ['conversation', convId] });
        }
      }),
      on('message:updated', (payload: any) => {
        const convId = payload?.conversationId || payload?.message?.conversationId;
        if (convId) {
          qc.invalidateQueries({ queryKey: ['messages', convId] });
        }
        qc.invalidateQueries({ queryKey: ['conversations'] });
      }),
      on('conversation:new', () => {
        qc.invalidateQueries({ queryKey: ['conversations'] });
      }),
      on('conversation:updated', (payload: any) => {
        qc.invalidateQueries({ queryKey: ['conversations'] });
        const convId = payload?.conversationId;
        if (convId) {
          qc.invalidateQueries({ queryKey: ['conversation', convId] });
        }
      }),
    ];
    return () => unsubs.forEach((u) => u?.());
  }, [on, qc]);
}
