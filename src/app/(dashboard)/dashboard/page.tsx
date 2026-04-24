'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MessageSquare, Clock, Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { useOrgId } from '@/hooks/use-org-query-key';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#6b7280'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', OPEN: '#10b981', BOT: '#3b82f6', WAITING: '#8b5cf6', CLOSED: '#6b7280',
};

function KpiCard({ label, value, trend, icon: Icon, suffix }: {
  label: string; value: string | number; trend?: number; icon: React.ElementType; suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}{suffix}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const orgId = useOrgId();
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => dashboardService.getOverview(),
  });
  const { data: volumeByDay } = useQuery({
    queryKey: ['dashboard-volume-day', orgId],
    queryFn: () => dashboardService.getVolumeByDay(),
  });
  const { data: volumeByChannel } = useQuery({
    queryKey: ['dashboard-volume-channel', orgId],
    queryFn: () => dashboardService.getVolumeByChannel(),
  });
  const { data: volumeByStatus } = useQuery({
    queryKey: ['dashboard-volume-status', orgId],
    queryFn: () => dashboardService.getVolumeByStatus(),
  });
  const { data: agents } = useQuery({
    queryKey: ['dashboard-agents', orgId],
    queryFn: () => dashboardService.getAgentPerformance(),
  });

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Últimos 30 dias</p>

      {loadingOverview ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
          ))}
        </div>
      ) : overview && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Conversas" value={overview.totalConversations} trend={overview.conversationsTrend} icon={MessageSquare} />
          <KpiCard label="Abertas agora" value={overview.openConversations + overview.pendingConversations} icon={Users} />
          <KpiCard label="Tempo médio 1ª resposta" value={overview.avgFirstResponseMinutes ?? '—'} icon={Clock} suffix={overview.avgFirstResponseMinutes ? 'min' : ''} />
          <KpiCard label="SLA Compliance" value={overview.slaCompliancePercent ?? '—'} icon={overview.slaCompliancePercent && overview.slaCompliancePercent >= 80 ? CheckCircle : AlertTriangle} suffix={overview.slaCompliancePercent ? '%' : ''} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Volume por dia</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Por canal</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeByChannel || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="channelName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(volumeByChannel || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Por status</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={volumeByStatus || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.status}>
                  {(volumeByStatus || []).map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Performance dos agentes</h3>
          <div className="mt-4 space-y-3">
            {(agents || []).length === 0 ? (
              <p className="text-center text-xs text-zinc-400 py-8">Nenhum dado de agentes ainda</p>
            ) : (
              (agents || []).map((a) => (
                <div key={a.agent.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium dark:bg-zinc-700">
                      {a.agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{a.agent.name}</p>
                      <p className="text-[10px] text-zinc-400">{a.totalConversations} conversas · {a.closedConversations} fechadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {a.avgFirstResponseMinutes ?? '—'}
                      {a.avgFirstResponseMinutes ? 'min' : ''}
                    </p>
                    <p className="text-[10px] text-zinc-400">1ª resposta</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
