'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { aiAgentsService, type AiAgent, type AiProvider } from '../services/ai-agents.service';

const PROVIDERS: AiProvider[] = ['GEMINI', 'OPENAI', 'ANTHROPIC', 'OPENROUTER'];

export function GeneralTab({ agent }: { agent: AiAgent }) {
  const queryClient = useQueryClient();
  const { data: allAgents = [] } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => aiAgentsService.list(),
  });
  const handoffCandidates = allAgents.filter((a) => a.id !== agent.id && a.isActive);
  const [form, setForm] = useState<Record<string, any>>({
    name: agent.name,
    description: agent.description ?? '',
    systemPrompt: agent.systemPrompt,
    welcomeMessage: agent.welcomeMessage ?? '',
    generationProvider: agent.generationProvider,
    generationModel: agent.generationModel,
    embeddingsProvider: agent.embeddingsProvider,
    embeddingsModel: agent.embeddingsModel,
    embeddingsApiKey: '',
    fallbackModel: agent.fallbackModel ?? '',
    apiKey: '',
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    historyTokenBudget: agent.historyTokenBudget,
    isActive: agent.isActive,
    respondInGroups: agent.respondInGroups,
    debounceMs: agent.debounceMs,
    sendTypingIndicator: agent.sendTypingIndicator,
    dailyTokenCap: agent.dailyTokenCap ?? '',
    dailyMessageCap: agent.dailyMessageCap ?? '',
    handoffMessage: agent.handoffMessage ?? '',
    handoffTargetIds:
      ((agent as any).handoffTargets?.map((h: any) => h.targetAgentId) ?? []) as string[],
    pauseBehavior: agent.pauseBehavior ?? 'MANUAL',
    autoResumeMinutes: agent.autoResumeMinutes ?? 15,
  });
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [models, setModels] = useState<string[]>([agent.generationModel]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [embeddingsModels, setEmbeddingsModels] = useState<string[]>([agent.embeddingsModel]);
  const [loadingEmbeddingsModels, setLoadingEmbeddingsModels] = useState(false);
  const [embeddingsModelsError, setEmbeddingsModelsError] = useState<string | null>(null);

  const update = (k: string, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const fetchModels = async (provider: AiProvider, key?: string) => {
    const apiKey = key ?? form.apiKey;
    if (apiKey && apiKey.trim()) {
      setLoadingModels(true);
      setModelsError(null);
      try {
        const list = await aiAgentsService.listModels(provider, apiKey);
        setModels(list);
        if (list.length > 0 && !list.includes(form.generationModel)) {
          update('generationModel', list[0]);
        }
      } catch (err) {
        setModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
      } finally {
        setLoadingModels(false);
      }
      return;
    }
    setLoadingModels(true);
    setModelsError(null);
    try {
      const list = await aiAgentsService.listModelsForAgent(agent.id, 'generation');
      setModels(list);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchEmbeddingsModels = async (key?: string) => {
    setLoadingEmbeddingsModels(true);
    setEmbeddingsModelsError(null);
    try {
      const typed = key ?? form.embeddingsApiKey;
      const list =
        typed && typed.trim()
          ? await aiAgentsService.listModels(form.embeddingsProvider, typed, 'embeddings')
          : await aiAgentsService.listModelsForAgent(agent.id, 'embeddings');
      setEmbeddingsModels(list);
      if (list.length > 0 && !list.includes(form.embeddingsModel)) {
        update('embeddingsModel', list[0]);
      }
    } catch (err) {
      setEmbeddingsModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
    } finally {
      setLoadingEmbeddingsModels(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingModels(true);
      try {
        const list = await aiAgentsService.listModelsForAgent(agent.id, 'generation');
        if (cancelled) return;
        if (list.length > 0) setModels(list);
        else setModelsError('Provider não retornou modelos');
      } catch (err) {
        if (!cancelled) setModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
      setLoadingEmbeddingsModels(true);
      try {
        const list = await aiAgentsService.listModelsForAgent(agent.id, 'embeddings');
        if (cancelled) return;
        if (list.length > 0) setEmbeddingsModels(list);
        else setEmbeddingsModelsError('Sem key de embeddings — informe no campo abaixo');
      } catch (err) {
        if (!cancelled)
          setEmbeddingsModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
      } finally {
        if (!cancelled) setLoadingEmbeddingsModels(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agent.id]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!form.apiKey) delete payload.apiKey;
      if (!form.embeddingsApiKey) delete payload.embeddingsApiKey;
      payload.dailyTokenCap = form.dailyTokenCap === '' ? null : Number(form.dailyTokenCap);
      payload.dailyMessageCap = form.dailyMessageCap === '' ? null : Number(form.dailyMessageCap);
      await aiAgentsService.update(agent.id, payload);
      toast.success('Salvo');
      queryClient.invalidateQueries({ queryKey: ['ai-agent', agent.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const validate = async () => {
    setValidating(true);
    try {
      const res = await aiAgentsService.validate(agent.id);
      if (res.ok) toast.success('Conexão OK');
      else toast.error(`Falha: ${res.error}`);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Identidade">
        <Row label="Nome">
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
        </Row>
        <Row label="Descrição">
          <input
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Opcional"
            className={inputCls}
          />
        </Row>
        <Row label="System prompt" hint="Variáveis: {contactName} {contactPhone} {protocol} {currentDate} {currentTime}">
          <textarea
            value={form.systemPrompt}
            onChange={(e) => update('systemPrompt', e.target.value)}
            rows={6}
            className={`${inputCls} h-auto font-mono text-xs leading-relaxed`}
          />
        </Row>
        <Row label="Mensagem de boas-vindas" hint="Enviada na primeira interação de cada conversa. Deixe vazio pra desativar.">
          <textarea
            value={form.welcomeMessage}
            onChange={(e) => update('welcomeMessage', e.target.value)}
            rows={2}
            className={`${inputCls} h-auto`}
          />
        </Row>
      </Section>

      <Section title="Provedor e modelo">
        <Row label="Provider">
          <select
            value={form.generationProvider}
            onChange={(e) => {
              const p = e.target.value as AiProvider;
              update('generationProvider', p);
              setModels([]);
              setModelsError(null);
            }}
            className={inputCls}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Row>
        <Row label="API key" hint="Deixe vazio pra manter a key atual. Armazenada criptografada.">
          <div className="flex gap-2">
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => fetchModels(form.generationProvider)}
              disabled={loadingModels}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="Buscar modelos"
            >
              {loadingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
        </Row>
        <Row
          label="Modelo"
          hint={modelsError ?? (models.length <= 1 ? 'Clique 🔄 pra listar modelos (usa a key salva)' : `${models.length} modelos disponíveis`)}
        >
          <select
            value={form.generationModel}
            onChange={(e) => update('generationModel', e.target.value)}
            className={inputCls}
          >
            {models.length === 0 ? (
              <option value="">—</option>
            ) : (
              models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))
            )}
          </select>
        </Row>
        <Row
          label="Modelo fallback"
          hint="Opcional. Usado se o modelo principal retornar 429 / 503 / rate-limit. Mesmo provider."
        >
          <select
            value={form.fallbackModel}
            onChange={(e) => update('fallbackModel', e.target.value)}
            className={inputCls}
          >
            <option value="">— sem fallback —</option>
            {models
              .filter((m) => m !== form.generationModel)
              .map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
        </Row>
      </Section>

      <Section title="Embeddings (RAG)">
        <Row label="Provider de embeddings" hint="Usado pra indexar documentos e buscar por similaridade. Dim fixa 768.">
          <select
            value={form.embeddingsProvider}
            onChange={(e) => {
              update('embeddingsProvider', e.target.value);
              setEmbeddingsModels([]);
              setEmbeddingsModelsError(null);
            }}
            className={inputCls}
          >
            <option value="GEMINI">GEMINI</option>
            <option value="OPENAI">OPENAI</option>
          </select>
        </Row>
        <Row
          label="API key de embeddings"
          hint="Opcional. Se vazio, usa a key de geração (quando provider bate) ou env. Armazenada criptografada."
        >
          <div className="flex gap-2">
            <input
              type="password"
              value={form.embeddingsApiKey}
              onChange={(e) => update('embeddingsApiKey', e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => fetchEmbeddingsModels()}
              disabled={loadingEmbeddingsModels}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="Buscar modelos de embeddings"
            >
              {loadingEmbeddingsModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
        </Row>
        <Row
          label="Modelo de embeddings"
          hint={
            embeddingsModelsError ??
            (embeddingsModels.length <= 1
              ? 'Clique 🔄 pra listar modelos disponíveis'
              : `${embeddingsModels.length} modelos disponíveis`)
          }
        >
          <select
            value={form.embeddingsModel}
            onChange={(e) => update('embeddingsModel', e.target.value)}
            className={inputCls}
          >
            {embeddingsModels.length === 0 ? (
              <option value="">—</option>
            ) : (
              embeddingsModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))
            )}
          </select>
        </Row>
      </Section>

      <Section title="Pause / Handoff">
        <Row
          label="Comportamento de pausa"
          hint="Manual: só o atendente retoma. Auto: retoma após X minutos sem resposta do atendente."
        >
          <select
            value={form.pauseBehavior}
            onChange={(e) => update('pauseBehavior', e.target.value)}
            className={inputCls}
          >
            <option value="MANUAL">MANUAL</option>
            <option value="AUTO_RESUME">AUTO_RESUME</option>
          </select>
        </Row>
        {form.pauseBehavior === 'AUTO_RESUME' && (
          <Row label="Retomar após (minutos)">
            <input
              type="number"
              min={1}
              max={240}
              value={form.autoResumeMinutes}
              onChange={(e) => update('autoResumeMinutes', Number(e.target.value))}
              className={inputCls}
            />
          </Row>
        )}
        <Row
          label="Mensagem de handoff"
          hint="Enviada ao contato antes da transferência efetivar. Deixe vazio para handoff silencioso."
        >
          <textarea
            rows={2}
            value={form.handoffMessage}
            onChange={(e) => update('handoffMessage', e.target.value)}
            className={`${inputCls} h-auto`}
          />
        </Row>
        <Row label="Agentes destino permitidos para handoff">
          {handoffCandidates.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Nenhum outro agente ativo disponível.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {handoffCandidates.map((a) => {
                const checked = form.handoffTargetIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      checked
                        ? 'border-primary/50 bg-primary/10 text-primary dark:border-primary/40'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-primary"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? form.handoffTargetIds.filter((id: string) => id !== a.id)
                          : [...form.handoffTargetIds, a.id];
                        update('handoffTargetIds', next);
                      }}
                    />
                    {a.name}
                  </label>
                );
              })}
            </div>
          )}
        </Row>
      </Section>

      <Section title="Parâmetros do modelo">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row label="Temperature">
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={form.temperature}
              onChange={(e) => update('temperature', Number(e.target.value))}
              className={inputCls}
            />
          </Row>
          <Row label="Max tokens">
            <input
              type="number"
              min="64"
              max="8192"
              value={form.maxTokens}
              onChange={(e) => update('maxTokens', Number(e.target.value))}
              className={inputCls}
            />
          </Row>
          <Row label="History token budget">
            <input
              type="number"
              min="500"
              value={form.historyTokenBudget}
              onChange={(e) => update('historyTokenBudget', Number(e.target.value))}
              className={inputCls}
            />
          </Row>
          <Row label="Debounce (ms)">
            <input
              type="number"
              min="0"
              max="60000"
              value={form.debounceMs}
              onChange={(e) => update('debounceMs', Number(e.target.value))}
              className={inputCls}
            />
          </Row>
        </div>
      </Section>

      <Section title="Limites diários">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row label="Cap de tokens/dia" hint="Vazio = ilimitado">
            <input
              type="number"
              min="1"
              value={form.dailyTokenCap}
              onChange={(e) => update('dailyTokenCap', e.target.value)}
              className={inputCls}
            />
          </Row>
          <Row label="Cap de mensagens/dia" hint="Vazio = ilimitado">
            <input
              type="number"
              min="1"
              value={form.dailyMessageCap}
              onChange={(e) => update('dailyMessageCap', e.target.value)}
              className={inputCls}
            />
          </Row>
        </div>
      </Section>

      <Section title="Comportamento">
        <div className="flex flex-wrap gap-2">
          <Switch label="Ativo" checked={form.isActive} onChange={(v) => update('isActive', v)} />
          <Switch
            label="Responder em grupos"
            checked={form.respondInGroups}
            onChange={(v) => update('respondInGroups', v)}
          />
          <Switch
            label="Mostrar 'digitando...'"
            checked={form.sendTypingIndicator}
            onChange={(v) => update('sendTypingIndicator', v)}
          />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 flex gap-2 border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
        </button>
        <button
          onClick={validate}
          disabled={validating}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {validating && <Loader2 className="h-4 w-4 animate-spin" />} Testar conexão
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </legend>
      <div className="mt-1 space-y-3">{children}</div>
    </fieldset>
  );
}

const inputCls =
  'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}
