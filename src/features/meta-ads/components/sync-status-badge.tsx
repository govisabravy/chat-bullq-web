'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdAccount, useTriggerSync } from '../hooks/use-ad-accounts';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

interface SyncStatusBadgeProps {
  accountId: string;
}

export function SyncStatusBadge({ accountId }: SyncStatusBadgeProps) {
  const { data: account } = useAdAccount(accountId);
  const triggerSync = useTriggerSync();
  const [errorOpen, setErrorOpen] = useState(false);

  if (!account) return null;

  if (account.status === 'ERROR') {
    return (
      <Link
        href={`/meta-ads/connect?reconnect=${accountId}`}
        className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-300"
      >
        <AlertCircle className="h-3 w-3" />
        Token expirou · Reconectar
      </Link>
    );
  }

  const status = account.lastSyncStatus;
  const baseStyles =
    status === 'SUCCESS'
      ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'RUNNING'
        ? 'border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300'
        : status === 'FAILED'
          ? 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
          : 'border border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';

  const badgeClass = `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${baseStyles}`;

  const inner = (
    <>
      {status === 'SUCCESS' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'RUNNING' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'FAILED' && <AlertCircle className="h-3 w-3" />}
      {status === 'IDLE' && <Clock className="h-3 w-3" />}
      {status === 'SUCCESS' && `Sincronizado · ${relativeTime(account.lastSyncAt)}`}
      {status === 'RUNNING' && 'Sincronizando…'}
      {status === 'FAILED' && 'Erro · ver detalhes'}
      {status === 'IDLE' && 'Aguardando primeiro sync'}
    </>
  );

  return (
    <div className="flex items-center gap-2">
      {status === 'FAILED' ? (
        <button
          type="button"
          onClick={() => setErrorOpen(true)}
          className={`${badgeClass} cursor-pointer hover:bg-red-500/20`}
          aria-label="Ver detalhes do erro de sync"
        >
          {inner}
        </button>
      ) : (
        <span className={badgeClass} aria-label={`Status de sync: ${status}`}>
          {inner}
        </span>
      )}
      <button
        type="button"
        disabled={triggerSync.isPending || status === 'RUNNING'}
        onClick={() => triggerSync.mutate({ id: accountId, scope: 'all' })}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
        aria-label="Sincronizar agora"
      >
        <RefreshCw className={`h-3 w-3 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
        Sync agora
      </button>

      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro de sincronização</DialogTitle>
            <DialogDescription>
              Última tentativa em {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString('pt-BR') : '—'}.
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
            {account.lastSyncError || 'Sem detalhes do erro retornados pelo backend.'}
          </pre>
          <div className="text-xs text-muted-foreground">
            Dica: erros tipo &quot;User request limit reached&quot; significam que a Meta atingiu o limite de chamadas. Aguarde alguns minutos e tente sync manual de novo.
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setErrorOpen(false);
                triggerSync.mutate({ id: accountId, scope: 'all' });
              }}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar de novo
            </button>
            <button
              type="button"
              onClick={() => setErrorOpen(false)}
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
