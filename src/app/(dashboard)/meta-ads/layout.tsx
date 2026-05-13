'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Forbidden } from '@/components/ui/forbidden';

export default function MetaAdsLayout({ children }: { children: ReactNode }) {
  const { organizations, activeOrgId } = useAuthStore();
  const role = organizations.find((o) => o.id === activeOrgId)?.role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return <Forbidden />;
  }
  return <div className="h-full overflow-y-auto">{children}</div>;
}
