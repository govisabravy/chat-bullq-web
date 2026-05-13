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
      params: paramsOf(params as unknown as Record<string, string | undefined>),
    });
    return data.data;
  },
  async summary(params: SummaryParams): Promise<AccountSummary> {
    const { data } = await api.get('/meta-ads/insights/summary', {
      params: paramsOf(params as unknown as Record<string, string | undefined>),
    });
    return data.data;
  },
};
