'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, Trash2, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { channelsService, type ChannelMember } from '../services/channels.service';
import { membersService, type Member } from '@/features/settings/services/members.service';

interface ChannelMembersDialogProps {
  channelId: string;
  open: boolean;
  canManage: boolean;
  onClose: () => void;
}

export function ChannelMembersDialog({ channelId, open, canManage, onClose }: ChannelMembersDialogProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['channel-members', channelId],
    queryFn: () => channelsService.listMembers(channelId),
    enabled: open,
  });

  const { data: orgMembers } = useQuery({
    queryKey: ['org-members'],
    queryFn: () => membersService.list(),
    enabled: open && canManage,
  });

  if (!open) return null;

  const memberUserIds = new Set((members ?? []).map((m) => m.userId));
  const candidates: Member[] = (orgMembers ?? []).filter(
    (m) => !memberUserIds.has(m.userId) && m.user.isActive,
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setAdding(true);
    try {
      await channelsService.addMember(channelId, { userId: selectedUserId });
      toast.success('Usuário adicionado');
      setSelectedUserId('');
      queryClient.invalidateQueries({ queryKey: ['channel-members', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro ao adicionar');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remover este usuário do canal?')) return;
    try {
      await channelsService.removeMember(channelId, userId);
      toast.success('Removido');
      queryClient.invalidateQueries({ queryKey: ['channel-members', channelId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro ao remover');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Membros do Canal
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {canManage && (
            <div className="mb-4 flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Selecionar usuário...</option>
                {candidates.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} — {m.user.email}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedUserId || adding}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Adicionar
              </button>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-zinc-500">Carregando...</div>
            ) : members && members.length > 0 ? (
              members.map((m: ChannelMember) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {m.user.name}
                        {m.role === 'OWNER' && (
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <div className="truncate text-xs text-zinc-500">{m.user.email}</div>
                    </div>
                  </div>
                  {canManage && m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500">
                Nenhum membro encontrado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
