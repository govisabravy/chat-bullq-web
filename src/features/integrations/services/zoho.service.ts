import { api } from '@/lib/api';

export interface ZohoConnection {
  id: string;
  provider: string;
  clientId: string;
  apiDomain: string;
  accountsDomain: string;
  isActive: boolean;
  lastValidatedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface UpsertZohoPayload {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiDomain?: string;
  accountsDomain?: string;
}

export const zohoService = {
  async get(): Promise<ZohoConnection | null> {
    const { data } = await api.get('/crm-integrations/zoho');
    return data.data;
  },
  async upsert(payload: UpsertZohoPayload): Promise<ZohoConnection> {
    const { data } = await api.post('/crm-integrations/zoho', payload);
    return data.data;
  },
  async disconnect(): Promise<void> {
    await api.delete('/crm-integrations/zoho');
  },
};
