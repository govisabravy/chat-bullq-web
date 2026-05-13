'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  connectAccountSchema,
  reconnectAccountSchema,
  type ConnectAccountFormData,
  type ReconnectAccountFormData,
} from '../schemas/connect-account.schema';
import { useConnectAccount, useReconnect } from '../hooks/use-ad-accounts';

interface ConnectFormProps {
  mode?: 'connect' | 'reconnect';
  accountId?: string;
  accountName?: string;
}

export function ConnectForm({ mode = 'connect', accountId, accountName }: ConnectFormProps) {
  const router = useRouter();
  const connect = useConnectAccount();
  const reconnect = useReconnect();

  if (mode === 'reconnect' && accountId) {
    return <ReconnectFormInner accountId={accountId} accountName={accountName} mutate={reconnect} router={router} />;
  }
  return <ConnectFormInner mutate={connect} router={router} />;
}

function ConnectFormInner({
  mutate,
  router,
}: {
  mutate: ReturnType<typeof useConnectAccount>;
  router: ReturnType<typeof useRouter>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ConnectAccountFormData>({
    resolver: zodResolver(connectAccountSchema),
    defaultValues: { externalId: '', accessToken: '', name: '' },
  });

  const onSubmit = async (data: ConnectAccountFormData) => {
    setServerError(null);
    try {
      const account = await mutate.mutateAsync(data);
      router.push(`/meta-ads/accounts/${account.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="externalId" className="text-sm font-medium">
          Ad Account ID
        </label>
        <input
          id="externalId"
          placeholder="act_123456789"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...form.register('externalId')}
        />
        {form.formState.errors.externalId && (
          <p className="text-xs text-destructive">{form.formState.errors.externalId.message}</p>
        )}
      </div>

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
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nome (opcional)
        </label>
        <input
          id="name"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Sobrescrever nome da conta"
          {...form.register('name')}
        />
      </div>

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
        Conectar
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
      await mutate.mutateAsync({ id: accountId, accessToken: data.accessToken });
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
      </div>

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
