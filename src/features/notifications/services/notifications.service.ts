import { api } from '@/lib/api';

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'CONVERSATION_ASSIGNED'
  | 'CONVERSATION_TRANSFERRED'
  | 'SLA_WARNING'
  | 'SLA_BREACH'
  | 'MENTION'
  | 'SYSTEM';

export interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  browserPush: boolean;
  email: boolean;
  sound: boolean;
}

export const notificationsService = {
  async getPreferences(): Promise<NotificationPreference[]> {
    const { data } = await api.get('/notifications/preferences');
    return data.data;
  },
  async updatePreference(payload: Partial<NotificationPreference> & { type: NotificationType }) {
    const { data } = await api.patch('/notifications/preferences', payload);
    return data.data as NotificationPreference;
  },
  async getVapidPublicKey(): Promise<string> {
    const { data } = await api.get('/notifications/push/vapid-public-key');
    return data.data?.key ?? '';
  },
  async subscribePush(payload: { endpoint: string; p256dhKey: string; authKey: string; userAgent?: string }) {
    await api.post('/notifications/push/subscribe', payload);
  },
  async unsubscribePush(endpoint: string) {
    await api.delete('/notifications/push/subscribe', { data: { endpoint } });
  },
  async testEmail() {
    await api.post('/notifications/test-email');
  },
  async testPush() {
    await api.post('/notifications/test-push');
  },
};
