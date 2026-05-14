'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, Search, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  reconnectAccountSchema,
  type ReconnectAccountFormData,
} from '../schemas/connect-account.schema';
import {
  useConnectAccount,
  useDiscoverAccounts,
  useReconnect,
} from '../hooks/use-ad-accounts';
import type { DiscoveredAdAccount } from '../services/meta-ads.service';
import { z } from 'zod';

interface ConnectFormProps {
  mode?: 'connect' | 'reconnect';
  accountId?: string;
  accountName?: string;
}

export function ConnectForm({ mode = 'connect', accountId, accountName }: ConnectFormProps) {
  const router = useRouter();
  const reconnect = useReconnect();

  if (mode === 'reconnect' && accountId) {
    return <ReconnectFormInner accountId={accountId} accountName={accountName} mutate={reconnect} router={router} />;
  }
  return <ConnectFlow router={router} />;
}

const discoverSchema = z.object({
  accessToken: z.string().min(20, 'Token muito curto'),
  appId: z.string().optional(),
  appSecret: z.string().optional(),
});
type DiscoverFormData = z.infer<typeof discoverSchema>;

function ConnectFlow({ router }: { router: ReturnType<typeof useRouter> }) {
  const discover = useDiscoverAccounts();
  const connect = useConnectAccount();
  const [step, setStep] = useState<1 | 2>(1);
  const [credentials, setCredentials] = useState<DiscoverFormData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<DiscoverFormData>({
    resolver: zodResolver(discoverSchema),
    defaultValues: { accessToken: '', appId: '', appSecret: '' },
  });

  const onDiscover = async (data: DiscoverFormData) => {
    setServerError(null);
    try {
      await discover.mutateAsync(data);
      setCredentials(data);
      setStep(2);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  const onPickAccount = async (account: DiscoveredAdAccount) => {
    if (!credentials) return;
    setServerError(null);
    try {
      const created = await connect.mutateAsync({
        externalId: account.externalId,
        accessToken: credentials.accessToken,
        appId: credentials.appId || undefined,
        appSecret: credentials.appSecret || undefined,
        name: account.name,
      });
      router.push(`/meta-ads/accounts/${created.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  if (step === 2 && discover.data) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar
        </button>

        <div>
          <h2 className="text-base font-semibold">Selecione a conta de anúncio</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {discover.data.length} conta{discover.data.length === 1 ? '' : 's'} encontrada{discover.data.length === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="space-y-2">
          {discover.data.map((a) => {
            const inactive = a.accountStatus !== null && a.accountStatus !== 1;
            return (
              <button
                key={a.externalId}
                type="button"
                disabled={a.alreadyConnected || connect.isPending}
                onClick={() => onPickAccount(a)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{a.name}</span>
                    {a.alreadyConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Já conectada
                      </span>
                    )}
                    {inactive && (
                      <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                        Inativa
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                    {a.externalId} · {a.currency} · {a.timezone}
                  </div>
                </div>
                {connect.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </button>
            );
          })}
        </div>

        {serverError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onDiscover)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="accessToken" className="text-sm font-medium">
          Access Token
        </label>
        <textarea
          id="accessToken"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="EAA..."
          {...form.register('accessToken')}
        />
        {form.formState.errors.accessToken && (
          <p className="text-xs text-destructive">{form.formState.errors.accessToken.message}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Token de usuário ou system-user. Próximo step lista as contas que esse token pode ler.
        </p>
      </div>

      <details className="rounded-md border border-border bg-muted/20 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Avançado: credenciais do FB App (token vira 60d)
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Se você passar App ID + App Secret, o backend troca o token curto (1-2h) por long-lived (~60d) antes de salvar. Reconnect futuro reusa essas credenciais.
          </p>
          <div className="space-y-2">
            <label htmlFor="appId" className="text-xs font-medium">App ID</label>
            <input
              id="appId"
              placeholder="959171176921194"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('appId')}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="appSecret" className="text-xs font-medium">App Secret</label>
            <input
              id="appSecret"
              type="password"
              placeholder="••••••••"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('appSecret')}
            />
          </div>
        </div>
      </details>

      {serverError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={discover.isPending}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {discover.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Buscar contas disponíveis
      </button>
    </form>
  );
}

function ReconnectFormInner({
  accountId,
  accountName,
  mutate,
  router,
}: {
  accountId: string;
  accountName?: string;
  mutate: ReturnType<typeof useReconnect>;
  router: ReturnType<typeof useRouter>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ReconnectAccountFormData>({
    resolver: zodResolver(reconnectAccountSchema),
    defaultValues: { accessToken: '' },
  });

  const onSubmit = async (data: ReconnectAccountFormData) => {
    setServerError(null);
    try {
      await mutate.mutateAsync({
        id: accountId,
        accessToken: data.accessToken,
        appId: data.appId,
        appSecret: data.appSecret,
      });
      router.push(`/meta-ads/accounts/${accountId}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Reconectando: <span className="font-medium text-foreground">{accountName ?? accountId}</span>
      </p>

      <div className="space-y-2">
        <label htmlFor="accessToken" className="text-sm font-medium">
          Novo Access Token
        </label>
        <textarea
          id="accessToken"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="EAA..."
          {...form.register('accessToken')}
        />
        {form.formState.errors.accessToken && (
          <p className="text-xs text-destructive">{form.formState.errors.accessToken.message}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Se a conta tem App ID + App Secret salvos, são reusados pra trocar por long-lived. Sobrescreva abaixo se quiser.
        </p>
      </div>

      <details className="rounded-md border border-border bg-muted/20 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Avançado: sobrescrever App ID / App Secret
        </summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <label htmlFor="appId" className="text-xs font-medium">App ID</label>
            <input
              id="appId"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('appId')}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="appSecret" className="text-xs font-medium">App Secret</label>
            <input
              id="appSecret"
              type="password"
              placeholder="••••••••"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('appSecret')}
            />
          </div>
        </div>
      </details>

      {serverError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={mutate.isPending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {mutate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reconectar
      </button>
    </form>
  );
}
