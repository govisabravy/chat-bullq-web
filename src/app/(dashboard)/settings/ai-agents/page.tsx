'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { aiAgentsService } from '@/features/ai-agents/services/ai-agents.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { listStagger } from '@/lib/motion';
import { AgentListCard } from '@/features/ai-agents/components/agent-list-card';

export default function AiAgentsListPage() {
  const { data: agents = [], isLoading, isError } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => aiAgentsService.list(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agentes IA</h1>
          <p className="text-sm text-muted-foreground">Configure modelos, prompts e comportamento dos agentes.</p>
        </div>
        <Link href="/settings/ai-agents/new">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            Novo agente
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar agentes</CardTitle>
            <CardDescription>Tente recarregar a página em instantes.</CardDescription>
          </CardHeader>
        </Card>
      ) : agents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum agente configurado</CardTitle>
            <CardDescription>
              Crie seu primeiro agente para automatizar respostas no WhatsApp.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <motion.div
          variants={listStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {agents.map((a) => (
            <AgentListCard
              key={a.id}
              id={a.id}
              name={a.name}
              description={a.description}
              provider={a.generationProvider}
              model={a.generationModel}
              isActive={a.isActive}
              updatedAt={a.updatedAt}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
