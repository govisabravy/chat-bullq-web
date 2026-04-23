'use client';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Bot, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { aiAgentsService, type AiAgent } from '@/features/ai-agents/services/ai-agents.service';

export default function AiAgentsListPage() {
  const queryClient = useQueryClient();
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => aiAgentsService.list(),
  });

  const handleToggle = async (a: AiAgent) => {
    try {
      await aiAgentsService.update(a.id, { isActive: !a.isActive });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const handleDelete = async (a: AiAgent) => {
    if (!confirm(`Remover agente "${a.name}"?`)) return;
    try {
      await aiAgentsService.remove(a.id);
      toast.success('Agente removido');
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Agentes IA</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {agents.length} agente{agents.length === 1 ? '' : 's'} configurado{agents.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/settings/ai-agents/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo agente
        </Link>
      </div>

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nenhum agente configurado
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Crie seu primeiro agente pra automatizar respostas no WhatsApp
            </p>
            <Link
              href="/settings/ai-agents/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Criar agente
            </Link>
          </div>
        ) : (
          agents.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/settings/ai-agents/${a.id}`}
                  className="text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {a.name}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {a.generationProvider} · {a.generationModel}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  {a._count?.documents ?? 0} documento{(a._count?.documents ?? 0) === 1 ? '' : 's'} ·{' '}
                  {a.channels.length} canal{a.channels.length === 1 ? '' : 'is'}
                </p>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={a.isActive}
                  onChange={() => handleToggle(a)}
                  className="h-4 w-4 accent-primary"
                />
                <span className={a.isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                  {a.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </label>
              <Link
                href={`/settings/ai-agents/${a.id}`}
                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="Editar"
              >
                <Settings2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => handleDelete(a)}
                className="rounded-md p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
