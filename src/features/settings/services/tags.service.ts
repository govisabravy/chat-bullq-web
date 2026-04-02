import { api } from '@/lib/api';

export interface Tag {
  id: string;
  organizationId: string;
  name: string;
  color: string;
}

export const tagsService = {
  async list(): Promise<Tag[]> {
    const { data } = await api.get('/tags');
    return data.data;
  },
  async create(payload: { name: string; color?: string }): Promise<Tag> {
    const { data } = await api.post('/tags', payload);
    return data.data;
  },
  async update(id: string, payload: { name?: string; color?: string }): Promise<Tag> {
    const { data } = await api.patch(`/tags/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },
};
