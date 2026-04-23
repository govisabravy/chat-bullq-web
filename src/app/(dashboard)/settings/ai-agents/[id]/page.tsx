'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bot, ChevronLeft, Loader2 } from 'lucide-react';
import { aiAgentsService } from '@/features/ai-agents/services/ai-agents.service';
import { GeneralTab } from '@/features/ai-agents/components/general-tab';
import { DocumentsTab } from '@/features/ai-agents/components/documents-tab';
import { ChannelsTab } from '@/features/ai-agents/components/channels-tab';
import { TestTab } from '@/features/ai-agents/components/test-tab';
import { LogsTab } from '@/features/ai-agents/components/logs-tab';

const TABS = ['Geral', 'Documentos', 'Canais', 'Teste', 'Logs'] as const;
type Tab = (typeof TABS)[number];

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('Geral');
  const { data: agent, isLoading } = useQuery({
    queryKey: ['ai-agent', id],
    queryFn: () => aiAgentsService.get(id),
  });

  if (isLoading || !agent) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando agente...
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/settings/ai-agents"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{agent.name}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {agent.generationProvider} · {agent.generationModel}
            {!agent.isActive && <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">Inativo</span>}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'Geral' && <GeneralTab agent={agent} />}
        {tab === 'Documentos' && <DocumentsTab agentId={agent.id} />}
        {tab === 'Canais' && <ChannelsTab agent={agent} />}
        {tab === 'Teste' && <TestTab agentId={agent.id} />}
        {tab === 'Logs' && <LogsTab agentId={agent.id} />}
      </div>
    </div>
  );
}
