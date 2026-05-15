'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderIcon, SendIcon } from 'lucide-react';
import { ChatModelSelector } from './chat-model-selector';
import { DEFAULT_MODEL_ID } from '../constants';

export function ChatInput({ disabled, onSend }: { disabled?: boolean; onSend: (msg: string, model: string) => void | Promise<void> }) {
  const [value, setValue] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);
  const [focused, setFocused] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '60px';
    ta.style.height = Math.min(Math.max(ta.scrollHeight, 60), 200) + 'px';
  }, [value]);

  const submit = () => {
    const msg = value.trim();
    if (!msg || disabled) return;
    setValue('');
    onSend(msg, model);
  };

  const hasText = !!value.trim();

  return (
    <div className="px-4 pb-4 pt-2">
      <motion.div
        className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="relative p-3">
          <textarea
            ref={taRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Pergunte sobre essa conta…"
            disabled={disabled}
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-white/90 placeholder:text-white/25 outline-none min-h-[60px]"
            style={{ overflow: 'hidden' }}
          />
          <AnimatePresence>
            {focused && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-violet-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-3 py-2">
          <ChatModelSelector value={model} onChange={setModel} />
          <motion.button
            type="button"
            onClick={submit}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            disabled={disabled || !hasText}
            className={
              'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ' +
              (hasText && !disabled
                ? 'bg-white text-[#0A0A0B] shadow-lg shadow-white/10'
                : 'bg-white/[0.05] text-white/40')
            }
            aria-label="Enviar"
          >
            {disabled ? (
              <LoaderIcon className="h-4 w-4 animate-[spin_2s_linear_infinite]" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span>Enviar</span>
          </motion.button>
        </div>
      </motion.div>
      <p className="mt-2 text-center text-[10px] text-white/30">Enter envia · Shift+Enter quebra linha</p>
    </div>
  );
}
