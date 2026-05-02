'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  aiAgentsService,
  CURATED_MODELS,
  type AgentKind,
} from '../services/ai-agents.service';

interface CreateAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DEFAULT_PROMPT = `Você é o(a) atendente da empresa. Sua missão é responder os clientes com simpatia, agilidade e clareza.

Regras:
- Use apenas as informações que você sabe com certeza.
- Se o cliente pedir algo fora do seu conhecimento, transfira para um humano.
- Mantenha tom natural e direto, sem rebuscar.`;

export function CreateAgentDialog({
  open,
  onClose,
  onCreated,
}: CreateAgentDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<AgentKind>('WORKER');
  const [category, setCategory] = useState('');
  const [modelId, setModelId] = useState('anthropic/claude-sonnet-4-6');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [temperature, setTemperature] = useState(0.7);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error('Nome e system prompt são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await aiAgentsService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        kind,
        category: category.trim() || undefined,
        modelId,
        systemPrompt: systemPrompt.trim(),
        temperature,
      });
      toast.success('Agente criado!');
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erro ao criar',
      );
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName('');
    setDescription('');
    setKind('WORKER');
    setCategory('');
    setModelId('anthropic/claude-sonnet-4-6');
    setSystemPrompt(DEFAULT_PROMPT);
    setTemperature(0.7);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Novo agente
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vendas Bravy"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Descrição (interna)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Responde dúvidas sobre planos e fecha matrícula"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Tipo
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as AgentKind)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="WORKER">Worker (atende o cliente)</option>
                <option value="ORCHESTRATOR">
                  Orquestrador (roteia para workers)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Categoria
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="vendas / suporte / billing"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Modelo *
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {CURATED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.badge}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              Sugestão: Sonnet 4.6 para workers, Haiku 4.5 ou Gemini Flash para orquestrador.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              System prompt *
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Você não precisa repetir contexto da empresa — o sistema injeta nome, canal, hora, dados do contato e memória automaticamente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Criatividade ({temperature.toFixed(2)})
            </label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
              <span>Determinístico</span>
              <span>Criativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Criando…' : 'Criar agente'}
          </button>
        </div>
      </div>
    </div>
  );
}
