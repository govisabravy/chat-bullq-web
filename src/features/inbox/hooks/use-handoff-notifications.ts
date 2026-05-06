'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from './use-socket';

type HandoffPayload = {
  conversationId?: string;
  needsHumanAttention?: boolean;
  humanHandoffReason?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

export function useHandoffNotifications() {
  const { on } = useSocket();
  const router = useRouter();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const off = on('conversation:updated', (payload: HandoffPayload) => {
      if (!payload?.needsHumanAttention || !payload.conversationId) return;
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const key = payload.conversationId;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);

      const who = payload.contactName || payload.contactPhone || 'Contato';
      const reason = payload.humanHandoffReason
        ? ` — ${payload.humanHandoffReason}`
        : '';

      try {
        const n = new Notification('Atendimento humano solicitado', {
          body: `${who} pediu para falar com humano${reason}`,
          tag: `handoff-${key}`,
          requireInteraction: true,
          icon: '/favicon.ico',
        });
        n.onclick = () => {
          window.focus();
          router.push(`/inbox?c=${key}`);
          n.close();
        };
      } catch {
        /* noop */
      }
    });
    return () => off?.();
  }, [on, router]);
}
