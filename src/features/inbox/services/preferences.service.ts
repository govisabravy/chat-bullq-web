import { api } from '@/lib/api';

export interface InboxPreferences {
  scope?: 'ALL' | 'MINE';
  statusFilters?: string[];
  selectedChannelId?: string | null;
}

export interface UserPreferences {
  inbox?: InboxPreferences;
  [key: string]: unknown;
}

export const preferencesService = {
  async get(): Promise<UserPreferences> {
    const { data } = await api.get('/users/me/preferences');
    return data.data ?? {};
  },

  async patch(patch: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data } = await api.patch('/users/me/preferences', {
      preferences: patch,
    });
    return data.data ?? {};
  },
};
