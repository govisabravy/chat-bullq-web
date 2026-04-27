'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Instagram,
  Smartphone,
  MoreVertical,
  Trash2,
  Zap,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Channel } from '../services/channels.service';
import { channelsService } from '../services/channels.service';

const channelTypeMap: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  WHATSAPP_ZAPPFY: { label: 'WhatsApp (Zappfy)', icon: MessageSquare, color: 'bg-green-500' },
  WHATSAPP_OFFICIAL: { label: 'WhatsApp Official', icon: Smartphone, color: 'bg-green-600' },
  INSTAGRAM: { label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
};

interface ChannelCardProps {
  channel: Channel;
  onUpdate: () => void;
}

export function ChannelCard({ channel, onUpdate }: ChannelCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const meta = channelTypeMap[channel.type] || { label: channel.type, icon: MessageSquare, color: 'bg-gray-500' };
  const Icon = meta.icon;
  const isZappfy = channel.type === 'WHATSAPP_ZAPPFY';

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await channelsService.testConnection(channel.id);
      if (result.success) {
        const label = result.data?.profileName || result.data?.name || result.status || 'conectado';
        toast.success(`Conexão OK — ${label}`);
      } else {
        toast.error(`Falha: ${result.error || 'desconectado'}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao testar conexão');
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async () => {
    try {
      await channelsService.update(channel.id, { isActive: !channel.isActive });
      toast.success(channel.isActive ? 'Canal desativado' : 'Canal ativado');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar canal');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover este canal?')) return;
    try {
      await channelsService.remove(channel.id);
      toast.success('Canal removido');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover canal');
    }
  };

  return (
    <div className="relative flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
        {isZappfy ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="https://www.google.com/s2/favicons?domain=zappfy.io&sz=64"
            alt="Zappfy"
            className="h-6 w-6"
          />
        ) : (
          <Icon className="h-6 w-6 text-white" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {channel.name}
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              channel.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {channel.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{meta.label}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Testar Conexão
          </button>
          <button
            onClick={handleToggle}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {channel.isActive ? (
              <PowerOff className="h-3 w-3" />
            ) : (
              <Power className="h-3 w-3" />
            )}
            {channel.isActive ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <button
                onClick={() => { handleDelete(); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
