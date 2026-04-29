'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { aiAgentsService, type AiProvider } from '@/features/ai-agents/services/ai-agents.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('Você é um assistente cordial e objetivo.');
  const [generationProvider, setGenerationProvider] = useState<AiProvider>('GEMINI');
  const [generationModel, setGenerationModel] = useState('');
  const [fallbackModel, setFallbackModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [embeddingsProvider, setEmbeddingsProvider] = useState<'GEMINI' | 'OPENAI'>('GEMINI');
  const [embeddingsApiKey, setEmbeddingsApiKey] = useState('');
  const [activationMode, setActivationMode] = useState<'ALL_CONVERSATIONS' | 'PER_CONVERSATION'>('ALL_CONVERSATIONS');
  const [embeddingsModel, setEmbeddingsModel] = useState('');
  const [embeddingsModels, setEmbeddingsModels] = useState<string[]>([]);
  const [loadingEmbeddingsModels, setLoadingEmbeddingsModels] = useState(false);
  const [embeddingsModelsError, setEmbeddingsModelsError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const fetchModels = async (p: AiProvider, key: string) => {
    if (!key.trim()) return;
    setLoadingModels(true);
    setModelsError(null);
    try {
      const list = await aiAgentsService.listModels(p, key);
      setModels(list);
      if (list.length > 0 && !list.includes(generationModel)) {
        setGenerationModel(list[0]);
      }
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    setModels([]);
    setGenerationModel('');
    setModelsError(null);
  }, [generationProvider]);

  useEffect(() => {
    setEmbeddingsModels([]);
    setEmbeddingsModel('');
    setEmbeddingsModelsError(null);
  }, [embeddingsProvider]);

  const fetchEmbeddingsModels = async () => {
    const key = embeddingsApiKey.trim() || (embeddingsProvider === generationProvider ? apiKey.trim() : '');
    if (!key) {
      setEmbeddingsModelsError('Informe API key de embeddings ou use mesmo provider da geração');
      return;
    }
    setLoadingEmbeddingsModels(true);
    setEmbeddingsModelsError(null);
    try {
      const list = await aiAgentsService.listModels(embeddingsProvider, key, 'embeddings');
      setEmbeddingsModels(list);
      if (list.length > 0 && !list.includes(embeddingsModel)) {
        setEmbeddingsModel(list[0]);
      }
    } catch (err) {
      setEmbeddingsModelsError(err instanceof Error ? err.message : 'Erro ao listar modelos');
      setEmbeddingsModels([]);
    } finally {
      setLoadingEmbeddingsModels(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemPrompt || !apiKey || !generationModel) {
      toast.error('Nome, prompt, API key e modelo são obrigatórios');
      return;
    }
    setIsSaving(true);
    try {
      const created = await aiAgentsService.create({
        name,
        description: description || undefined,
        systemPrompt,
        generationProvider,
        generationModel,
        fallbackModel: fallbackModel || undefined,
        apiKey,
        embeddingsProvider,
        embeddingsApiKey: embeddingsApiKey || undefined,
        embeddingsModel: embeddingsModel || undefined,
        activationMode,
      } as any);
      toast.success('Agente criado');
      router.push(`/settings/ai-agents/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/settings/ai-agents" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo agente</h1>
        <p className="text-sm text-muted-foreground">Configure identidade, modelo e credenciais.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Field label="Nome" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Vendedor ThinkBullQ"
              />
            </Field>
            <Field label="Descrição">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do agente (opcional)"
              />
            </Field>
            <Field
              label="System prompt"
              required
              hint="Variáveis disponíveis: {contactName} {contactPhone} {protocol} {currentDate} {currentTime}"
            >
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                className="font-mono text-xs leading-relaxed"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LLM</CardTitle>
            <CardDescription>Provider + credenciais. Validação acontece ao salvar.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Field label="Provider" required>
              <Select value={generationProvider} onChange={(v) => setGenerationProvider(v as AiProvider)}>
                <SelectOption value="GEMINI">GEMINI</SelectOption>
                <SelectOption value="OPENAI">OPENAI</SelectOption>
                <SelectOption value="ANTHROPIC">ANTHROPIC</SelectOption>
                <SelectOption value="OPENROUTER">OPENROUTER</SelectOption>
              </Select>
            </Field>
            <Field label="API key" required>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={() => apiKey.trim() && fetchModels(generationProvider, apiKey)}
                  placeholder="AIza... / sk-... / etc"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => apiKey.trim() && fetchModels(generationProvider, apiKey)}
                  disabled={!apiKey.trim() || loadingModels}
                  title="Buscar modelos"
                >
                  {loadingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </Field>
            <Field
              label="Modelo"
              required
              hint={modelsError ?? (models.length === 0 ? 'Cole a API key e busque os modelos' : `${models.length} modelos disponíveis`)}
            >
              <Select
                value={generationModel}
                onChange={setGenerationModel}
                disabled={models.length === 0}
                placeholder="— carregue os modelos —"
              >
                {models.map((m) => (
                  <SelectOption key={m} value={m}>
                    {m}
                  </SelectOption>
                ))}
              </Select>
            </Field>
            <Field label="Modelo fallback" hint="Usado se o primário retornar rate limit.">
              <Select
                value={fallbackModel}
                onChange={setFallbackModel}
                disabled={models.length === 0}
              >
                <SelectOption value="">— sem fallback —</SelectOption>
                {models
                  .filter((m) => m !== generationModel)
                  .map((m) => (
                    <SelectOption key={m} value={m}>
                      {m}
                    </SelectOption>
                  ))}
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ativação</CardTitle>
            <CardDescription>Define quando a IA entra em ação nas conversas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field
              label="Modo de ativação"
              hint={
                activationMode === 'ALL_CONVERSATIONS'
                  ? 'IA responde automaticamente em toda nova conversa do(s) canal(is) atribuído(s).'
                  : 'IA fica inativa por padrão. Operador ativa manualmente em cada conversa.'
              }
            >
              <Select
                value={activationMode}
                onChange={(v) => setActivationMode(v as 'ALL_CONVERSATIONS' | 'PER_CONVERSATION')}
              >
                <SelectOption value="ALL_CONVERSATIONS">Em todas conversas (padrão)</SelectOption>
                <SelectOption value="PER_CONVERSATION">Apenas quando ativada manualmente</SelectOption>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embeddings (RAG)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Field label="Provider embeddings">
              <Select value={embeddingsProvider} onChange={(v) => setEmbeddingsProvider(v as 'GEMINI' | 'OPENAI')}>
                <SelectOption value="GEMINI">GEMINI</SelectOption>
                <SelectOption value="OPENAI">OPENAI</SelectOption>
              </Select>
            </Field>
            <Field
              label="API key embeddings"
              hint="Opcional. Vazio reutiliza a key de geração se o provider bater, ou cai no env."
            >
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={embeddingsApiKey}
                  onChange={(e) => setEmbeddingsApiKey(e.target.value)}
                  onBlur={() => fetchEmbeddingsModels()}
                  placeholder="••••••••"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
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
                (embeddingsModels.length === 0
                  ? 'Cole a API key de embeddings (ou use a de geração) e busque os modelos'
                  : `${embeddingsModels.length} modelos disponíveis`)
              }
            >
              <Select
                value={embeddingsModel}
                onChange={setEmbeddingsModel}
                disabled={embeddingsModels.length === 0}
                placeholder="— carregue os modelos —"
              >
                {embeddingsModels.map((m) => (
                  <SelectOption key={m} value={m}>
                    {m}
                  </SelectOption>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={isSaving}>
            Criar e validar
          </Button>
        </div>
      </form>
    </div>
  );
}
