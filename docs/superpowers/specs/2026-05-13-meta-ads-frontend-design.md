# Meta Ads Frontend — Design Spec

**Date:** 2026-05-13
**Status:** Draft
**Author:** brainstorming session with Evandro
**Backend spec:** `chat-bullq-api-main/docs/superpowers/specs/2026-05-12-meta-ads-ingestion-design.md`
**Backend plan:** `chat-bullq-api-main/docs/superpowers/plans/2026-05-12-meta-ads-ingestion-backend.md`

## 1. Goal & Scope

Build the frontend area that consumes the backend Meta Ads ingestion module: connect a Meta Ad Account, view sync status, browse campaigns → ad sets → ads with metrics for any date range, and see a creative preview for individual ads.

**MVP scope:** Full set of routes from the backend design spec (connect + accounts list + dashboard + drill-down through three levels + creative preview).

**Out of scope:**
- Editing/mutating ads on Meta (deferred to fase B alongside the analyst agent).
- Test infrastructure for this feature (front repo has no jest/vitest/playwright today; manual smoke test only).
- WCAG full coverage (basic aria labels and labels-for-inputs only).
- Pagination of large lists (backend caps at 200 unpaged; revisit if real accounts exceed that).

## 2. Tech stack alignment

The front repo already provides:

- **Next 16 + React 19 + TypeScript 5.7** with the App Router and route groups `(auth)`, `(dashboard)`.
- **Tailwind 4** + a shadcn-style UI library in `src/components/ui/` (`card`, `dialog`, `dropdown`, `input`, `button`, `tooltip`, `badge`, `alert-dialog`, `select`, `skeleton`, etc.).
- **@tanstack/react-query** for server state, **zustand** (`auth-store`) for auth/org state, **nuqs** for URL state.
- **recharts** for charts (already used in `app/(dashboard)/dashboard/page.tsx`).
- **lucide-react** for icons; **sonner** for toasts; **framer-motion** available.
- **axios** wrapper at `@/lib/api` already injects `Authorization` and `x-organization-id` headers and handles JWT refresh transparently. API responses unwrap from `data.data` (see `dashboardService` for the established pattern).
- Existing conventions: `src/features/<feature>/{components,services}/` for feature code, pages in `src/app/(dashboard)/<route>/page.tsx`, pt-BR labels.

**No new dependencies needed.**

## 3. User-visible behavior

1. OWNER/ADMIN sees a "Meta Ads" item in the sidebar. AGENT does not.
2. First click on "Meta Ads" → if no accounts connected, redirect to `/meta-ads/connect`.
3. Connect page shows three external doc links (Meta Business System Users page, Graph API Explorer, Ad Account ID help) plus a single form with two required fields (`externalId`, `accessToken`) and an optional `name`. Submit validates server-side via the backend, redirects to the new account's dashboard.
4. Dashboard at `/meta-ads/accounts/[accId]` shows four KPI cards (spend, impressions, clicks, conversions) with delta vs previous period, a spend-over-time line chart, and a sortable campaigns table. A top bar has the account selector dropdown, the date-range picker (URL-backed via nuqs), and a sync status badge with "Sync agora" button.
5. Clicking a campaign row → ad-sets page → clicking an ad-set row → ads page → clicking an ad → ad detail with creative preview.
6. If an account's token expires (`status='ERROR'`), a sticky banner appears at the top of the dashboard with a "Reconectar" link. The accounts list page shows the same affordance per card.
7. AGENT typing a `/meta-ads/...` URL directly → the route group's `layout.tsx` renders a `<Forbidden />` component (HTTP 200 page with explanation and a "Voltar pro inbox" button).
8. Sync status badge polls the account every 30 s only while `lastSyncStatus === 'RUNNING'`. On transition to `SUCCESS`, the campaign and summary queries invalidate automatically.

## 4. Decisions (recap)

