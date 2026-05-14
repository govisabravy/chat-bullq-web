'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ExternalLink, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useDisconnectZoho,
  useUpsertZohoConnection,
  useZohoConnection,
} from '@/features/integrations/hooks/use-zoho-connection';

const schema = z.object({
  clientId: z.string().min(10, 'Client ID muito curto'),
  clientSecret: z.string().min(10, 'Client Secret muito curto'),
  refreshToken: z.string().min(10, 'Refresh Token muito curto'),
  apiDomain: z.string().optional(),
  accountsDomain: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ZohoIntegrationPage() {
  const { data: connection, isLoading } = useZohoConnection();
  const upsert = useUpsertZohoConnection();
  const disconnect = useDisconnectZoho();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      apiDomain: 'https://www.zohoapis.com',
      accountsDomain: 'https://accounts.zoho.com',
    },
  });

  useEffect(() => {
    if (connection) {
      form.setValue('clientId', connection.clientId);
      form.setValue('apiDomain', connection.apiDomain);
      form.setValue('accountsDomain', connection.accountsDomain);
    }
  }, [connection, form]);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await upsert.mutateAsync(data);
      form.setValue('clientSecret', '');
      form.setValue('refreshToken', '');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integração Zoho CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte seu Zoho CRM (somente leitura) pra que agentes IA marcados como &quot;Requer cliente CRM&quot; possam acessar dados do contato durante o atendimento.
        </p>
      </div>

      {connection && (
        <Card className={connection.lastError ? 'border-amber-500/40' : 'border-emerald-500/40'}>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            {connection.lastError ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {connection.lastError ? 'Conectado com erro' : 'Conectado'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Client ID: <code>{connection.clientId.slice(0, 20)}…</code>
              </div>
              <div className="text-xs text-muted-foreground">
                Validado em: {connection.lastValidatedAt
                  ? new Date(connection.lastValidatedAt).toLocaleString('pt-BR')
                  : '—'}
              </div>
              {connection.lastError && (
                <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Último erro: {connection.lastError}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfirmDisconnect(true)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Desconectar
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <h2 className="text-base font-semibold">
            {connection ? 'Atualizar credenciais' : 'Conectar pela primeira vez'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie um Self Client em{' '}
            <a
              href="https://api-console.zoho.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              api-console.zoho.com <ExternalLink className="h-3 w-3" />
            </a>
            . Escopo mínimo: <code>ZohoCRM.modules.READ</code>, <code>ZohoCRM.settings.READ</code>.
          </p>

          {isLoading ? (
            <div className="mt-4 h-32 animate-pulse rounded-md bg-muted/40" />
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label htmlFor="clientId" className="text-sm font-medium">Client ID</label>
                <input
                  id="clientId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="1000.XXXXXXXXXXXXXXXXXXXX"
                  {...form.register('clientId')}
                />
                {form.formState.errors.clientId && (
                  <p className="text-xs text-destructive">{form.formState.errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="clientSecret" className="text-sm font-medium">Client Secret</label>
                <input
                  id="clientSecret"
                  type="password"
                  placeholder={connection ? '••••••••• (deixe pra reusar o salvo)' : '••••••••••'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...form.register('clientSecret')}
                />
                {form.formState.errors.clientSecret && (
                  <p className="text-xs text-destructive">{form.formState.errors.clientSecret.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="refreshToken" className="text-sm font-medium">Refresh Token</label>
                <input
                  id="refreshToken"
                  type="password"
                  placeholder={connection ? '••••••••• (deixe pra reusar o salvo)' : '1000.xxxx.xxxx'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...form.register('refreshToken')}
                />
                {form.formState.errors.refreshToken && (
                  <p className="text-xs text-destructive">{form.formState.errors.refreshToken.message}</p>
                )}
              </div>

              <details className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  Avançado: domínios (raramente precisa mudar)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <label htmlFor="apiDomain" className="text-xs font-medium">API Domain</label>
                    <input
                      id="apiDomain"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...form.register('apiDomain')}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Padrão: <code>https://www.zohoapis.com</code> (US). Pra EU use <code>.eu</code>, IN <code>.in</code>, AU <code>.com.au</code>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="accountsDomain" className="text-xs font-medium">Accounts Domain</label>
                    <input
                      id="accountsDomain"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...form.register('accountsDomain')}
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
                disabled={upsert.isPending}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {connection ? 'Atualizar' : 'Conectar'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDisconnect} onOpenChange={(o) => !o && setConfirmDisconnect(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Zoho?</AlertDialogTitle>
            <AlertDialogDescription>
              Agentes que dependem de match de cliente CRM vão parar de responder até reconectar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                disconnect.mutate();
                setConfirmDisconnect(false);
              }}
            >
              {disconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desconectar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
