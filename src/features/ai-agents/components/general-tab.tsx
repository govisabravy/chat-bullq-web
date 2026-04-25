'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { aiAgentsService, type AiAgent, type AiProvider } from '../services/ai-agents.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AgentStickySaveBar } from './agent-sticky-save-bar';

const PROVIDERS: AiProvider[] = ['GEMINI', 'OPENAI', 'ANTHROPIC', 'OPENROUTER'];

type FormState = {
  name: string;
  description: string;
  systemPrompt: string;
  welcomeMessage: string;
  generationProvider: AiProvider;
  generationModel: string;
  embeddingsProvider: AiProvider;
  embeddingsModel: string;
  embeddingsApiKey: string;
  fallbackModel: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  historyTokenBudget: number;
  isActive: boolean;
  respondInGroups: boolean;
  debounceMs: number;
  sendTypingIndicator: boolean;
  dailyTokenCap: number | string;
  dailyMessageCap: number | string;
  handoffMessage: string;
  handoffTargetIds: string[];
  pauseBehavior: 'MANUAL' | 'AUTO_RESUME';
  autoResumeMinutes: number;
};

function buildInitialForm(agent: AiAgent): FormState {
  return {
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
  };
}

export function GeneralTab({ agent }: { agent: AiAgent }) {
  const queryClient = useQueryClient();
  const { data: allAgents = [] } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => aiAgentsService.list(),
  });
  const handoffCandidates = allAgents.filter((a) => a.id !== agent.id && a.isActive);

  const initialForm = useMemo(() => buildInitialForm(agent), [agent]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [models, setModels] = useState<string[]>([agent.generationModel]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [embeddingsModels, setEmbeddingsModels] = useState<string[]>([agent.embeddingsModel]);
  const [loadingEmbeddingsModels, setLoadingEmbeddingsModels] = useState(false);
  const [embeddingsModelsError, setEmbeddingsModelsError] = useState<string | null>(null);

  const update = (k: keyof FormState, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const resetToAgent = () => {
    setForm(initialForm);
    setModelsError(null);
  };

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
      <AgentSection title="Identidade" description="Como o agente se identifica e responde.">
        <Field label="Nome" htmlFor="agent-name">
          <Input
            id="agent-name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </Field>
        <Field label="Descrição" htmlFor="agent-description">
          <Input
            id="agent-description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Opcional"
          />
        </Field>
        <Field
          label="System prompt"
          htmlFor="agent-system-prompt"
          full
          hint="Variáveis: {contactName} {contactPhone} {protocol} {currentDate} {currentTime}"
        >
          <Textarea
            id="agent-system-prompt"
            value={form.systemPrompt}
            onChange={(e) => update('systemPrompt', e.target.value)}
            rows={6}
            className="font-mono text-xs leading-relaxed"
          />
        </Field>
        <Field
          label="Mensagem de boas-vindas"
          htmlFor="agent-welcome"
          full
          hint="Enviada na primeira interação de cada conversa. Deixe vazio pra desativar."
        >
          <Textarea
            id="agent-welcome"
            value={form.welcomeMessage}
            onChange={(e) => update('welcomeMessage', e.target.value)}
            rows={2}
          />
        </Field>
      </AgentSection>

      <AgentSection title="Provedor e modelo" description="Modelo de geração principal e fallback.">
        <Field label="Provider">
          <Select
            value={form.generationProvider}
            onChange={(v) => {
              update('generationProvider', v as AiProvider);
              setModels([]);
              setModelsError(null);
            }}
          >
            {PROVIDERS.map((p) => (
              <SelectOption key={p} value={p}>
                {p}
              </SelectOption>
            ))}
          </Select>
        </Field>
        <Field
          label="API key"
          htmlFor="agent-api-key"
          hint="Deixe vazio pra manter a key atual. Armazenada criptografada."
        >
          <div className="flex gap-2">
            <Input
              id="agent-api-key"
              type="password"
              value={form.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => fetchModels(form.generationProvider)}
              disabled={loadingModels}
              title="Buscar modelos"
            >
              {loadingModels ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Field>
        <Field
          label="Modelo"
          hint={
            modelsError ??
            (models.length <= 1
              ? 'Clique no botão pra listar modelos (usa a key salva)'
              : `${models.length} modelos disponíveis`)
          }
        >
          <Select
            value={form.generationModel}
            onChange={(v) => update('generationModel', v)}
            placeholder="—"
          >
            {models.map((m) => (
              <SelectOption key={m} value={m}>
                {m}
              </SelectOption>
            ))}
          </Select>
        </Field>
        <Field
          label="Modelo fallback"
          hint="Opcional. Usado se o modelo principal retornar 429 / 503 / rate-limit. Mesmo provider."
        >
          <Select
            value={form.fallbackModel}
            onChange={(v) => update('fallbackModel', v)}
            placeholder="— sem fallback —"
          >
            <SelectOption value="">— sem fallback —</SelectOption>
            {models
              .filter((m) => m !== form.generationModel)
              .map((m) => (
                <SelectOption key={m} value={m}>
                  {m}
                </SelectOption>
              ))}
          </Select>
        </Field>
      </AgentSection>

      <AgentSection
        title="Embeddings (RAG)"
        description="Indexação de documentos e busca por similaridade. Dim fixa 768."
      >
        <Field label="Provider de embeddings">
          <Select
            value={form.embeddingsProvider}
            onChange={(v) => {
              update('embeddingsProvider', v as AiProvider);
              setEmbeddingsModels([]);
              setEmbeddingsModelsError(null);
            }}
          >
            <SelectOption value="GEMINI">GEMINI</SelectOption>
            <SelectOption value="OPENAI">OPENAI</SelectOption>
          </Select>
        </Field>
        <Field
          label="API key de embeddings"
          htmlFor="agent-embeddings-key"
          hint="Opcional. Se vazio, usa a key de geração (quando provider bate) ou env. Armazenada criptografada."
        >
          <div className="flex gap-2">
            <Input
              id="agent-embeddings-key"
              type="password"
              value={form.embeddingsApiKey}
              onChange={(e) => update('embeddingsApiKey', e.target.value)}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => fetchEmbeddingsModels()}
              disabled={loadingEmbeddingsModels}
              title="Buscar modelos de embeddings"
            >
              {loadingEmbeddingsModels ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Field>
        <Field
          label="Modelo de embeddings"
          hint={
            embeddingsModelsError ??
            (embeddingsModels.length <= 1
              ? 'Clique no botão pra listar modelos disponíveis'
              : `${embeddingsModels.length} modelos disponíveis`)
          }
        >
          <Select
            value={form.embeddingsModel}
            onChange={(v) => update('embeddingsModel', v)}
            placeholder="—"
          >
            {embeddingsModels.map((m) => (
              <SelectOption key={m} value={m}>
                {m}
              </SelectOption>
            ))}
          </Select>
        </Field>
      </AgentSection>

      <AgentSection
        title="Pause / Handoff"
        description="Comportamento quando o atendente assume ou transfere a conversa."
      >
        <Field
          label="Comportamento de pausa"
          hint="Manual: só o atendente retoma. Auto: retoma após X minutos sem resposta do atendente."
        >
          <Select
            value={form.pauseBehavior}
            onChange={(v) => update('pauseBehavior', v as 'MANUAL' | 'AUTO_RESUME')}
          >
            <SelectOption value="MANUAL">MANUAL</SelectOption>
            <SelectOption value="AUTO_RESUME">AUTO_RESUME</SelectOption>
          </Select>
        </Field>
        {form.pauseBehavior === 'AUTO_RESUME' ? (
          <Field label="Retomar após (minutos)" htmlFor="agent-auto-resume">
            <Input
              id="agent-auto-resume"
              type="number"
              min={1}
              max={240}
              value={form.autoResumeMinutes}
              onChange={(e) => update('autoResumeMinutes', Number(e.target.value))}
            />
          </Field>
        ) : null}
        <Field
          label="Mensagem de handoff"
          htmlFor="agent-handoff-message"
          full
          hint="Enviada ao contato antes da transferência efetivar. Deixe vazio para handoff silencioso."
        >
          <Textarea
            id="agent-handoff-message"
            rows={2}
            value={form.handoffMessage}
            onChange={(e) => update('handoffMessage', e.target.value)}
          />
        </Field>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label>Agentes destino permitidos para handoff</Label>
          {handoffCandidates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum outro agente ativo disponível.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {handoffCandidates.map((a) => {
                const checked = form.handoffTargetIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition-smooth hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onChange={(next) => {
                        const list = next
                          ? [...form.handoffTargetIds, a.id]
                          : form.handoffTargetIds.filter((id: string) => id !== a.id);
                        update('handoffTargetIds', list);
                      }}
                    />
                    <span>{a.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </AgentSection>

      <AgentSection title="Parâmetros do modelo" description="Tunning de geração e contexto.">
        <Field label="Temperature" htmlFor="agent-temperature">
          <Input
            id="agent-temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={form.temperature}
            onChange={(e) => update('temperature', Number(e.target.value))}
          />
        </Field>
        <Field label="Max tokens" htmlFor="agent-max-tokens">
          <Input
            id="agent-max-tokens"
            type="number"
            min="64"
            max="8192"
            value={form.maxTokens}
            onChange={(e) => update('maxTokens', Number(e.target.value))}
          />
        </Field>
        <Field label="History token budget" htmlFor="agent-history-budget">
          <Input
            id="agent-history-budget"
            type="number"
            min="500"
            value={form.historyTokenBudget}
            onChange={(e) => update('historyTokenBudget', Number(e.target.value))}
          />
        </Field>
        <Field label="Debounce (ms)" htmlFor="agent-debounce">
          <Input
            id="agent-debounce"
            type="number"
            min="0"
            max="60000"
            value={form.debounceMs}
            onChange={(e) => update('debounceMs', Number(e.target.value))}
          />
        </Field>
      </AgentSection>

      <AgentSection title="Limites diários" description="Vazio = ilimitado.">
        <Field label="Cap de tokens/dia" htmlFor="agent-daily-token-cap">
          <Input
            id="agent-daily-token-cap"
            type="number"
            min="1"
            value={form.dailyTokenCap}
            onChange={(e) => update('dailyTokenCap', e.target.value)}
          />
        </Field>
        <Field label="Cap de mensagens/dia" htmlFor="agent-daily-message-cap">
          <Input
            id="agent-daily-message-cap"
            type="number"
            min="1"
            value={form.dailyMessageCap}
            onChange={(e) => update('dailyMessageCap', e.target.value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={validate}
            loading={validating}
          >
            Testar conexão
          </Button>
        </div>
      </AgentSection>

      <AgentSection title="Comportamento" description="Estado operacional do agente.">
        <ToggleField
          label="Ativo"
          hint="Se desligado, o agente não responde a nenhuma mensagem."
          checked={form.isActive}
          onChange={(v) => update('isActive', v)}
        />
        <ToggleField
          label="Responder em grupos"
          hint="Se ligado, o agente responde também em conversas de grupo."
          checked={form.respondInGroups}
          onChange={(v) => update('respondInGroups', v)}
        />
        <ToggleField
          label="Mostrar 'digitando...'"
          hint="Envia o indicador de digitação enquanto gera a resposta."
          checked={form.sendTypingIndicator}
          onChange={(v) => update('sendTypingIndicator', v)}
        />
      </AgentSection>

      <AgentStickySaveBar
        dirty={isDirty}
        saving={saving}
        onSave={save}
        onDiscard={resetToAgent}
      />
    </div>
  );
}

function AgentSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
  full,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'md:col-span-2')}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 md:col-span-2">
      <div className="flex flex-col gap-0.5">
        <Label>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
