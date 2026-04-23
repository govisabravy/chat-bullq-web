import { api } from '@/lib/api';

export interface DashboardOverview {
  totalConversations: number;
  conversationsTrend: number;
  openConversations: number;
  pendingConversations: number;
  totalMessages: number;
  messagesTrend: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  slaCompliancePercent: number | null;
}

export interface VolumeByDay { date: string; count: number; }
export interface VolumeByChannel { channelId: string; channelName: string; channelType: string; count: number; }
export interface VolumeByStatus { status: string; count: number; }
export interface AgentPerformance {
  agent: { id: string; name: string; avatarUrl: string | null };
  totalConversations: number;
  closedConversations: number;
  avgFirstResponseMinutes: number | null;
}

export const dashboardService = {
  async getOverview(from?: string, to?: string): Promise<DashboardOverview> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get('/dashboard/overview', { params });
    return data.data;
  },
  async getVolumeByDay(from?: string, to?: string): Promise<VolumeByDay[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get('/dashboard/volume-by-day', { params });
    return data.data;
  },
  async getVolumeByChannel(from?: string, to?: string): Promise<VolumeByChannel[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get('/dashboard/volume-by-channel', { params });
    return data.data;
  },
  async getVolumeByStatus(): Promise<VolumeByStatus[]> {
    const { data } = await api.get('/dashboard/volume-by-status');
    return data.data;
  },
  async getAgentPerformance(from?: string, to?: string): Promise<AgentPerformance[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get('/dashboard/agent-performance', { params });
    return data.data;
  },
};
