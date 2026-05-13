'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdAccounts } from '@/features/meta-ads/hooks/use-ad-accounts';

export default function MetaAdsIndexPage() {
  const router = useRouter();
  const { data: accounts, isLoading } = useAdAccounts();

  useEffect(() => {
    if (!isLoading) {
      if (!accounts || accounts.length === 0) {
        router.replace('/meta-ads/connect');
      } else {
        router.replace(`/meta-ads/accounts/${accounts[0].id}`);
      }
    }
  }, [accounts, isLoading, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
