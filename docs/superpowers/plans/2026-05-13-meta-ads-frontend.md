# Meta Ads Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/meta-ads/*` area in the Next.js frontend so OWNER/ADMIN users can connect Meta Ad Accounts, see sync status, browse campaigns → ad sets → ads with metrics, and view a creative preview.

**Architecture:** New `features/meta-ads/` module mirroring the existing `features/<name>/{components,services,hooks,schemas}/` convention. Routes live under `app/(dashboard)/meta-ads/`. A route-group `layout.tsx` performs a client-side role guard rendering a reusable `<Forbidden />` component for AGENT users. All server data flows through React Query hooks that wrap a single typed `metaAdsService` axios layer.

**Tech Stack:** Next 16 (App Router) + React 19 + TypeScript 5.7 + Tailwind 4 + @tanstack/react-query + zustand (auth-store) + nuqs (URL state) + recharts + react-hook-form + zod + sonner + lucide-react.

**Spec:** `docs/superpowers/specs/2026-05-13-meta-ads-frontend-design.md`

**Backend endpoints reference:** see backend spec at `../chat-bullq-api-main/docs/superpowers/specs/2026-05-12-meta-ads-ingestion-design.md` section 7.

**No test infrastructure:** the front repo has no jest/vitest/playwright today. **No tests added in this plan.** Verification is manual via `pnpm dev` + browser. Type-check (`pnpm exec tsc --noEmit`) and lint (`pnpm lint`) are the per-task gates.

---

## File Structure

### Created files

```
src/features/meta-ads/
├── services/
│   └── meta-ads.service.ts
├── schemas/
│   └── connect-account.schema.ts
├── hooks/
│   ├── use-ad-accounts.ts
│   ├── use-campaigns.ts
│   ├── use-ad-sets.ts
│   ├── use-ads.ts
│   └── use-insights.ts
└── components/
    ├── account-selector.tsx
    ├── date-range-picker.tsx
    ├── sync-status-badge.tsx
    ├── metric-card.tsx
    ├── metrics-table.tsx
    ├── spend-over-time-chart.tsx
    └── connect-form.tsx

src/app/(dashboard)/meta-ads/
├── layout.tsx
├── page.tsx
├── connect/page.tsx
├── accounts/page.tsx
├── accounts/[accId]/page.tsx
├── campaigns/[campaignId]/page.tsx
├── ad-sets/[adSetId]/page.tsx
└── ads/[adId]/page.tsx

src/components/ui/forbidden.tsx
```

### Modified files

```
src/components/layout/app-sidebar.tsx
```

### Responsibilities

