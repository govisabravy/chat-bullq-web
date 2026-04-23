'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiAgentsService, type AiAgent } from '../services/ai-agents.service';
import { channelsService } from '@/features/channels/services/channels.service';

export function ChannelsTab({ agent }: { agent: AiAgent }) {
  const queryClient = useQueryClient();
  const { data: allChannels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsService.list(),
  });
  const [selected, setSelected] = useState<Set<string>>(
    new Set(agent.channels.map((c) => c.channelId)),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const before = new Set(agent.channels.map((c) => c.channelId));
      const toAdd = [...selected].filter((id) => !before.has(id));
      const toRemove = [...before].filter((id) => !selected.has(id));
      for (const id of toAdd) await aiAgentsService.attachChannel(agent.id, id);
      for (const id of toRemove) await aiAgentsService.detachChannel(agent.id, id);
      toast.success('Canais atualizados');
      queryClient.invalidateQueries({ queryKey: ['ai-agent', agent.id] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {allChannels.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Nenhum canal disponível. Configure um canal em Configurações → Canais.
        </p>
      ) : (
        <ul className="space-y-2">
          {allChannels.map((c) => {
            const checked = selected.has(c.id);
            return (
              <li key={c.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    checked
                      ? 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{c.type}</p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar canais'}
      </button>
    </div>
  );
}
