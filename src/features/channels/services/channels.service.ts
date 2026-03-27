import { api } from '@/lib/api';

export type ChannelType = 'WHATSAPP_OFFICIAL' | 'WHATSAPP_ZAPPFY' | 'INSTAGRAM';

export interface Channel {
  id: string;
  organizationId: string;
  type: ChannelType;
  name: string;
  config: Record<string, any>;
  webhookSecret: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelPayload {
  type: ChannelType;
  name: string;
  config: Record<string, any>;
  webhookSecret?: string;
}

export interface UpdateChannelPayload {
  name?: string;
  config?: Record<string, any>;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  status?: string;
  error?: string;
  data?: any;
}

export const channelsService = {
  async list(): Promise<Channel[]> {
    const { data } = await api.get<{ data: Channel[] }>('/channels');
    return data.data;
  },

  async getById(id: string): Promise<Channel> {
    const { data } = await api.get<{ data: Channel }>(`/channels/${id}`);
    return data.data;
  },

  async create(payload: CreateChannelPayload): Promise<Channel> {
    const { data } = await api.post<{ data: Channel }>('/channels', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateChannelPayload): Promise<Channel> {
    const { data } = await api.patch<{ data: Channel }>(`/channels/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/channels/${id}`);
  },

  async testConnection(id: string): Promise<TestConnectionResult> {
    const { data } = await api.post<{ data: TestConnectionResult }>(`/channels/${id}/test`);
    return data.data;
  },
};
