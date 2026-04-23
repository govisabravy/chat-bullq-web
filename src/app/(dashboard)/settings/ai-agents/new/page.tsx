'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, RefreshCw } from 'lucide-react';
import { aiAgentsService, type AiProvider } from '@/features/ai-agents/services/ai-agents.service';

const PROVIDERS: AiProvider[] = ['GEMINI', 'OPENAI', 'ANTHROPIC', 'OPENROUTER'];

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
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/settings/ai-agents"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Novo agente</h2>
      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
        Configure nome, prompt e credenciais. Validação é feita ao salvar.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Field label="Nome" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Vendedor ThinkBullQ"
            className={inputCls}
          />
        </Field>

        <Field label="Descrição">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição do agente (opcional)"
            className={inputCls}
          />
        </Field>

        <Field
          label="System prompt"
          required
          hint="Variáveis disponíveis: {contactName} {contactPhone} {protocol} {currentDate} {currentTime}"
        >
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className={`${inputCls} h-auto font-mono text-xs leading-relaxed`}
          />
        </Field>

        <Field label="Provider" required>
          <select
            value={generationProvider}
            onChange={(e) => setGenerationProvider(e.target.value as AiProvider)}
            className={inputCls}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="API Key"
          required
          hint="Cole a key → sai do campo ou clica 🔄 pra carregar modelos disponíveis. Armazenada criptografada."
        >
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => apiKey.trim() && fetchModels(generationProvider, apiKey)}
              placeholder="AIza... / sk-... / etc"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => apiKey.trim() && fetchModels(generationProvider, apiKey)}
              disabled={!apiKey.trim() || loadingModels}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="Buscar modelos"
            >
              {loadingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Modelo fallback" hint="Opcional. Usado automaticamente se o modelo principal retornar 429/503/rate-limit. Precisa ser do mesmo provider.">
          <select
            value={fallbackModel}
            onChange={(e) => setFallbackModel(e.target.value)}
            disabled={models.length === 0}
            className={inputCls}
          >
            <option value="">— sem fallback —</option>
            {models
              .filter((m) => m !== generationModel)
              .map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Embeddings (RAG)" hint="Provider usado pra indexar documentos. Default: gemini-embedding-001 / text-embedding-3-small.">
          <select
            value={embeddingsProvider}
            onChange={(e) => setEmbeddingsProvider(e.target.value as 'GEMINI' | 'OPENAI')}
            className={inputCls}
          >
            <option value="GEMINI">GEMINI</option>
            <option value="OPENAI">OPENAI</option>
          </select>
        </Field>

        <Field
          label="API key de embeddings"
          hint="Opcional. Se vazio e o provider de embeddings bater com o de geração, reutiliza a key acima. Senão cai no env."
        >
          <input
            type="password"
            value={embeddingsApiKey}
            onChange={(e) => setEmbeddingsApiKey(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        <Field label="Modelo" required hint={modelsError ?? (models.length === 0 ? 'Cole a API key e busque os modelos' : `${models.length} modelos disponíveis`)}>
          <select
            value={generationModel}
            onChange={(e) => setGenerationModel(e.target.value)}
            disabled={models.length === 0}
            className={inputCls}
          >
            {models.length === 0 ? (
              <option value="">— carregue os modelos —</option>
            ) : (
              models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))
            )}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar e validar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}
