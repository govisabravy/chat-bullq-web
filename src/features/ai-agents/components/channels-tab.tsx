'use client';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiAgentsService, type AiAgent } from '../services/ai-agents.service';
import { channelsService } from '@/features/channels/services/channels.service';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export function ChannelsTab({ agent }: { agent: AiAgent }) {
  const queryClient = useQueryClient();
  const { data: allChannels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsService.list(),
  });
  const initialAttached = useMemo(
    () => new Set(agent.channels.map((c) => c.channelId)),
    [agent.channels],
  );
  const [attached, setAttached] = useState<Set<string>>(initialAttached);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const setBusy = (id: string, busy: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      busy ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleChannel = async (channelId: string, nextChecked: boolean) => {
    if (pending.has(channelId)) return;
    setBusy(channelId, true);
    setAttached((prev) => {
      const next = new Set(prev);
      nextChecked ? next.add(channelId) : next.delete(channelId);
      return next;
    });
    try {
      if (nextChecked) {
        await aiAgentsService.attachChannel(agent.id, channelId);
        toast.success('Canal conectado');
      } else {
        await aiAgentsService.detachChannel(agent.id, channelId);
        toast.success('Canal desconectado');
      }
      queryClient.invalidateQueries({ queryKey: ['ai-agent', agent.id] });
    } catch (err) {
      setAttached((prev) => {
        const next = new Set(prev);
        nextChecked ? next.delete(channelId) : next.add(channelId);
        return next;
      });
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar canal');
    } finally {
      setBusy(channelId, false);
    }
  };

  if (allChannels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nenhum canal disponível. Configure um canal em Configurações → Canais.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {allChannels.map((c) => {
        const checked = attached.has(c.id);
        const busy = pending.has(c.id);
        return (
          <Card key={c.id} className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-foreground">{c.name}</CardTitle>
              </div>
              <Badge variant="info">{c.type}</Badge>
            </CardHeader>
            <CardFooter className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs font-medium text-muted-foreground">
                {checked ? 'Conectado' : 'Desconectado'}
              </span>
              <Switch
                checked={checked}
                disabled={busy}
                onChange={(v) => toggleChannel(c.id, v)}
                aria-label={`Conectar canal ${c.name}`}
              />
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
