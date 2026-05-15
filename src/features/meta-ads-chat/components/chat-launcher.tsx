'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatDrawer } from './chat-drawer';

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const params = useParams<{ accId?: string }>();
  const accId = params?.accId;
  if (!accId) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Abrir chat IA"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#1488fc] to-[#1172e2] text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      <ChatDrawer accountId={accId} open={open} onOpenChange={setOpen} />
    </>
  );
}