| Topic | Decision |
|-------|----------|
| Scope | Full set of routes (connect, accounts list, dashboard, three-level drill-down with creative preview). |
| Connect flow | Single form (no wizard). External doc links above the form. |
| AGENT URL access | Layout-level role guard renders `<Forbidden />` page (option B from brainstorming). |
| Date range | nuqs URL state (`?from&to`); default last 7 days; presets Today/Yesterday/7d/14d/30d/90d/custom. |
| Real-time | React Query polling every 30s only when account `lastSyncStatus === 'RUNNING'`. No WebSockets for this feature. |
| Tests | None (no test infra in front repo; manual smoke test). |
| New dependencies | None. |

## 5. Module layout

### New files

```
src/features/meta-ads/
├── services/
│   └── meta-ads.service.ts           # axios calls + types mirroring backend DTOs
├── components/
│   ├── account-selector.tsx          # top-bar dropdown
│   ├── date-range-picker.tsx         # presets + custom; URL state via nuqs
│   ├── sync-status-badge.tsx         # pill + "Sync agora" button + error tooltip
│   ├── metric-card.tsx               # KpiCard wrapper that accepts delta
│   ├── metrics-table.tsx             # reusable table for campaigns/ad-sets/ads
│   ├── spend-over-time-chart.tsx     # recharts LineChart wrapper
│   └── connect-form.tsx              # react-hook-form + zod
└── hooks/
    ├── use-ad-accounts.ts            # list, getOne (with 30s poll), connect, delete, sync, reconnect
    ├── use-campaigns.ts              # list, getOne
    ├── use-ad-sets.ts                # list, getOne
    ├── use-ads.ts                    # list, getOne
    └── use-insights.ts               # timeseries, summary

src/app/(dashboard)/meta-ads/
├── layout.tsx                        # role guard
├── page.tsx                          # redirect to first account or /connect
├── connect/page.tsx                  # external doc links + connect-form
├── accounts/page.tsx                 # list accounts with sync status
├── accounts/[accId]/page.tsx         # main dashboard
├── campaigns/[campaignId]/page.tsx   # drill ad-sets
├── ad-sets/[adSetId]/page.tsx        # drill ads
└── ads/[adId]/page.tsx               # ad detail + creative preview

src/components/ui/forbidden.tsx       # 403 page component (reusable)
```

### Modified files

```
src/components/layout/app-sidebar.tsx # add Meta Ads nav item with role filter
```

### Responsibilities

