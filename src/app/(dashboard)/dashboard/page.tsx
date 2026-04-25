'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MessageSquare, Clock, Users, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { ChartTooltip } from '@/features/dashboard/components/chart-tooltip';
import { Card, CardContent } from '@/components/ui/card';

const CHART_COLORS = [
  "oklch(0.62 0.2 290)",
  "oklch(0.68 0.15 230)",
  "oklch(0.72 0.17 150)",
  "oklch(0.78 0.16 85)",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: CHART_COLORS[3],
  OPEN: CHART_COLORS[2],
  BOT: CHART_COLORS[1],
  WAITING: CHART_COLORS[0],
  CLOSED: "oklch(0.65 0.02 270)",
};

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardService.getOverview(),
  });
  const { data: volumeByDay } = useQuery({
    queryKey: ['dashboard-volume-day'],
    queryFn: () => dashboardService.getVolumeByDay(),
  });
  const { data: volumeByChannel } = useQuery({
    queryKey: ['dashboard-volume-channel'],
    queryFn: () => dashboardService.getVolumeByChannel(),
  });
  const { data: volumeByStatus } = useQuery({
    queryKey: ['dashboard-volume-status'],
    queryFn: () => dashboardService.getVolumeByStatus(),
  });
  const { data: agents } = useQuery({
    queryKey: ['dashboard-agents'],
    queryFn: () => dashboardService.getAgentPerformance(),
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Últimos 30 dias</p>
      </div>

      {loadingOverview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Conversas"
            value={overview.totalConversations}
            delta={typeof overview.conversationsTrend === 'number' ? overview.conversationsTrend : undefined}
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <KpiCard
            label="Abertas agora"
            value={overview.openConversations + overview.pendingConversations}
            icon={<Users className="h-4 w-4" />}
          />
          <KpiCard
            label="Tempo médio 1ª resposta"
            value={overview.avgFirstResponseMinutes != null ? `${overview.avgFirstResponseMinutes}min` : '—'}
            icon={<Clock className="h-4 w-4" />}
          />
          <KpiCard
            label="SLA Compliance"
            value={overview.slaCompliancePercent != null ? `${overview.slaCompliancePercent}%` : '—'}
            icon={
              overview.slaCompliancePercent && overview.slaCompliancePercent >= 80
                ? <CheckCircle className="h-4 w-4" />
                : <AlertTriangle className="h-4 w-4" />
            }
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Volume por dia</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 270)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Por canal</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByChannel || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 270)" />
                  <XAxis dataKey="channelName" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(volumeByChannel || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Por status</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={volumeByStatus || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.status}>
                    {(volumeByStatus || []).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Performance dos agentes</h3>
            <div className="mt-4 space-y-3">
              {(agents || []).length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Nenhum dado de agentes ainda</p>
              ) : (
                (agents || []).map((a) => (
                  <div key={a.agent.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                        {a.agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{a.agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">{a.totalConversations} conversas · {a.closedConversations} fechadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">
                        {a.avgFirstResponseMinutes ?? '—'}
                        {a.avgFirstResponseMinutes ? 'min' : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground">1ª resposta</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
