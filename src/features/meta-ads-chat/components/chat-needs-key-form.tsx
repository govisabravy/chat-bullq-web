'use client';
import { useState } from 'react';
import { useUpsertChatKey } from '../hooks/use-chat-keys';
import type { AiProvider } from '../types';

export function ChatNeedsKeyForm({ provider, onSaved }: { provider: AiProvider; onSaved?: () => void | Promise<void> }) {
  const upsert = useUpsertChatKey();
  const [val, setVal] = useState('');
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="border-t border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p className="mb-2 text-xs">
        Sem chave para o provedor <strong>{provider}</strong>. Cole a sua chave abaixo:
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={`API key ${provider}`}
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs outline-none"
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
          className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
        >
          {upsert.isPending ? 'Validando…' : 'Salvar'}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  );
}
