'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { ExternalLink } from 'lucide-react';
import { ConnectForm } from '@/features/meta-ads/components/connect-form';
import { useAdAccount } from '@/features/meta-ads/hooks/use-ad-accounts';

const LINKS = [
  {
    label: 'Como gerar Access Token (System User)',
    href: 'https://business.facebook.com/settings/system-users',
  },
  {
    label: 'Graph API Explorer (token de usuário)',
    href: 'https://developers.facebook.com/tools/explorer/',
  },
  {
    label: 'Como encontrar Ad Account ID',
    href: 'https://www.facebook.com/business/help/1492627900875762',
  },
];

export default function ConnectPage() {
  const [reconnectId] = useQueryState('reconnect', parseAsString);
  const { data: account } = useAdAccount(reconnectId ?? undefined);
  const isReconnect = !!reconnectId;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isReconnect ? 'Reconectar conta Meta Ads' : 'Conectar conta Meta Ads'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pegue seu Access Token e Ad Account ID no Meta Business:
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {l.label}
          </a>
        ))}
        <p className="text-xs text-muted-foreground">
          Permissões necessárias: <code>ads_read</code>, <code>ads_management</code>, <code>business_management</code>
        </p>
      </div>

      <ConnectForm
        mode={isReconnect ? 'reconnect' : 'connect'}
        accountId={reconnectId ?? undefined}
        accountName={account?.name}
      />
    </div>
  );
}
