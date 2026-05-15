import { api } from '@/lib/api';
import type { ChatMessage, ChatSession, ChatStreamEvent, KeySource, AiProvider } from '../types';

export const metaAdsChatService = {
  async listSessions(accountId: string): Promise<ChatSession[]> {
    const { data } = await api.get(`/meta-ads/accounts/${accountId}/chat/sessions`);
    return data;
  },

  async createSession(accountId: string, title?: string): Promise<ChatSession> {
    const { data } = await api.post(`/meta-ads/accounts/${accountId}/chat/sessions`, { title });
    return data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/meta-ads/chat/sessions/${sessionId}`);
  },

  async listMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data } = await api.get(`/meta-ads/chat/sessions/${sessionId}/messages`);
    return data;
  },

  async listKeys(): Promise<KeySource[]> {
    const { data } = await api.get('/meta-ads/chat/keys');
    return data;
  },

  async upsertKey(provider: AiProvider, apiKey: string): Promise<void> {
    await api.post('/meta-ads/chat/keys', { provider, apiKey });
  },

  async *streamMessage(
    sessionId: string,
    payload: { message: string; model: string },
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const baseURL = api.defaults.baseURL;
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('active_org_id') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await fetch(`${baseURL}/meta-ads/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(orgId ? { 'x-organization-id': orgId } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const ev = parseSseBlock(block);
        if (ev) yield ev;
      }
    }
  },
};

function parseSseBlock(block: string): ChatStreamEvent | null {
  const lines = block.split('\n');
  let event = '';
  let dataStr = '';
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
  }
  if (!event || !dataStr) return null;
  let data: any = {};
  try { data = JSON.parse(dataStr); } catch { return null; }
  switch (event) {
    case 'token': return { type: 'token', delta: data.delta };
    case 'tool_call_start': return { type: 'tool_call_start', name: data.name, args: data.args };
    case 'tool_call_result': return { type: 'tool_call_result', name: data.name, result: data.result, durationMs: data.durationMs };
    case 'tool_call_error': return { type: 'tool_call_error', name: data.name, error: data.error };
    case 'done': return { type: 'done', ...data };
    case 'error': return { type: 'error', ...data };
    default: return null;
  }
}
