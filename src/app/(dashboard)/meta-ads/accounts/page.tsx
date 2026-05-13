'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, RefreshCw, MoreVertical, Loader2 } from 'lucide-react';
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
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
} from '@/components/ui/dropdown';
import {
  useAdAccounts,
  useDeleteAccount,
  useTriggerSync,
} from '@/features/meta-ads/hooks/use-ad-accounts';
import { SyncStatusBadge } from '@/features/meta-ads/components/sync-status-badge';

export default function AccountsListPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useAdAccounts();
  const deleteAccount = useDeleteAccount();
  const triggerSync = useTriggerSync();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Contas Meta Ads</h1>
        <Link
          href="/meta-ads/connect"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nova conta
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma conta conectada ainda.</p>
            <Link
              href="/meta-ads/connect"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Conectar conta Meta
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => (
            <Card key={a.id} className={a.status === 'ERROR' ? 'border-amber-500/40' : ''}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => router.push(`/meta-ads/accounts/${a.id}`)}
                >
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.externalId} · {a.currency} · {a.timezone}
                  </div>
                </button>
                <SyncStatusBadge accountId={a.id} />
                <Dropdown>
                  <DropdownButton className="rounded-md p-1 hover:bg-muted">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end" className="min-w-44">
                    <DropdownItem
                      onClick={() => triggerSync.mutate({ id: a.id, scope: 'all' })}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <DropdownLabel>Sincronizar agora</DropdownLabel>
                    </DropdownItem>
                    <DropdownItem onClick={() => setPendingDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                      <DropdownLabel>Excluir</DropdownLabel>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta será desconectada e seus dados (campanhas, ad sets, ads, insights)
              não aparecerão mais nesta tela. Você pode reconectar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  deleteAccount.mutate(pendingDelete);
                  setPendingDelete(null);
                }
              }}
            >
              {deleteAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
