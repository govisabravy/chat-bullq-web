import { api } from '@/lib/api';

export interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface ChannelInfo {
  id: string;
  type: string;
  name: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface LastMessage {
  id: string;
  type: string;
  content: Record<string, any>;
  direction: 'INBOUND' | 'OUTBOUND';
  createdAt: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  channelId: string;
  contactId: string;
  assignedToId: string | null;
  status: string;
  protocol: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  contact: Contact;
  channel: ChannelInfo;
  assignedTo: AgentInfo | null;
  messages: LastMessage[];
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  content: Record<string, any>;
  externalId: string | null;
  status: string;
  senderId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, any> | null;
  failedReason?: string | null;
}

export interface SendMediaPayload {
  conversationId: string;
  type: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
  mediaBase64: string;
  mimeType: string;
  fileName?: string;
  caption?: string;
}

export interface PaginatedResponse<T> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const inboxService = {
  async getConversations(params?: Record<string, string>): Promise<{
    conversations: Conversation[];
    pagination: any;
  }> {
    const { data } = await api.get('/conversations', { params });
    return data.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await api.get(`/conversations/${id}`);
    return data.data;
  },

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<{
    messages: Message[];
    pagination: any;
  }> {
    const { data } = await api.get('/messages', {
      params: { conversationId, page, limit },
    });
    return data.data;
  },

  async sendMessage(payload: {
    conversationId: string;
    type: string;
    content: Record<string, any>;
  }): Promise<Message> {
    const { data } = await api.post('/messages', payload);
    return data.data;
  },

  async sendMedia(payload: SendMediaPayload): Promise<Message> {
    const { data } = await api.post('/messages', {
      conversationId: payload.conversationId,
      type: payload.type,
      content: {
        mediaBase64: payload.mediaBase64,
        mimeType: payload.mimeType,
        fileName: payload.fileName,
        caption: payload.caption,
      },
    });
    return data.data;
  },

  async markRead(conversationId: string): Promise<{ readCount: number }> {
    const { data } = await api.post(`/conversations/${conversationId}/read`);
    return data.data;
  },

  async resolveMedia(messageId: string): Promise<{ mediaUrl: string; mimeType?: string }> {
    const { data } = await api.post(`/messages/${messageId}/resolve-media`);
    return data.data;
  },

  async assignToMe(conversationId: string): Promise<Conversation> {
    const { data } = await api.post(`/conversations/${conversationId}/assign-me`);
    return data.data;
  },

  async closeConversation(conversationId: string): Promise<Conversation> {
    const { data } = await api.post(`/conversations/${conversationId}/close`);
    return data.data;
  },

  async reopenConversation(conversationId: string): Promise<Conversation> {
    const { data } = await api.post(`/conversations/${conversationId}/reopen`);
    return data.data;
  },

  async getStatusCounts(): Promise<Record<string, number>> {
    const { data } = await api.get('/conversations/counts');
    return data.data;
  },
};
