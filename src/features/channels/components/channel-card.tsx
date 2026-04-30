'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Instagram,
  Smartphone,
  MoreVertical,
  Settings,
  Trash2,
  Zap,
  Power,
  PowerOff,
  Loader2,
  Copy,
  RotateCw,
  Check,
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
  onEdit?: (channel: Channel) => void;
}

export function ChannelCard({ channel, onUpdate, onEdit }: ChannelCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const meta = channelTypeMap[channel.type] || { label: channel.type, icon: MessageSquare, color: 'bg-gray-500' };
  const Icon = meta.icon;
  const isZappfy = channel.type === 'WHATSAPP_ZAPPFY';

  const apiBase =
    (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';
  const webhookUrl = channel.webhookToken
    ? `${apiBase.replace(/\/$/, '')}/webhooks/${channel.type}/${channel.webhookToken}`
    : '';

  const handleCopy = async () => {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL copiada');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRotate = async () => {
    if (!confirm('Rotacionar o token vai invalidar a URL atual no provider. Continuar?')) return;
    setIsRotating(true);
    try {
      await channelsService.rotateWebhookToken(channel.id);
      toast.success('Token rotacionado — atualize a URL no provider');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao rotacionar token');
    } finally {
      setIsRotating(false);
    }
  };

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
        {webhookUrl && (
          <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Webhook URL
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <code className="flex-1 truncate rounded bg-white px-1.5 py-1 font-mono text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {webhookUrl}
              </code>
              <button
                onClick={handleCopy}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="Copiar URL"
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
              <button
                onClick={handleRotate}
                disabled={isRotating}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="Rotacionar token"
              >
                {isRotating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
              </button>
            </div>
          </div>
        )}
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
              {onEdit && (
                <button
                  onClick={() => { onEdit(channel); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Settings className="h-4 w-4" />
                  Editar
                </button>
              )}
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
