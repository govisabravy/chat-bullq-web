'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ChatNeedsKeyForm } from './chat-needs-key-form';
import { useChatSessions, useCreateChatSession } from '../hooks/use-chat-sessions';
import { useSendChatMessage } from '../hooks/use-send-chat-message';

export function ChatDrawer({ accountId, open, onOpenChange }:
  { accountId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: sessions } = useChatSessions(accountId);
  const createSession = useCreateChatSession(accountId);
  const [activeId, setActiveIdRaw] = useState<string | null>(null);

  const lastKey = `meta-ads-chat:last:${accountId}`;
  const setActiveId = (id: string | null) => {
    setActiveIdRaw(id);
    if (typeof window !== 'undefined' && id) localStorage.setItem(lastKey, id);
  };

  useEffect(() => {
    if (!open || activeId || !sessions || sessions.length === 0) return;
    const remembered = typeof window !== 'undefined' ? localStorage.getItem(lastKey) : null;
    const pick = (remembered && sessions.find((s) => s.id === remembered)) || sessions[0];
    setActiveIdRaw(pick.id);
  }, [open, sessions, activeId, lastKey]);

  async function ensureSession(): Promise<string | null> {
    if (activeId) return activeId;
    if (sessions && sessions.length > 0) {
      setActiveId(sessions[0].id);
      return sessions[0].id;
    }
    const created = await createSession.mutateAsync(undefined);
    setActiveId(created.id);
    return created.id;
  }

  const send = useSendChatMessage(activeId);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col overflow-hidden border-l border-white/[0.06] bg-[#0A0A0B] text-white sm:w-[520px]"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-violet-500/10 mix-blend-normal blur-[128px] animate-pulse" />
              <div className="absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 mix-blend-normal blur-[128px] animate-pulse [animation-delay:700ms]" />
              <div className="absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-fuchsia-500/10 mix-blend-normal blur-[96px] animate-pulse [animation-delay:1000ms]" />
            </div>

            <div className="relative z-10 flex h-full flex-col">
              <ChatHeader
                accountId={accountId}
                sessions={sessions ?? []}
                activeId={activeId}
                onPick={setActiveId}
                onClose={() => onOpenChange(false)}
                onNew={async () => {
                  const created = await createSession.mutateAsync(undefined);
                  setActiveId(created.id);
                }}
              />
              <ChatMessages
                sessionId={activeId}
                partial={send.partial}
                streaming={send.streaming}
                toolCalls={send.toolCalls}
              />
              {send.error?.code === 'NEEDS_KEY' && send.error.provider && (
                <ChatNeedsKeyForm
                  provider={send.error.provider}
                  onSaved={() => send.clearError()}
                />
              )}
              <ChatInput
                disabled={send.streaming}
                onSend={async (msg, model) => {
                  const id = await ensureSession();
                  if (id) await send.send(msg, model);
                }}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
