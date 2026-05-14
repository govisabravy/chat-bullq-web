import { api } from '@/lib/api';

export type ChannelType = 'WHATSAPP_OFFICIAL' | 'WHATSAPP_ZAPPFY' | 'INSTAGRAM';

export type ChannelMemberRole = 'OWNER' | 'MEMBER';

export interface Channel {
  id: string;
  organizationId: string;
  ownerUserId: string | null;
  type: ChannelType;
  name: string;
  config: Record<string, any>;
  webhookSecret: string | null;
  webhookToken: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  memberRole?: ChannelMemberRole | 'ADMIN_BYPASS' | null;
}

export interface ChannelMember {
  channelId: string;
  userId: string;
  role: ChannelMemberRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
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

  async listWhatsappGroups(id: string): Promise<{ groups: Array<{ id: string; name: string; participants: number | null }>; error?: string }> {
    const { data } = await api.get<{ data: { groups: Array<{ id: string; name: string; participants: number | null }>; error?: string } }>(`/channels/${id}/whatsapp-groups`);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/channels/${id}`);
  },

  async testConnection(id: string): Promise<TestConnectionResult> {
    const { data } = await api.post<{ data: TestConnectionResult }>(`/channels/${id}/test`);
    return data.data;
  },

  async testConfig(type: ChannelType, config: Record<string, any>): Promise<TestConnectionResult> {
    const { data } = await api.post<{ data: TestConnectionResult }>(`/channels/test`, { type, config });
    return data.data;
  },

  async rotateWebhookToken(id: string): Promise<Channel> {
    const { data } = await api.post<{ data: Channel }>(`/channels/${id}/rotate-webhook-token`);
    return data.data;
  },

  async listMembers(channelId: string): Promise<ChannelMember[]> {
    const { data } = await api.get<{ data: ChannelMember[] }>(`/channels/${channelId}/members`);
    return data.data;
  },

  async addMember(
    channelId: string,
    payload: { userId: string; role?: ChannelMemberRole },
  ): Promise<ChannelMember> {
    const { data } = await api.post<{ data: ChannelMember }>(
      `/channels/${channelId}/members`,
      payload,
    );
    return data.data;
  },

  async removeMember(channelId: string, userId: string): Promise<void> {
    await api.delete(`/channels/${channelId}/members/${userId}`);
  },
};
