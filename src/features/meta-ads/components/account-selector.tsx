'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus } from 'lucide-react';
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
} from '@/components/ui/dropdown';
import { useAdAccounts } from '../hooks/use-ad-accounts';

interface AccountSelectorProps {
  activeAccountId?: string;
}

export function AccountSelector({ activeAccountId }: AccountSelectorProps) {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useAdAccounts();
  const active = accounts.find((a) => a.id === activeAccountId);

  return (
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
      <DropdownMenu anchor="bottom start" className="min-w-64">
        {accounts.map((a) => (
          <DropdownItem key={a.id} onClick={() => router.push(`/meta-ads/accounts/${a.id}`)}>
            <DropdownLabel>
              <div>{a.name}</div>
              <div className="text-xs text-muted-foreground">
                {a.currency} · {a.timezone}
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
  );
}
