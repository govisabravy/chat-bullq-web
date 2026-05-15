'use client';
export function ChatMessage({ role, content, streaming }: { role: 'USER' | 'ASSISTANT'; content: string; streaming?: boolean }) {
  const isUser = role === 'USER';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {content}
        {streaming && <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current align-middle" />}
      </div>
    </div>
  );
}
