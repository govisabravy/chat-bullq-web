import type { AiProvider } from './types';

export interface ModelOption {
  id: string;
  name: string;
  provider: AiProvider;
  description: string;
  badge?: 'Recomendado' | 'Rápido' | 'Pro';
}

export const MODELS: ModelOption[] = [
  { id: 'claude-sonnet-4-6', provider: 'ANTHROPIC', name: 'Claude Sonnet 4.6', description: 'Equilíbrio entre custo e raciocínio', badge: 'Recomendado' },
  { id: 'claude-haiku-4-5-20251001', provider: 'ANTHROPIC', name: 'Claude Haiku 4.5', description: 'Rápido e barato', badge: 'Rápido' },
  { id: 'claude-opus-4-7', provider: 'ANTHROPIC', name: 'Claude Opus 4.7', description: 'Máximo de raciocínio', badge: 'Pro' },
  { id: 'gpt-4o-mini', provider: 'OPENAI', name: 'GPT-4o mini', description: 'Rápido e barato' },
  { id: 'gpt-4o', provider: 'OPENAI', name: 'GPT-4o', description: 'Multimodal completo' },
];

export const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';
