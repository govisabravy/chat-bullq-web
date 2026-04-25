'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { aiAgentsService, type AiInteractionStatus } from '../services/ai-agents.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectOption } from '@/components/ui/select';

type StatusFilter = 'ALL' | AiInteractionStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'SUCCESS', label: 'Sucesso' },
  { value: 'LLM_ERROR', label: 'Erro LLM' },
  { value: 'BLOCKED_GROUP', label: 'Bloqueado (grupo)' },
  { value: 'BLOCKED_OFFHOURS', label: 'Bloqueado (fora do horario)' },
  { value: 'BLOCKED_CAP', label: 'Bloqueado (limite)' },
];

function statusVariant(status: AiInteractionStatus): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'LLM_ERROR') return 'error';
  if (status.startsWith('BLOCKED_')) return 'warning';
  return 'default';
}

const ROW_GRID = 'grid grid-cols-[140px_1fr_80px_80px_100px] gap-3';
const PAGE_SIZE = 20;

export function LogsTab({ agentId }: { agentId: string }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ai-logs', agentId, page, statusFilter],
    queryFn: () =>
      aiAgentsService.listLogs(agentId, {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      }),
  });

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPage(1);
              setOpenId(null);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <SelectOption key={opt.value} value={opt.value}>
                {opt.label}
              </SelectOption>
            ))}
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {total} {total === 1 ? 'interacao' : 'interacoes'}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="max-h-[560px] overflow-auto">
          <div className={`sticky top-0 z-10 ${ROW_GRID} border-b border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground`}>
            <div>Data</div>
            <div>Status</div>
            <div className="text-right">Input tokens</div>
            <div className="text-right">Output tokens</div>
            <div className="text-right">Latencia</div>
          </div>

          {isLoading ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma interacao registrada
            </div>
          ) : (
            items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setOpenId(openId === it.id ? null : it.id)}
                className={`${ROW_GRID} w-full cursor-pointer items-center border-b border-border/50 px-3 py-2 text-left text-sm transition-smooth hover:bg-accent/40 ${
                  openId === it.id ? 'bg-accent/40' : ''
                }`}
              >
                <span className="text-xs text-muted-foreground">
                  {new Date(it.createdAt).toLocaleString('pt-BR')}
                </span>
                <span>
                  <Badge variant={statusVariant(it.status)}>{it.status}</Badge>
                </span>
                <span className="text-right tabular-nums text-foreground">
                  {it.inputTokens}
                </span>
                <span className="text-right tabular-nums text-foreground">
                  {it.outputTokens}
                </span>
                <span className="text-right tabular-nums text-muted-foreground">
                  {it.latencyMs}ms
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {openId && <LogDetail agentId={agentId} interactionId={openId} />}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <span className="mr-2 text-xs text-muted-foreground">
          Pagina {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || isLoading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((p) => p + 1)}
        >
          Proxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function LogDetail({ agentId, interactionId }: { agentId: string; interactionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-log', agentId, interactionId],
    queryFn: () => aiAgentsService.getLog(agentId, interactionId),
  });
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando detalhe...</p>;
  }
  if (!data) return null;
  return (
    <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
