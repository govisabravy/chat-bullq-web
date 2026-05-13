'use client';

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 w-56 animate-pulse rounded-md border border-border bg-muted/40" />
        <div className="h-9 w-36 animate-pulse rounded-md border border-border bg-muted/40" />
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden h-7 w-20 animate-pulse rounded-full bg-muted/40 md:block" />
          <div className="hidden h-7 w-20 animate-pulse rounded-full bg-muted/40 md:block" />
          <div className="hidden h-7 w-20 animate-pulse rounded-full bg-muted/40 md:block" />
          <div className="h-7 w-32 animate-pulse rounded-full bg-muted/40" />
        </div>
      </div>

      {/* KPI cards (8) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 animate-pulse rounded-lg border border-border bg-muted/40" />
        <div className="h-80 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>

      {/* Funnel + top */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border border-border bg-muted/40" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md border border-border bg-muted/40" />
          ))}
        </div>
      </div>

      {/* Campaigns table */}
      <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/40" />
    </div>
  );
}
