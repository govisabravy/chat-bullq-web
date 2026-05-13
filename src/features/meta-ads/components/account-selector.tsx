'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
} from '@/components/ui/dropdown';
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
import { useAdAccounts, useDeleteAccount } from '../hooks/use-ad-accounts';

interface AccountSelectorProps {
  activeAccountId?: string;
}

export function AccountSelector({ activeAccountId }: AccountSelectorProps) {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useAdAccounts();
  const deleteAccount = useDeleteAccount();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const active = accounts.find((a) => a.id === activeAccountId);

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    const wasActive = pendingDelete.id === activeAccountId;
    deleteAccount.mutate(pendingDelete.id, {
      onSuccess: () => {
        if (wasActive) router.push('/meta-ads');
      },
    });
    setPendingDelete(null);
  };

  return (
    <>
      <Dropdown>
        <DropdownButton className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <span className="truncate">
            {isLoading
              ? 'Carregando…'
              : active
                ? `${active.name} · ${active.currency} · ${active.timezone}`
                : 'Selecione conta'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </DropdownButton>
        <DropdownMenu anchor="bottom start" className="min-w-72">
          {accounts.map((a) => (
            <DropdownItem
              key={a.id}
              onClick={() => router.push(`/meta-ads/accounts/${a.id}`)}
            >
              <DropdownLabel>
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.currency} · {a.timezone}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setPendingDelete({ id: a.id, name: a.name });
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Excluir conta ${a.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </DropdownLabel>
            </DropdownItem>
          ))}
          {accounts.length > 0 && <DropdownDivider />}
          <DropdownItem>
            <Link href="/meta-ads/connect" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <DropdownLabel>Conectar nova</DropdownLabel>
            </Link>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{pendingDelete?.name}</span>
              {' será desconectada. Campanhas, ad sets, ads e insights deixarão de aparecer. Você pode reconectar depois.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {deleteAccount.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