- **services/meta-ads.service.ts** — single object `metaAdsService` with one method per backend endpoint; extracts `data.data` from the axios envelope (existing convention from `dashboardService`).
- **schemas/connect-account.schema.ts** — zod schemas for `<ConnectForm>` (connect + reconnect modes).
- **hooks/*** — thin React Query wrappers; own all cache keys, polling rules, toast side effects, and invalidations. Pages never call services directly.
- **components/*** — presentational; data fetching only inside `account-selector` (it is itself the picker that lists accounts) and `sync-status-badge` (reads live account state).
- **layout.tsx** — client role guard; renders `<Forbidden />` if `activeOrg.role` is neither OWNER nor ADMIN.
- **page.tsx** — redirect logic (`/meta-ads` → first account or `/connect`).
- **forbidden.tsx** — reusable 403 page component in `components/ui/` (no Meta-specific content; usable elsewhere later).
- **app-sidebar.tsx** — add "Meta Ads" nav item with role filter.

---

## Task 1: Service + Types

**Files:**
- Create: `src/features/meta-ads/services/meta-ads.service.ts`

- [ ] **Step 1: Create the service file**

```ts
import { api } from '@/lib/api';

export type MetaAdAccountStatus = 'ACTIVE' | 'DISABLED' | 'PENDING' | 'ERROR';
export type MetaSyncStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
export type MetaCampaignStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
export type MetaInsightLevel = 'ACCOUNT' | 'CAMPAIGN' | 'ADSET' | 'AD';
export type MetaInsightMetric =
  | 'impressions' | 'clicks' | 'spend' | 'conversions' | 'ctr' | 'cpc' | 'cpm';

export interface AdAccount {
  id: string;
  externalId: string;
  name: string;
  currency: string;
  timezone: string;
  status: MetaAdAccountStatus;
  lastSyncAt: string | null;
  lastSyncStatus: MetaSyncStatus;
  lastSyncError: string | null;
  createdAt: string;
}

export interface Metrics {
  impressions: number;
  clicks: number;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  conversions: number;
  conversionValue: string;
  roas: string | null;
}

export interface CampaignWithMetrics {
  id: string;
  externalId: string;
  name: string;
  status: MetaCampaignStatus;
  objective: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  metrics: Metrics;
}

export interface AdSetWithMetrics {
  id: string;
  externalId: string;
  name: string;
  status: MetaCampaignStatus;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  optimizationGoal: string | null;
  metrics: Metrics;
}

export interface AdWithMetrics {
  id: string;
  externalId: string;
  name: string;
  status: MetaCampaignStatus;
  creative: { id: string; thumbnailUrl: string | null; title: string | null } | null;
  metrics: Metrics;
}

export interface AdDetail extends AdWithMetrics {
  creative: { id: string; thumbnailUrl: string | null; title: string | null; body?: string | null; callToAction?: string | null } | null;
}

export interface TimeseriesPoint { date: string; value: number | string }

export interface AccountSummary {
  totals: {
    impressions: number;
    clicks: number;
    spend: string;
    conversions: number;
    conversionValue: string;
  };
  deltaVsPrevious: {
    spend: number | null;
    impressions: number | null;
    clicks: number | null;
    conversions: number | null;
  };
  topCampaigns: Array<{
    campaignId: string | null;
    name: string;
    spend: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
}

export interface ConnectAccountPayload {
  externalId: string;
  accessToken: string;
  name?: string;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export interface CampaignListParams extends DateRange {
  status?: MetaCampaignStatus;
  sort?: 'spend' | 'impressions' | 'clicks' | 'ctr';
}

export interface TimeseriesParams extends DateRange {
  accountId: string;
  level: MetaInsightLevel;
  entityId?: string;
  metric: MetaInsightMetric;
}

export interface SummaryParams extends DateRange {
  accountId: string;
}

function paramsOf(input: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

export const metaAdsService = {
  // Accounts
  async connectAccount(payload: ConnectAccountPayload): Promise<AdAccount> {
    const { data } = await api.post('/meta-ads/accounts', payload);
    return data.data;
  },
  async listAccounts(): Promise<AdAccount[]> {
    const { data } = await api.get('/meta-ads/accounts');
    return data.data;
  },
  async getAccount(id: string): Promise<AdAccount> {
    const { data } = await api.get(`/meta-ads/accounts/${id}`);
    return data.data;
  },
  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/meta-ads/accounts/${id}`);
  },
  async triggerSync(id: string, scope?: 'hierarchy' | 'insights' | 'all'): Promise<{ jobId: string }> {
    const { data } = await api.post(`/meta-ads/accounts/${id}/sync`, scope ? { scope } : {});
    return data.data;
  },
  async reconnect(id: string, accessToken: string): Promise<AdAccount> {
    const { data } = await api.post(`/meta-ads/accounts/${id}/reconnect`, { accessToken });
    return data.data;
  },

  // Hierarchy
  async listCampaigns(accId: string, params: CampaignListParams = {}): Promise<CampaignWithMetrics[]> {
    const { data } = await api.get(`/meta-ads/accounts/${accId}/campaigns`, {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
  async getCampaign(campaignId: string, params: DateRange = {}): Promise<CampaignWithMetrics> {
    const { data } = await api.get(`/meta-ads/campaigns/${campaignId}`, {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
  async listAdSets(campaignId: string, params: DateRange = {}): Promise<AdSetWithMetrics[]> {
    const { data } = await api.get(`/meta-ads/campaigns/${campaignId}/ad-sets`, {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
  async getAdSet(adSetId: string, params: DateRange = {}): Promise<AdSetWithMetrics> {
    const { data } = await api.get(`/meta-ads/ad-sets/${adSetId}`, {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
  async listAds(adSetId: string, params: DateRange = {}): Promise<AdWithMetrics[]> {
    const { data } = await api.get(`/meta-ads/ad-sets/${adSetId}/ads`, {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
  async getAd(adId: string, params: DateRange = {}): Promise<AdDetail> {
    const { data } = await api.get(`/meta-ads/ads/${adId}`, {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },

  // Insights
  async timeseries(params: TimeseriesParams): Promise<TimeseriesPoint[]> {
    const { data } = await api.get('/meta-ads/insights/timeseries', {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
  async summary(params: SummaryParams): Promise<AccountSummary> {
    const { data } = await api.get('/meta-ads/insights/summary', {
      params: paramsOf(params as Record<string, string | undefined>),
    });
    return data.data;
  },
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/meta-ads/services/meta-ads.service.ts
git commit -m "feat(meta-ads): add metaAdsService with typed Meta Ads API client"
```

---

## Task 2: Connect Form Schema

**Files:**
- Create: `src/features/meta-ads/schemas/connect-account.schema.ts`

- [ ] **Step 1: Create the file**

```ts
import { z } from 'zod';

export const connectAccountSchema = z.object({
  externalId: z
    .string()
    .regex(/^act_\d+$/, 'ID deve começar com act_ seguido de números'),
  accessToken: z.string().min(20, 'Token muito curto'),
  name: z.string().optional(),
});

export type ConnectAccountFormData = z.infer<typeof connectAccountSchema>;

export const reconnectAccountSchema = z.object({
  accessToken: z.string().min(20, 'Token muito curto'),
});

export type ReconnectAccountFormData = z.infer<typeof reconnectAccountSchema>;
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/meta-ads/schemas/connect-account.schema.ts
git commit -m "feat(meta-ads): add zod schemas for connect and reconnect forms"
```

---

## Task 3: Hook — Ad Accounts

**Files:**
- Create: `src/features/meta-ads/hooks/use-ad-accounts.ts`

- [ ] **Step 1: Create the file**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AdAccount,
  ConnectAccountPayload,
  metaAdsService,
} from '../services/meta-ads.service';

export function useAdAccounts() {
  return useQuery({
    queryKey: ['meta-ads', 'accounts'],
    queryFn: () => metaAdsService.listAccounts(),
    staleTime: 60_000,
  });
}

export function useAdAccount(id: string | null | undefined) {
  return useQuery({
    queryKey: ['meta-ads', 'accounts', id],
    queryFn: () => metaAdsService.getAccount(id as string),
    enabled: !!id,
    refetchInterval: (query) => {
      const d = query.state.data as AdAccount | undefined;
      return d?.lastSyncStatus === 'RUNNING' ? 30_000 : false;
    },
  });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConnectAccountPayload) => metaAdsService.connectAccount(payload),
    onSuccess: (account) => {
      toast.success(`Conta ${account.name} conectada`);
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao conectar conta');
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metaAdsService.deleteAccount(id),
    onSuccess: () => {
      toast.success('Conta removida');
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover conta');
    },
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; scope?: 'hierarchy' | 'insights' | 'all' }) =>
      metaAdsService.triggerSync(args.id, args.scope),
    onSuccess: (_data, vars) => {
      toast.success('Sync iniciado');
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts', vars.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar sync');
    },
  });
}

export function useReconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; accessToken: string }) =>
      metaAdsService.reconnect(args.id, args.accessToken),
    onSuccess: (account) => {
      toast.success(`Conta ${account.name} reconectada`);
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts'] });
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts', account.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao reconectar');
    },
  });
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/hooks/use-ad-accounts.ts
git commit -m "feat(meta-ads): ad-accounts hooks with 30s polling on RUNNING"
```

---

## Task 4: Hooks — Hierarchy (campaigns, ad sets, ads)

**Files:**
- Create: `src/features/meta-ads/hooks/use-campaigns.ts`
- Create: `src/features/meta-ads/hooks/use-ad-sets.ts`
- Create: `src/features/meta-ads/hooks/use-ads.ts`

- [ ] **Step 1: `use-campaigns.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { CampaignListParams, DateRange, metaAdsService } from '../services/meta-ads.service';

export function useCampaigns(accId: string | null | undefined, params: CampaignListParams = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'campaigns', accId, params],
    queryFn: () => metaAdsService.listCampaigns(accId as string, params),
    enabled: !!accId,
    staleTime: 60_000,
  });
}

export function useCampaign(campaignId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'campaign', campaignId, params],
    queryFn: () => metaAdsService.getCampaign(campaignId as string, params),
    enabled: !!campaignId,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 2: `use-ad-sets.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { DateRange, metaAdsService } from '../services/meta-ads.service';

export function useAdSets(campaignId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ad-sets', campaignId, params],
    queryFn: () => metaAdsService.listAdSets(campaignId as string, params),
    enabled: !!campaignId,
    staleTime: 60_000,
  });
}

export function useAdSet(adSetId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ad-set', adSetId, params],
    queryFn: () => metaAdsService.getAdSet(adSetId as string, params),
    enabled: !!adSetId,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 3: `use-ads.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { DateRange, metaAdsService } from '../services/meta-ads.service';

export function useAds(adSetId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ads', adSetId, params],
    queryFn: () => metaAdsService.listAds(adSetId as string, params),
    enabled: !!adSetId,
    staleTime: 60_000,
  });
}

export function useAd(adId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ad', adId, params],
    queryFn: () => metaAdsService.getAd(adId as string, params),
    enabled: !!adId,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 4: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/hooks/use-campaigns.ts \
        src/features/meta-ads/hooks/use-ad-sets.ts \
        src/features/meta-ads/hooks/use-ads.ts
git commit -m "feat(meta-ads): hierarchy hooks (campaigns, ad sets, ads)"
```

---

## Task 5: Hooks — Insights

**Files:**
- Create: `src/features/meta-ads/hooks/use-insights.ts`

- [ ] **Step 1: Create the file**

```ts
import { useQuery } from '@tanstack/react-query';
import { SummaryParams, TimeseriesParams, metaAdsService } from '../services/meta-ads.service';

export function useTimeseries(params: TimeseriesParams) {
  return useQuery({
    queryKey: ['meta-ads', 'timeseries', params],
    queryFn: () => metaAdsService.timeseries(params),
    enabled: !!params.accountId && !!params.from && !!params.to,
    staleTime: 60_000,
  });
}

export function useSummary(params: SummaryParams) {
  return useQuery({
    queryKey: ['meta-ads', 'summary', params],
    queryFn: () => metaAdsService.summary(params),
    enabled: !!params.accountId && !!params.from && !!params.to,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/hooks/use-insights.ts
git commit -m "feat(meta-ads): insights hooks (timeseries, summary)"
```

---

## Task 6: Forbidden UI Component

**Files:**
- Create: `src/components/ui/forbidden.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

export interface ForbiddenProps {
  title?: string;
  description?: string;
  href?: string;
  cta?: string;
}

export function Forbidden({
  title = 'Sem acesso',
  description = 'Você não tem permissão para acessar essa área. Fale com um administrador da organização.',
  href = '/inbox',
  cta = 'Voltar pro inbox',
}: ForbiddenProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <ShieldOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {cta}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/components/ui/forbidden.tsx
git commit -m "feat(ui): add reusable Forbidden 403 component"
```

---

## Task 7: Component — ConnectForm

**Files:**
- Create: `src/features/meta-ads/components/connect-form.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/connect-form.tsx
git commit -m "feat(meta-ads): ConnectForm with connect and reconnect modes"
```

---

## Task 8: Component — DateRangePicker

**Files:**
- Create: `src/features/meta-ads/components/date-range-picker.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
} from '@/components/ui/dropdown';

function isoDay(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const PRESETS: Array<{ label: string; days: number }> = [
  { label: 'Hoje', days: 0 },
  { label: 'Ontem', days: 1 },
  { label: 'Últimos 7 dias', days: 6 },
  { label: 'Últimos 14 dias', days: 13 },
  { label: 'Últimos 30 dias', days: 29 },
  { label: 'Últimos 90 dias', days: 89 },
];

export function useDateRange() {
  const [from, setFrom] = useQueryState('from', parseAsString.withDefault(isoDay(6)));
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(isoDay(0)));
  return { from, to, setFrom, setTo };
}

export function DateRangePicker() {
  const { from, to, setFrom, setTo } = useDateRange();
  const [customMode, setCustomMode] = useState(false);

  const applyPreset = (days: number) => {
    if (days === 1) {
      const yesterday = isoDay(1);
      setFrom(yesterday);
      setTo(yesterday);
    } else if (days === 0) {
      const today = isoDay(0);
      setFrom(today);
      setTo(today);
    } else {
      setFrom(isoDay(days));
      setTo(isoDay(0));
    }
    setCustomMode(false);
  };

  const label = customMode
    ? `${from} — ${to}`
    : (PRESETS.find((p) => {
        if (p.days === 0) return from === isoDay(0) && to === isoDay(0);
        if (p.days === 1) return from === isoDay(1) && to === isoDay(1);
        return from === isoDay(p.days) && to === isoDay(0);
      })?.label ?? `${from} — ${to}`);

  return (
    <Dropdown>
      <DropdownButton className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <Calendar className="h-4 w-4" />
        <span>{label}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownButton>
      <DropdownMenu anchor="bottom start" className="min-w-56">
        {PRESETS.map((p) => (
          <DropdownItem key={p.label} onClick={() => applyPreset(p.days)}>
            <DropdownLabel>{p.label}</DropdownLabel>
          </DropdownItem>
        ))}
        <DropdownItem onClick={() => setCustomMode(true)}>
          <DropdownLabel>Personalizado…</DropdownLabel>
        </DropdownItem>
        {customMode && (
          <div className="space-y-2 p-2">
            <input
              type="date"
              value={from ?? ''}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
            <input
              type="date"
              value={to ?? ''}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/date-range-picker.tsx
git commit -m "feat(meta-ads): DateRangePicker with presets and URL state via nuqs"
```

---

## Task 9: Component — AccountSelector

**Files:**
- Create: `src/features/meta-ads/components/account-selector.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/account-selector.tsx
git commit -m "feat(meta-ads): AccountSelector dropdown with router-driven navigation"
```

---

## Task 10: Component — SyncStatusBadge

**Files:**
- Create: `src/features/meta-ads/components/sync-status-badge.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import Link from 'next/link';
import { useAdAccount, useTriggerSync } from '../hooks/use-ad-accounts';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

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

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
          status === 'SUCCESS'
            ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : status === 'RUNNING'
              ? 'border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300'
              : status === 'FAILED'
                ? 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
                : 'border border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300'
        }`}
        title={account.lastSyncError ?? undefined}
        aria-label={`Status de sync: ${status}`}
      >
        {status === 'SUCCESS' && <CheckCircle2 className="h-3 w-3" />}
        {status === 'RUNNING' && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === 'FAILED' && <AlertCircle className="h-3 w-3" />}
        {status === 'IDLE' && <Clock className="h-3 w-3" />}
        {status === 'SUCCESS' && `Sincronizado · ${relativeTime(account.lastSyncAt)}`}
        {status === 'RUNNING' && 'Sincronizando…'}
        {status === 'FAILED' && 'Erro · ver detalhes'}
        {status === 'IDLE' && 'Aguardando primeiro sync'}
      </span>
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
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/sync-status-badge.tsx
git commit -m "feat(meta-ads): SyncStatusBadge with live status pill and Sync now button"
```

---

## Task 11: Component — MetricCard

**Files:**
- Create: `src/features/meta-ads/components/metric-card.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  icon?: ReactNode;
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function MetricCard({ label, value, delta, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {delta !== undefined && delta !== null && (
          <div
            className={`mt-2 inline-flex items-center gap-1 text-xs ${
              delta > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : delta < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
            }`}
          >
            {delta > 0 ? <ArrowUp className="h-3 w-3" /> : delta < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            <span>{Math.abs(delta) >= 1_000 ? formatNumber(Math.abs(delta)) : Math.abs(delta).toLocaleString('pt-BR')} vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/metric-card.tsx
git commit -m "feat(meta-ads): MetricCard with delta indicator and number formatting"
```

---

## Task 12: Component — MetricsTable

**Files:**
- Create: `src/features/meta-ads/components/metrics-table.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { Metrics, MetaCampaignStatus } from '../services/meta-ads.service';

interface MetricsTableRow {
  id: string;
  name: string;
  status: MetaCampaignStatus;
  objective?: string | null;
  metrics: Metrics;
}

interface MetricsTableProps<T extends MetricsTableRow> {
  items: T[];
  showObjective?: boolean;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}

const STATUS_STYLES: Record<MetaCampaignStatus, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

function fmtCurrency(s: string): string {
  const n = parseFloat(s);
  if (!isFinite(n)) return s;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
}

function fmtNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtPercent(s: string): string {
  const n = parseFloat(s);
  if (!isFinite(n)) return s;
  return `${n.toFixed(2)}%`;
}

export function MetricsTable<T extends MetricsTableRow>({
  items,
  showObjective,
  onRowClick,
  emptyLabel = 'Nenhum item no período.',
}: MetricsTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Nome</th>
            {showObjective && <th className="px-3 py-2 text-left">Objetivo</th>}
            <th className="px-3 py-2 text-right">Spend</th>
            <th className="px-3 py-2 text-right">Impr</th>
            <th className="px-3 py-2 text-right">Clicks</th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">CPC</th>
            <th className="px-3 py-2 text-right">Conv</th>
            <th className="px-3 py-2 text-right">ROAS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((row) => (
            <tr
              key={row.id}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/40' : ''}
              onClick={() => onRowClick?.(row)}
            >
              <td className="px-3 py-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase ${STATUS_STYLES[row.status]}`}
                  aria-label={`Status: ${row.status}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-2 font-medium">{row.name}</td>
              {showObjective && (
                <td className="px-3 py-2 text-xs text-muted-foreground">{row.objective ?? '—'}</td>
              )}
              <td className="px-3 py-2 text-right">{fmtCurrency(row.metrics.spend)}</td>
              <td className="px-3 py-2 text-right">{fmtNumber(row.metrics.impressions)}</td>
              <td className="px-3 py-2 text-right">{fmtNumber(row.metrics.clicks)}</td>
              <td className="px-3 py-2 text-right">{fmtPercent(row.metrics.ctr)}</td>
              <td className="px-3 py-2 text-right">{fmtCurrency(row.metrics.cpc)}</td>
              <td className="px-3 py-2 text-right">{fmtNumber(row.metrics.conversions)}</td>
              <td className="px-3 py-2 text-right">{row.metrics.roas ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/metrics-table.tsx
git commit -m "feat(meta-ads): MetricsTable reusable for campaigns/ad sets/ads"
```

---

## Task 13: Component — SpendOverTimeChart

**Files:**
- Create: `src/features/meta-ads/components/spend-over-time-chart.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from '@/features/dashboard/components/chart-tooltip';
import { TimeseriesPoint } from '../services/meta-ads.service';

interface SpendOverTimeChartProps {
  data: TimeseriesPoint[];
  loading?: boolean;
}

export function SpendOverTimeChart({ data, loading }: SpendOverTimeChartProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }
  const chartData = data.map((p) => ({
    date: p.date,
    value: typeof p.value === 'string' ? parseFloat(p.value) : p.value,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 270)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="oklch(0.68 0.15 230)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/features/meta-ads/components/spend-over-time-chart.tsx
git commit -m "feat(meta-ads): SpendOverTimeChart wrapping recharts LineChart"
```

---

## Task 14: Page — Layout + Index Redirect

**Files:**
- Create: `src/app/(dashboard)/meta-ads/layout.tsx`
- Create: `src/app/(dashboard)/meta-ads/page.tsx`

- [ ] **Step 1: `layout.tsx`**

```tsx
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
  return <>{children}</>;
}
```

- [ ] **Step 2: `page.tsx`**

```tsx
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
```

- [ ] **Step 3: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/app/\(dashboard\)/meta-ads/layout.tsx src/app/\(dashboard\)/meta-ads/page.tsx
git commit -m "feat(meta-ads): route group layout with role guard and index redirect"
```

(If your shell doesn't like the parentheses-escape, quote the paths: `"src/app/(dashboard)/meta-ads/layout.tsx"` etc.)

---

## Task 15: Page — Connect

**Files:**
- Create: `src/app/(dashboard)/meta-ads/connect/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/(dashboard)/meta-ads/connect/page.tsx"
git commit -m "feat(meta-ads): connect page with external doc links and connect/reconnect form"
```

---

## Task 16: Page — Accounts List

**Files:**
- Create: `src/app/(dashboard)/meta-ads/accounts/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
  AlertDialogTrigger,
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
                      disabled={triggerSync.isPending}
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
```

If `AlertDialogTrigger` is imported but not used, remove it. If your `<AlertDialog>` API differs (e.g. controlled via `open` prop), the code above already uses controlled mode; otherwise adapt to whatever the repo's primitive supports — read `src/components/ui/alert-dialog.tsx` first.

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/(dashboard)/meta-ads/accounts/page.tsx"
git commit -m "feat(meta-ads): accounts list page with sync status, kebab menu, delete dialog"
```

---

## Task 17: Page — Account Dashboard

**Files:**
- Create: `src/app/(dashboard)/meta-ads/accounts/[accId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useEffect, use, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, Eye, MousePointerClick, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdAccount } from '@/features/meta-ads/hooks/use-ad-accounts';
import { useCampaigns } from '@/features/meta-ads/hooks/use-campaigns';
import { useSummary, useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { AccountSelector } from '@/features/meta-ads/components/account-selector';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { SyncStatusBadge } from '@/features/meta-ads/components/sync-status-badge';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { MetricsTable } from '@/features/meta-ads/components/metrics-table';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';

export default function AccountDashboardPage({ params }: { params: Promise<{ accId: string }> }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { accId } = use(params);
  const { from, to } = useDateRange();
  const { data: account } = useAdAccount(accId);
  const { data: summary } = useSummary({ accountId: accId, from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: accId,
    level: 'ACCOUNT',
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });
  const { data: campaigns = [] } = useCampaigns(accId, { from: from ?? undefined, to: to ?? undefined });

  // Invalidate campaigns/summary when sync transitions RUNNING -> SUCCESS
  useEffect(() => {
    if (account?.lastSyncStatus === 'SUCCESS') {
      qc.invalidateQueries({ queryKey: ['meta-ads', 'campaigns', accId] });
      qc.invalidateQueries({ queryKey: ['meta-ads', 'summary'] });
    }
  }, [account?.lastSyncStatus, account?.lastSyncAt, accId, qc]);

  const totals = summary?.totals;
  const delta = summary?.deltaVsPrevious;

  const spendDisplay = useMemo(() => {
    if (!totals?.spend) return '—';
    const n = parseFloat(totals.spend);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: account?.currency ?? 'USD' });
  }, [totals?.spend, account?.currency]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-background py-2">
        <AccountSelector activeAccountId={accId} />
        <DateRangePicker />
        <div className="ml-auto">
          <SyncStatusBadge accountId={accId} />
        </div>
      </div>

      {account?.status === 'ERROR' && (
        <div className="flex items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-5 w-5" />
          <div className="flex-1">
            Token expirou. Reconecte para continuar a sincronização.
          </div>
          <Link href={`/meta-ads/connect?reconnect=${accId}`} className="font-medium underline">
            Reconectar
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Spend"
          value={spendDisplay}
          delta={delta?.spend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          label="Impressões"
          value={totals?.impressions ?? 0}
          delta={delta?.impressions}
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          label="Clicks"
          value={totals?.clicks ?? 0}
          delta={delta?.clicks}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <MetricCard
          label="Conversões"
          value={totals?.conversions ?? 0}
          delta={delta?.conversions}
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Spend ao longo do tempo</h3>
          <div className="mt-4">
            <SpendOverTimeChart data={timeseries ?? []} loading={tsLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Campanhas</h3>
          <div className="mt-4">
            <MetricsTable
              items={campaigns}
              showObjective
              onRowClick={(c) => router.push(`/meta-ads/campaigns/${c.id}`)}
              emptyLabel="Nenhuma campanha no período."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/(dashboard)/meta-ads/accounts/[accId]/page.tsx"
git commit -m "feat(meta-ads): account dashboard with KPI cards, chart, and campaigns table"
```

---

## Task 18: Page — Campaign Drill (Ad Sets)

**Files:**
- Create: `src/app/(dashboard)/meta-ads/campaigns/[campaignId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Eye, MousePointerClick, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCampaign } from '@/features/meta-ads/hooks/use-campaigns';
import { useAdSets } from '@/features/meta-ads/hooks/use-ad-sets';
import { useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { MetricsTable } from '@/features/meta-ads/components/metrics-table';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function CampaignDrillPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const router = useRouter();
  const { campaignId } = use(params);
  const { from, to } = useDateRange();
  const { data: campaign } = useCampaign(campaignId, { from: from ?? undefined, to: to ?? undefined });
  const { data: adSets = [] } = useAdSets(campaignId, { from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: campaign ? '' : '', // not used by backend for level=CAMPAIGN with entityId
    level: 'CAMPAIGN',
    entityId: campaign?.externalId,
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });

  const spendDisplay = useMemo(() => {
    if (!campaign?.metrics?.spend) return '—';
    const n = parseFloat(campaign.metrics.spend);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
  }, [campaign?.metrics?.spend]);

  if (!campaign) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/meta-ads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <DateRangePicker />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs uppercase ${STATUS_STYLES[campaign.status]}`}>
            {campaign.status}
          </span>
        </div>
        {campaign.objective && (
          <p className="mt-1 text-sm text-muted-foreground">Objetivo: {campaign.objective}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Spend" value={spendDisplay} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Impressões" value={campaign.metrics.impressions} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clicks" value={campaign.metrics.clicks} icon={<MousePointerClick className="h-4 w-4" />} />
        <MetricCard label="Conversões" value={campaign.metrics.conversions} icon={<Target className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Spend ao longo do tempo</h3>
          <div className="mt-4">
            <SpendOverTimeChart data={timeseries ?? []} loading={tsLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Ad sets</h3>
          <div className="mt-4">
            <MetricsTable
              items={adSets}
              onRowClick={(a) => router.push(`/meta-ads/ad-sets/${a.id}`)}
              emptyLabel="Nenhum ad set no período."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Note:** The timeseries query requires `accountId`. The campaign's parent account ID is on the backend via the relation, but the campaign DTO does NOT expose it. Backend exposes the endpoint signature `GET /insights/timeseries?accountId&level&entityId&...`. Since fetching the parent `accountId` would require either an extra round-trip or extending the campaign DTO, **adjust the timeseries query to be conditional**:

Replace the `useTimeseries({ ... })` block in the code above with this conditional pattern:

```tsx
const { data: timeseries, isLoading: tsLoading } = useTimeseries({
  accountId: (campaign as any)?.adAccountId ?? '',
  level: 'CAMPAIGN',
  entityId: campaign?.externalId,
  from: from ?? undefined,
  to: to ?? undefined,
  metric: 'spend',
});
```

And **also include `adAccountId` in the backend `CampaignDetail` response** if it isn't already. **Check the backend response** at `chat-bullq-api-main/src/modules/meta-ads/hierarchy/hierarchy.service.ts:getCampaign(...)` — the current implementation does NOT include `adAccountId` in the response. If missing, add it as part of executing this task: edit the service mapper to include `adAccountId: campaign.adAccountId` and update `CampaignWithMetrics` in this repo's `meta-ads.service.ts` to include the new optional field. Commit that change separately in the backend repo if you have access; otherwise file a follow-up.

Type-check + commit at the end of the task as usual.

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/(dashboard)/meta-ads/campaigns/[campaignId]/page.tsx"
git commit -m "feat(meta-ads): campaign drill page (ad sets table + chart)"
```

---

## Task 19: Page — Ad Set Drill (Ads)

**Files:**
- Create: `src/app/(dashboard)/meta-ads/ad-sets/[adSetId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Eye, MousePointerClick, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdSet } from '@/features/meta-ads/hooks/use-ad-sets';
import { useAds } from '@/features/meta-ads/hooks/use-ads';
import { useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { MetricsTable } from '@/features/meta-ads/components/metrics-table';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function AdSetDrillPage({ params }: { params: Promise<{ adSetId: string }> }) {
  const router = useRouter();
  const { adSetId } = use(params);
  const { from, to } = useDateRange();
  const { data: adSet } = useAdSet(adSetId, { from: from ?? undefined, to: to ?? undefined });
  const { data: ads = [] } = useAds(adSetId, { from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: (adSet as any)?.adAccountId ?? '',
    level: 'ADSET',
    entityId: adSet?.externalId,
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });

  const spendDisplay = useMemo(() => {
    if (!adSet?.metrics?.spend) return '—';
    const n = parseFloat(adSet.metrics.spend);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
  }, [adSet?.metrics?.spend]);

  if (!adSet) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/meta-ads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <DateRangePicker />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{adSet.name}</h1>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs uppercase ${STATUS_STYLES[adSet.status]}`}>
            {adSet.status}
          </span>
        </div>
        {adSet.optimizationGoal && (
          <p className="mt-1 text-sm text-muted-foreground">Otimização: {adSet.optimizationGoal}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Spend" value={spendDisplay} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Impressões" value={adSet.metrics.impressions} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clicks" value={adSet.metrics.clicks} icon={<MousePointerClick className="h-4 w-4" />} />
        <MetricCard label="Conversões" value={adSet.metrics.conversions} icon={<Target className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Spend ao longo do tempo</h3>
          <div className="mt-4">
            <SpendOverTimeChart data={timeseries ?? []} loading={tsLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Ads</h3>
          <div className="mt-4">
            <MetricsTable
              items={ads}
              onRowClick={(a) => router.push(`/meta-ads/ads/${a.id}`)}
              emptyLabel="Nenhum ad no período."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/(dashboard)/meta-ads/ad-sets/[adSetId]/page.tsx"
git commit -m "feat(meta-ads): ad set drill page (ads table + chart)"
```

---

## Task 20: Page — Ad Detail (Creative Preview)

**Files:**
- Create: `src/app/(dashboard)/meta-ads/ads/[adId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Eye, MousePointerClick, Target, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAd } from '@/features/meta-ads/hooks/use-ads';
import { useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function AdDetailPage({ params }: { params: Promise<{ adId: string }> }) {
  const { adId } = use(params);
  const { from, to } = useDateRange();
  const { data: ad } = useAd(adId, { from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: (ad as any)?.adAccountId ?? '',
    level: 'AD',
    entityId: ad?.externalId,
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });

  const spendDisplay = useMemo(() => {
    if (!ad?.metrics?.spend) return '—';
    const n = parseFloat(ad.metrics.spend);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
  }, [ad?.metrics?.spend]);

  if (!ad) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/meta-ads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <DateRangePicker />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{ad.name}</h1>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs uppercase ${STATUS_STYLES[ad.status]}`}>
            {ad.status}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-5 md:grid-cols-[200px_1fr]">
          <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 md:h-auto">
            {ad.creative?.thumbnailUrl ? (
              <img
                src={ad.creative.thumbnailUrl}
                alt={ad.creative.title ?? ad.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Título</div>
              <div>{ad.creative?.title ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Body</div>
              <div className="whitespace-pre-wrap">{ad.creative?.body ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Call to Action</div>
              <div>{ad.creative?.callToAction ?? '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Spend" value={spendDisplay} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Impressões" value={ad.metrics.impressions} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clicks" value={ad.metrics.clicks} icon={<MousePointerClick className="h-4 w-4" />} />
        <MetricCard label="Conversões" value={ad.metrics.conversions} icon={<Target className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Spend ao longo do tempo</h3>
          <div className="mt-4">
            <SpendOverTimeChart data={timeseries ?? []} loading={tsLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/(dashboard)/meta-ads/ads/[adId]/page.tsx"
git commit -m "feat(meta-ads): ad detail page with creative preview and metrics"
```

---

## Task 21: Sidebar — Add Meta Ads Nav with Role Filter

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: Read the current file** to locate the `navItems` array.

- [ ] **Step 2: Update imports — add `TrendingUp` from lucide**

Change the existing lucide import line to include `TrendingUp`:

```ts
import {
  MessageSquare,
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronsUpDown,
  Building2,
  ChevronUp,
  Bot,
  TrendingUp,
} from 'lucide-react';
```

- [ ] **Step 3: Update `navItems` to include a `roles` field and add Meta Ads**

Replace the existing `navItems` declaration with:

```ts
const navItems: Array<{
  href: string;
  label: string;
  icon: typeof MessageSquare;
  roles?: Array<'OWNER' | 'ADMIN' | 'AGENT'>;
}> = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/contacts', label: 'Contatos', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meta-ads', label: 'Meta Ads', icon: TrendingUp, roles: ['OWNER', 'ADMIN'] },
  { href: '/settings/ai-agents', label: 'Agentes IA', icon: Bot },
];
```

- [ ] **Step 4: Filter `navItems` by `activeOrg.role` inside the component**

Inside `AppSidebar`, after the `activeOrg` lookup line, add:

```ts
const visibleItems = navItems.filter(
  (item) => !item.roles || (activeOrg?.role && item.roles.includes(activeOrg.role as 'OWNER' | 'ADMIN' | 'AGENT')),
);
```

Then change the `.map((item) => ...)` over `navItems` to map over `visibleItems` instead.

- [ ] **Step 5: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/components/layout/app-sidebar.tsx
git commit -m "feat(layout): add Meta Ads sidebar item with role-based visibility"
```

---

## Task 22: Manual Smoke Test (No Code)

This task validates the area end-to-end. No commit.

**Prerequisites:**
- Backend running (`pnpm run start:dev` in `chat-bullq-api-main`) with at least one connected Meta account that has finished its first sync.
- Frontend running (`pnpm dev` in `chat-bullq-web-main`).
- Logged in as a user who is OWNER or ADMIN of an org with that account connected.

- [ ] **Step 1: Sidebar visibility** — confirm "Meta Ads" appears for OWNER/ADMIN, hidden for AGENT.

- [ ] **Step 2: AGENT URL access** — log in as AGENT, navigate to `/meta-ads/accounts`. Expect `<Forbidden />` page.

- [ ] **Step 3: Index redirect** — back as OWNER/ADMIN, navigate to `/meta-ads`. Expect redirect to first account dashboard (or `/connect` if none).

- [ ] **Step 4: Connect flow** — go to `/meta-ads/connect`, verify the three external doc links open in new tabs, paste a valid `act_<id>` + token, submit, expect redirect to `/meta-ads/accounts/{newId}`. Try also an invalid token to verify the inline error.

- [ ] **Step 5: Account dashboard** — verify KPI cards populate, delta indicators show ↑/↓ correctly, chart renders, campaigns table sorts by spend desc by default.

- [ ] **Step 6: Date range picker** — change preset to "Últimos 30 dias", verify URL updates `?from&to` and data refetches.

- [ ] **Step 7: Drill-down** — click a campaign row → ad sets table → click an ad-set row → ads table → click an ad → ad detail with creative preview (thumbnail or `ImageOff` icon fallback).

- [ ] **Step 8: Sync status badge** — click "Sync agora", observe badge transition to "Sincronizando…" (blue, pulse), wait for completion, expect transition to "Sincronizado · agora" (green). Verify campaigns table data refreshes automatically.

- [ ] **Step 9: Reconnect flow** — manually mark an account `status='ERROR'` in the DB (or wait for a real token expiry), reload the dashboard. Expect the amber banner + "Reconectar" link. Click it, paste a fresh token, expect redirect back to the dashboard with status `SUCCESS`.

- [ ] **Step 10: Empty states** — disconnect all accounts (or test with a fresh org). Verify `/meta-ads` redirects to `/connect`, `/meta-ads/accounts` shows the empty card CTA.

If any step fails, file a follow-up issue or fix inline. No commit unless a code change is needed.

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task(s) |
|--------------|---------|
| §2 Tech stack alignment | All tasks reuse existing libs; no new deps. |
| §3 User-visible behavior | Tasks 7, 14–22. |
| §5 Module layout | Tasks 1–21 mirror this layout file-for-file. |
| §6 Data model & types | Task 1. |
| §7 Service surface | Task 1. |
| §8 React Query hooks | Tasks 3, 4, 5. |
| §9 Component contracts | Tasks 7–13. |
| §10 Page specifications | Tasks 14–20. |
| §10 Sidebar update | Task 21. |
| §11 Loading/empty/error states | Embedded in pages (Tasks 14–20) and components (Task 10 for badge errors, Task 12 empty-state). |
| §12 Real-time/polling | Task 3 (`refetchInterval`) + Task 17 (invalidation on SUCCESS). |
| §13 Permissions | Tasks 14 (layout guard), 21 (sidebar filter). |
| §14 Accessibility minimum | Inputs labeled in Task 7, aria-labels in Task 10, status text accompanies color in Tasks 10 + 12. |
| §15 Testing | Manual smoke in Task 22. |
| §16 Env vars | No new env vars; `NEXT_PUBLIC_API_URL` already configured. |

**2. Placeholder scan:** Each code step includes complete, runnable code. No "TBD" or "implement later".

**Caveat noted in Task 18 / 19 / 20:** the timeseries query at the campaign / ad-set / ad pages needs the `accountId`. The campaign/ad-set/ad DTOs do not currently expose it, so the code casts `(entity as any)?.adAccountId ?? ''`. The recommended fix is to expand the backend response in `hierarchy.service.ts` to include `adAccountId` and then update `CampaignWithMetrics` / `AdSetWithMetrics` / `AdWithMetrics` in `meta-ads.service.ts`. Until that happens, the chart will fall back to an empty payload (the `useTimeseries` hook's `enabled` guards on a non-empty `accountId`). This is acknowledged tech debt — not blocker for the rest of the UI.

**3. Type consistency:** Service types, hook return types, component prop types, and page consumers all reference the same interfaces (`AdAccount`, `Metrics`, `CampaignWithMetrics`, etc.) defined once in Task 1. Hook query keys are scoped under `['meta-ads', ...]` consistently. Mutation invalidations target the exact keys defined for queries.

**Operational notes:**

- AlertDialog primitive (Task 16) — adapt to the actual `src/components/ui/alert-dialog.tsx` API. Read the file first if the names differ from what the task uses.
- Tailwind v4 — uses `oklch()` color tokens. The chart colors mirror what the existing dashboard uses (`features/dashboard/components`).
- Path quoting — paths under `app/(dashboard)/` need shell-quoting in `git add` commands because of the parentheses.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-meta-ads-frontend.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