- **services/meta-ads.service.ts** — single object `metaAdsService` with methods matching backend endpoints; returns plain typed payloads, extracts `data.data` from axios responses (established pattern from `dashboardService`).
- **hooks/use-*.ts** — thin wrappers around React Query. Hooks own cache keys and side effects (toasts on mutation success/error, query invalidation). Pages consume hooks; pages never call services directly.
- **components/*** — presentational. Take typed props, no data fetching inside (except `account-selector` which uses `useAdAccounts` because it is itself the picker).
- **layout.tsx** — single `<RoleGuard>` boundary; all child routes inherit.
- **page.tsx** — redirect logic.
- **forbidden.tsx** (in `components/ui/`) — reusable across other features that may want it later.

## 6. Data model & types

Types live in `services/meta-ads.service.ts` and mirror the backend response shapes one-for-one. Concrete shapes:

```ts
type MetaAdAccountStatus = 'ACTIVE' | 'DISABLED' | 'PENDING' | 'ERROR';
type MetaSyncStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
type MetaCampaignStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
type MetaInsightLevel = 'ACCOUNT' | 'CAMPAIGN' | 'ADSET' | 'AD';

interface AdAccount {
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

interface Metrics {
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

interface CampaignWithMetrics {
  id: string;
  externalId: string;
  name: string;
  status: MetaCampaignStatus;
  objective: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  metrics: Metrics;
}

interface AdSetWithMetrics {
  id: string;
  externalId: string;
  name: string;
  status: MetaCampaignStatus;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  optimizationGoal: string | null;
  metrics: Metrics;
}

interface AdWithMetrics {
  id: string;
  externalId: string;
  name: string;
  status: MetaCampaignStatus;
  creative: { id: string; thumbnailUrl: string | null; title: string | null } | null;
  metrics: Metrics;
}

interface TimeseriesPoint { date: string; value: number | string; }

interface AccountSummary {
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
```

## 7. Service surface

`metaAdsService` methods, paths relative to `/api/v1` (the axios baseURL default):

```ts
// Accounts
connectAccount(payload)               → POST /meta-ads/accounts
listAccounts()                        → GET  /meta-ads/accounts
getAccount(id)                        → GET  /meta-ads/accounts/:id
deleteAccount(id)                     → DELETE /meta-ads/accounts/:id
triggerSync(id, scope?)               → POST /meta-ads/accounts/:id/sync
reconnect(id, accessToken)            → POST /meta-ads/accounts/:id/reconnect

// Hierarchy
listCampaigns(accId, { from, to, status?, sort? })
getCampaign(id, { from, to })
listAdSets(campaignId, { from, to })
getAdSet(id, { from, to })
listAds(adSetId, { from, to })
getAd(id, { from, to })

// Insights
timeseries({ accountId, level, entityId?, from, to, metric })
summary({ accountId, from, to })
```

All methods extract `data.data` from the axios response and return the inner typed payload, matching the existing `dashboardService` pattern.

## 8. React Query hooks

| Hook | Query key | Special behavior |
|------|-----------|------------------|
| `useAdAccounts()` | `['meta-ads', 'accounts']` | — |
| `useAdAccount(id)` | `['meta-ads', 'accounts', id]` | `refetchInterval: data => data?.lastSyncStatus === 'RUNNING' ? 30_000 : false`. On transition to `SUCCESS`, a `useEffect` in the dashboard page invalidates `['meta-ads', 'campaigns', accId]` and `['meta-ads', 'summary', accId]`. |
| `useConnectAccount()` | mutation | success → toast + invalidate accounts + return account for redirect |
| `useDeleteAccount()` | mutation | success → toast + invalidate accounts |
| `useTriggerSync()` | mutation | success → toast "Sync iniciado" + invalidate account |
| `useReconnect()` | mutation | success → toast + invalidate account |
| `useCampaigns(accId, range)` | `['meta-ads', 'campaigns', accId, range]` | `staleTime: 60_000` |
| `useCampaign(id, range)` | `['meta-ads', 'campaign', id, range]` | `staleTime: 60_000` |
| `useAdSets(campaignId, range)` | `['meta-ads', 'ad-sets', campaignId, range]` | `staleTime: 60_000` |
| `useAdSet(id, range)` | `['meta-ads', 'ad-set', id, range]` | `staleTime: 60_000` |
| `useAds(adSetId, range)` | `['meta-ads', 'ads', adSetId, range]` | `staleTime: 60_000` |
| `useAd(id, range)` | `['meta-ads', 'ad', id, range]` | `staleTime: 60_000` |
| `useTimeseries(params)` | `['meta-ads', 'timeseries', params]` | `staleTime: 60_000` |
| `useSummary(params)` | `['meta-ads', 'summary', params]` | `staleTime: 60_000` |

Errors are surfaced via `sonner` toast (uses `error.message`, which the axios interceptor already extracts from the backend response).

## 9. Component contracts

### `<AccountSelector />`

Props: none (reads via `useAdAccounts`).

Behavior: dropdown trigger displays `{name} · {currency} · {timezone}`. Items navigate via Next router push. Footer item "+ Conectar nova" → `/meta-ads/connect`.

### `<DateRangePicker />`

Props: none (URL state via nuqs).

Behavior: dropdown with presets (Hoje, Ontem, Últimos 7/14/30/90 dias, Personalizado…). Custom mode reveals two `<input type="date">`. Updates URL `?from&to` on selection. Default range = last 7 days when URL is empty.

### `<SyncStatusBadge accountId={string} />`

Props: `accountId`.

Behavior: reads `useAdAccount(accountId)` for live status. Renders colored pill + relative time ("há 3 min") + "Sync agora" button (calls `useTriggerSync`). On `FAILED`, tooltip shows `lastSyncError`. On `status='ERROR'`, shows "Reconectar" link to `/meta-ads/connect?reconnect={accountId}`.

| status | color | label |
|--------|-------|-------|
| `SUCCESS` | green | "Sincronizado · há Xmin" |
| `RUNNING` | blue (pulse) | "Sincronizando…" |
| `FAILED` | red | "Erro · ver detalhes" |
| `IDLE` | gray | "Aguardando primeiro sync" |
| account `ERROR` | amber | "Token expirou · Reconectar" |

### `<MetricCard label value delta? icon? />`

Wraps existing `KpiCard`. Adds delta indicator (↑ green / ↓ red / — gray) when delta is provided. Formats `value`: dollar values prefixed `$`, large numbers abbreviated (`1.5k`, `45k`, `1.2M`).

### `<MetricsTable items columns onRowClick? showObjective? />`

Columns: `Status · Nome · [Objetivo?] · Spend · Impr · Clicks · CTR · CPC · Conv · ROAS`. Status renders as colored pill (green ACTIVE, gray PAUSED, amber ARCHIVED, red DELETED). Headers sortable — clicking updates nuqs `?sort=` and the parent query refetches. Row hover highlights; click navigates via Next router. Empty state: `"Nenhum item no período."`.

### `<SpendOverTimeChart data />`

Wraps recharts `LineChart` + `CartesianGrid` + `XAxis` (date `MM-DD`) + `YAxis` (currency) + the existing `<ChartTooltip />` from `features/dashboard/components/chart-tooltip.tsx`. Color from the same `CHART_COLORS` palette used in the main dashboard.

### `<ConnectForm mode='connect' | 'reconnect' accountId? />`

react-hook-form + zod resolver. Schema:

```ts
const schema = z.object({
  externalId: z.string().regex(/^act_\d+$/, 'ID deve começar com act_ seguido de números'),
  accessToken: z.string().min(20, 'Token muito curto'),
  name: z.string().optional(),
});
```

On submit: connect mode → `useConnectAccount` mutation, success → router.push `/meta-ads/accounts/{id}`. Reconnect mode → `useReconnect(accountId)` mutation, only validates `accessToken`, success → router.push back to the account dashboard. 4xx errors render inline below the form as a destructive alert with the backend message.

### `<Forbidden />` (in `components/ui/forbidden.tsx`)

Generic, prop-less. Icon (lucide `ShieldOff`), heading "Sem acesso", description "Você não tem permissão para acessar essa área. Fale com um administrador da organização.", button "Voltar pro inbox" → `/inbox`. Reusable by other features.

## 10. Page specifications

### `/meta-ads/layout.tsx`

```tsx
'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Forbidden } from '@/components/ui/forbidden';

export default function MetaAdsLayout({ children }) {
  const { organizations, activeOrgId } = useAuthStore();
  const role = organizations.find(o => o.id === activeOrgId)?.role;
  if (role !== 'OWNER' && role !== 'ADMIN') return <Forbidden />;
  return <>{children}</>;
}
```

### `/meta-ads/page.tsx`

Calls `useAdAccounts()`. Skeleton while loading. Empty → `router.replace('/meta-ads/connect')`. Non-empty → `router.replace('/meta-ads/accounts/' + accounts[0].id)`.

### `/meta-ads/connect/page.tsx`

Header: "Conectar conta Meta Ads".

External doc links section (above the form):
```
Pegue seu Access Token e Ad Account ID no Meta Business:

📘 Como gerar Access Token (System User)
   https://business.facebook.com/settings/system-users

🔑 Graph API Explorer (token de usuário)
   https://developers.facebook.com/tools/explorer/

📋 Como encontrar Ad Account ID
   https://www.facebook.com/business/help/1492627900875762

Permissões necessárias: ads_read, ads_management, business_management
```

Each link is `<a target="_blank" rel="noopener noreferrer">` with the lucide `ExternalLink` icon. Reads `?reconnect={accountId}` via nuqs — when present, form renders in reconnect mode with the existing account name pre-displayed.

Below the doc block: `<ConnectForm />`.

### `/meta-ads/accounts/page.tsx`

Header: "Contas Meta Ads" + button "+ Nova conta" → `/meta-ads/connect`.

For each account: a `<Card>` with name + currency + timezone, the `<SyncStatusBadge>`, a kebab menu (`<DropdownMenu>`) with `[Sincronizar agora, Excluir]`. Excluir opens `<AlertDialog>` with confirmation; on confirm calls `useDeleteAccount`. Card body itself is clickable → navigates to `/meta-ads/accounts/{id}`.

If `status === 'ERROR'`, card shows an amber border and a "Reconectar" link replaces the click target.

### `/meta-ads/accounts/[accId]/page.tsx`

Top bar (sticky): `<AccountSelector /> · <DateRangePicker /> · <SyncStatusBadge />`.

If account is in `status='ERROR'`, sticky banner at top: "Token expirou. Reconecte para continuar a sincronização." + link to `/meta-ads/connect?reconnect={accId}`.

Content:
1. Four `<MetricCard>`: Spend, Impressões, Clicks, Conversões (with `deltaVsPrevious` from `useSummary`).
2. `<SpendOverTimeChart>` reading `useTimeseries({ accountId, level: 'ACCOUNT', from, to, metric: 'spend' })`.
3. Section heading "Campanhas" + `<MetricsTable items={campaigns} showObjective onRowClick={c => router.push('/meta-ads/campaigns/' + c.id)} />`.

### `/meta-ads/campaigns/[campaignId]/page.tsx`

Breadcrumb: `← Voltar` linking to `/meta-ads/accounts/{accId}` (accId derived from the campaign via `useCampaign`).

Header: campaign name + status pill + objective.

`<DateRangePicker />` (URL-backed).

Four `<MetricCard>` for the campaign's own metrics.

`<SpendOverTimeChart>` for `level: 'CAMPAIGN', entityId: campaign.externalId`.

`<MetricsTable items={adSets} onRowClick>` — clicking navigates to `/meta-ads/ad-sets/{id}`.

### `/meta-ads/ad-sets/[adSetId]/page.tsx`

Same layout as the campaigns drill, one level deeper. Breadcrumb `← {campaign name}` linking back. Table of ads.

### `/meta-ads/ads/[adId]/page.tsx`

Breadcrumb `← {ad set name}`.

Header: ad name + status pill.

Two-column layout:
- Left: creative thumbnail (`<img>` with the `creative.thumbnailUrl`; falls back to a placeholder if null).
- Right: creative metadata (title, body, callToAction).

Four `<MetricCard>` + `<SpendOverTimeChart>` for `level: 'AD'`.

### `src/components/layout/app-sidebar.tsx` (modify)

Add to `navItems`:
```ts
{ href: '/meta-ads', label: 'Meta Ads', icon: TrendingUp, roles: ['OWNER', 'ADMIN'] }
```
Filter `navItems` by `activeOrg.role` in the render (skip items whose `roles` array does not include the current role; items without a `roles` field are always shown).

## 11. Loading, empty, error states

### Loading
- Initial query → skeleton in place (same pattern as the main dashboard: `<div className="animate-pulse rounded-lg border border-border bg-muted/40 h-X" />`).
- Mutations pending → button disabled + small spinner (`Loader2` from lucide, `animate-spin`).
- Refetch → keep old data visible (React Query default); subtle spinner in the page header.

### Empty
- No accounts connected → empty-state card with CTA "Conectar conta Meta" → `/meta-ads/connect`.
- No campaigns for the selected range → table renders "Nenhuma campanha no período."
- Brand-new account before first sync → cards render `—` instead of `0`; subtitle "Aguardando primeiro sync".

### Error
- Network/API error → `sonner.toast.error(error.message)`.
- 403 from an API call (shouldn't happen because of the layout guard) → toast + `router.replace('/inbox')`.
- Account `status='ERROR'` → sticky banner + tooltip showing `lastSyncError`.
- `lastSyncStatus='FAILED'` (non-token) → red badge + tooltip with the error message.
- Connect/reconnect 4xx → inline destructive alert under the form with the backend message.

## 12. Real-time & polling

- `useAdAccount(id)` polls every 30 s only while `lastSyncStatus === 'RUNNING'`.
- A `useEffect` in the dashboard page watches `lastSyncStatus` and calls `queryClient.invalidateQueries({ queryKey: ['meta-ads', 'campaigns', accId] })` and `['meta-ads', 'summary', accId]` when it transitions to `SUCCESS`. This automatically refreshes the table and KPI cards once a sync completes.
- No WebSockets for this feature. Backend has `RealtimeGateway` but does not emit Meta sync events; polling is sufficient.

## 13. Permissions

- Sidebar: `navItems` filtered by `activeOrg.role` before render. AGENT does not see "Meta Ads".
- Route group `(dashboard)/meta-ads/layout.tsx`: client-side role guard renders `<Forbidden />` if role is not OWNER/ADMIN. Reusable for any future role-gated areas.
- Backend already enforces OWNER/ADMIN on every endpoint; frontend gating is UX, not security.

## 14. Accessibility (minimum viable)

- Inputs paired with `<label htmlFor>`.
- Icon-only buttons carry `aria-label`.
- Status pills carry `aria-label` describing the status in pt-BR.
- Tooltips reachable by keyboard (the existing `Tooltip` component already handles this).
- Color is never the sole signal: every status pill also has text.

No further accessibility work in this MVP. Audit deferred.

## 15. Testing

The front repo has no test infrastructure installed (no `jest`, `vitest`, `playwright` in `package.json`). **No tests added in this feature.** Verification is manual:

1. Connect a real account via the form.
2. Wait for the first sync to finish (sync badge transitions RUNNING → SUCCESS).
3. Verify campaigns appear in the table with metrics.
4. Drill into a campaign → ad sets → ads → ad detail.
5. Trigger a manual sync from the dashboard.
6. Reconnect after expiring/replacing the token.
7. Log in as an AGENT user and confirm the sidebar item is hidden and `/meta-ads/*` URLs render the Forbidden page.

If test infra gets added platform-wide later, the highest-value coverage would be: connect form validation, role-guard layout, sync-status badge transitions, and metrics-table sorting/row-click.

## 16. Environment & deploy notes

- `NEXT_PUBLIC_API_URL` already points at the backend (defaults to `http://localhost:3001/api/v1`). No new env vars needed.
- Production build: Next 16 with turbopack (`pnpm dev`); production build via `pnpm build`. No SSR concerns — all pages in the route group are `'use client'`.
- Build deploys via Coolify alongside the backend (presumably; verify deploy target with the user before merging).

## 17. Open questions for future iterations

- Pagination once campaign counts exceed ~200 per account (backend caps at 200 unpaged).
- Bulk-action UI on the campaigns table once write actions are added in fase B.
- Real-time push (Socket.IO) for sync completion if polling becomes a bottleneck across many connected accounts.
- Multi-currency dashboard view when an org has accounts in different currencies (current MVP displays each account's currency individually; no cross-account aggregation).
