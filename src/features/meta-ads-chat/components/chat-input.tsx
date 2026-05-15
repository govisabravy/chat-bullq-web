'use client';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { ChatModelSelector } from './chat-model-selector';
import { DEFAULT_MODEL_ID } from '../constants';

export function ChatInput({ disabled, onSend }: { disabled?: boolean; onSend: (msg: string, model: string) => void | Promise<void> }) {
  const [value, setValue] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [value]);

  const submit = () => {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg, model);
    setValue('');
  };

  return (
    <div className="border-t border-border bg-popover p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder="Pergunte sobre essa conta…"
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#1488fc] to-[#1172e2] text-white disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <ChatModelSelector value={model} onChange={setModel} />
        <span className="text-[10px] text-muted-foreground">Enter envia · Shift+Enter quebra linha</span>
      </div>
    </div>
  );
}
