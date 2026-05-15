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
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (open && !activeId && sessions && sessions.length > 0) setActiveId(sessions[0].id);
  }, [open, sessions, activeId]);

  async function ensureSession(): Promise<string | null> {
    if (activeId) return activeId;
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
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-border bg-card text-foreground sm:w-[480px]"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
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
              <ChatNeedsKeyForm provider={send.error.provider} />
            )}
            <ChatInput
              disabled={send.streaming}
              onSend={async (msg, model) => {
                const id = await ensureSession();
                if (id) await send.send(msg, model);
              }}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
