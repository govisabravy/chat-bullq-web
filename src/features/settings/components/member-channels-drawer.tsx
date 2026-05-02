'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { channelsService, type Channel } from '@/features/channels/services/channels.service';
import { channelAccessService } from '@/features/settings/services/channel-access.service';

interface Props {
  open: boolean;
  onClose: () => void;
  member: { id: string; name: string; role: 'OWNER' | 'ADMIN' | 'AGENT' } | null;
  onSaved?: () => void;
}

export function MemberChannelsDrawer({ open, onClose, member, onSaved }: Props) {
  const enabled = open && !!member && member.role === 'AGENT';

  const { data: channels, isLoading: loadingChannels } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsService.list(),
    enabled: open,
  });

  const { data: access, isLoading: loadingAccess } = useQuery({
    queryKey: ['member-channels', member?.id],
    queryFn: () => channelAccessService.listMemberChannels(member!.id),
    enabled,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (access) setSelected(new Set(access.channelIds));
  }, [access]);

  if (!open || !member) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await channelAccessService.setMemberChannels(member.id, [...selected]);
      toast.success('Canais atualizados');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-zinc-900">
        <header className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Canais de {member.name}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {member.role === 'AGENT'
                ? 'Marque os canais que este agente pode ver e atender.'
                : 'OWNER e ADMIN têm acesso a todos os canais por padrão.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {member.role !== 'AGENT' ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              Acesso total — nenhuma restrição por canal se aplica.
            </div>
          ) : loadingChannels || loadingAccess ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : !channels?.length ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Nenhum canal configurado nesta organização.
            </div>
          ) : (
            <ul className="space-y-1">
              {channels.map((c: Channel) => {
                const checked = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">{c.type}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {member.role === 'AGENT' && (
          <footer className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
