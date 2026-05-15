export type AiProvider = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'OPENROUTER';

export interface ChatSession {
  id: string;
  adAccountId: string;
  userId: string;
  title: string | null;
  lastMessagePreview?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatToolCall {
  name: string;
  args: Record<string, any>;
  result: unknown;
  durationMs: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  toolCalls?: ChatToolCall[];
  modelUsed?: string;
  createdAt: string;
}

export interface KeySource {
  provider: AiProvider;
  hasKey: boolean;
  source: 'CHAT' | 'AGENT' | null;
}

export type ChatStreamEvent =
  | { type: 'token'; delta: string }
  | { type: 'tool_call_start'; name: string; args: Record<string, any> }
  | { type: 'tool_call_result'; name: string; result: unknown; durationMs: number }
  | { type: 'tool_call_error'; name: string; error: string }
  | { type: 'done'; messageId: string; inputTokens: number; outputTokens: number; modelUsed: string }
  | { type: 'error'; code: 'NEEDS_KEY' | 'LLM_ERROR' | 'TIMEOUT'; message: string; provider?: AiProvider };
