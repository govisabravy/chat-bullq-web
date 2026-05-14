import { api } from '@/lib/api';

export type AiProvider = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'OPENROUTER';
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type AiInteractionStatus = 'SUCCESS' | 'LLM_ERROR' | 'BLOCKED_GROUP' | 'BLOCKED_OFFHOURS' | 'BLOCKED_CAP';

export interface AgentSchedule {
  enabled: boolean;
  timezone: string;
  days: number[];
  startMin: number;
  endMin: number;
  outOfHoursMessage?: string;
}

export interface AiAgent {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  welcomeMessage: string | null;
  generationProvider: AiProvider;
  generationModel: string;
  fallbackModel?: string | null;
  embeddingsProvider: AiProvider;
  embeddingsModel: string;
  temperature: number;
  maxTokens: number;
  historyTokenBudget: number;
  isActive: boolean;
  respondInGroups: boolean;
  debounceMs: number;
  sendTypingIndicator: boolean;
  dailyTokenCap: number | null;
  dailyMessageCap: number | null;
  schedule: AgentSchedule | null;
  channels: { agentId: string; channelId: string; channel: { id: string; name: string; type: string } }[];
  _count?: { documents: number };
  handoffMessage?: string | null;
  pauseBehavior?: 'MANUAL' | 'AUTO_RESUME';
  autoResumeMinutes?: number;
  activationMode?: 'ALL_CONVERSATIONS' | 'PER_CONVERSATION';
  handoffTargets?: { targetAgentId: string }[];
  requiresClientMatch?: boolean;
  clientSourceProvider?: 'ZOHO_CRM' | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDocument {
  id: string;
  agentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  errorReason: string | null;
  totalChunks: number;
  createdAt: string;
}

export interface AiInteractionRow {
  id: string;
  conversationId: string;
  status: AiInteractionStatus;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

export const aiAgentsService = {
  async list(): Promise<AiAgent[]> {
    const { data } = await api.get('/ai-agents');
    return data.data;
  },
  async get(id: string): Promise<AiAgent> {
    const { data } = await api.get(`/ai-agents/${id}`);
    return data.data;
  },
  async create(payload: Partial<AiAgent> & { apiKey: string; embeddingsProvider?: AiProvider; embeddingsModel?: string; embeddingsApiKey?: string }): Promise<AiAgent> {
    const { data } = await api.post('/ai-agents', payload);
    return data.data;
  },
  async update(id: string, payload: Partial<AiAgent> & { apiKey?: string; embeddingsApiKey?: string | null }): Promise<AiAgent> {
    const { data } = await api.patch(`/ai-agents/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/ai-agents/${id}`);
  },
  async duplicate(id: string): Promise<AiAgent> {
    const { data } = await api.post(`/ai-agents/${id}/duplicate`);
    return data.data;
  },
  async validate(id: string): Promise<{ ok: boolean; error?: string }> {
    const { data } = await api.post(`/ai-agents/${id}/validate`);
    return data.data;
  },
  async attachChannel(id: string, channelId: string): Promise<void> {
    await api.post(`/ai-agents/${id}/channels`, { channelId });
  },
  async detachChannel(id: string, channelId: string): Promise<void> {
    await api.delete(`/ai-agents/${id}/channels/${channelId}`);
  },
  async listDocuments(id: string): Promise<AiDocument[]> {
    const { data } = await api.get(`/ai-agents/${id}/documents`);
    return data.data;
  },
  async uploadDocument(id: string, file: File): Promise<AiDocument> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/ai-agents/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  async deleteDocument(agentId: string, docId: string): Promise<void> {
    await api.delete(`/ai-agents/${agentId}/documents/${docId}`);
  },
  async retryDocument(agentId: string, docId: string): Promise<void> {
    await api.post(`/ai-agents/${agentId}/documents/${docId}/retry`);
  },
  async reingestDocument(agentId: string, docId: string): Promise<void> {
    await api.post(`/ai-agents/${agentId}/documents/${docId}/reingest`);
  },
  async test(id: string, message: string) {
    const { data } = await api.post(`/ai-agents/${id}/test`, { message });
    return data.data as { reply: string; latencyMs: number; inputTokens: number; outputTokens: number };
  },
  async listLogs(id: string, params: { page?: number; limit?: number; status?: AiInteractionStatus } = {}) {
    const { data } = await api.get(`/ai-agents/${id}/logs`, { params });
    return data.data as { items: AiInteractionRow[]; pagination: { page: number; limit: number; total: number } };
  },
  async getLog(id: string, interactionId: string) {
    const { data } = await api.get(`/ai-agents/${id}/logs/${interactionId}`);
    return data.data;
  },
  async usageToday(id: string) {
    const { data } = await api.get(`/ai-agents/${id}/usage/today`);
    return data.data as { messageCount: number; tokenCount: number; capStatus: string };
  },

  async listModels(
    provider: AiProvider,
    apiKey: string,
    kind: 'generation' | 'embeddings' = 'generation',
  ): Promise<string[]> {
    const { data } = await api.post('/ai-agents/list-models', { provider, apiKey, kind });
    return data.data as string[];
  },

  async listModelsForAgent(
    id: string,
    kind: 'generation' | 'embeddings' = 'generation',
  ): Promise<string[]> {
    const { data } = await api.post(`/ai-agents/${id}/list-models`, { kind });
    return data.data as string[];
  },
};
