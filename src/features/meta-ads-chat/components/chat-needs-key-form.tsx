'use client';
import { useState } from 'react';
import { useUpsertChatKey } from '../hooks/use-chat-keys';
import type { AiProvider } from '../types';

export function ChatNeedsKeyForm({ provider, onSaved }: { provider: AiProvider; onSaved?: () => void | Promise<void> }) {
  const upsert = useUpsertChatKey();
  const [val, setVal] = useState('');
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="border-t border-amber-400/30 bg-amber-400/[0.06] backdrop-blur-xl px-4 py-3 text-sm">
      <p className="mb-2 text-xs text-amber-200/90">
        Sem chave para o provedor <strong className="text-amber-100">{provider}</strong>. Cole sua chave:
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={`API key ${provider}`}
          className="flex-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/90 placeholder:text-white/30 outline-none focus:border-violet-400/40 focus:bg-white/[0.06] transition-colors"
        />
        <button
          type="button"
          disabled={upsert.isPending || val.length < 10}
          onClick={async () => {
            setErr(null);
            try {
              await upsert.mutateAsync({ provider, apiKey: val });
              setVal('');
              await onSaved?.();
            } catch (e: any) {
              setErr(e?.message ?? 'falhou');
            }
          }}
          className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-[#0A0A0B] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/10"
        >
          {upsert.isPending ? 'Validando…' : 'Salvar'}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
    </div>
  );
}
