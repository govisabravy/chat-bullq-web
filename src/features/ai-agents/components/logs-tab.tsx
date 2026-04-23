'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { aiAgentsService, type AiInteractionStatus } from '../services/ai-agents.service';

const STATUS_COLORS: Record<AiInteractionStatus, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  LLM_ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  BLOCKED_GROUP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  BLOCKED_OFFHOURS: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  BLOCKED_CAP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export function LogsTab({ agentId }: { agentId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['ai-logs', agentId, page],
    queryFn: () => aiAgentsService.listLogs(agentId, { page, limit: 20 }),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5">Quando</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Latência</th>
                <th className="px-4 py-2.5 text-right">Tokens (in/out)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Carregando...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Nenhuma interação registrada
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it.id}
                    className={`cursor-pointer border-t border-zinc-100 transition-colors dark:border-zinc-800 ${
                      openId === it.id
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70'
                    }`}
                    onClick={() => setOpenId(openId === it.id ? null : it.id)}
                  >
                    <td className="px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300">
                      {new Date(it.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[it.status]}`}>
                        {it.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                      {it.latencyMs}ms
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                      {it.inputTokens}/{it.outputTokens}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openId && <LogDetail agentId={agentId} interactionId={openId} />}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs text-zinc-600 dark:text-zinc-300">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function LogDetail({ agentId, interactionId }: { agentId: string; interactionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-log', agentId, interactionId],
    queryFn: () => aiAgentsService.getLog(agentId, interactionId),
  });
  if (isLoading) return <p className="text-xs text-zinc-500">Carregando detalhe...</p>;
  if (!data) return null;
  return (
    <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
