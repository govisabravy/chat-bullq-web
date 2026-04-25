'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  MapPin,
  User,
  Phone,
  FileText,
  QrCode,
  CreditCard,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { inboxService, type Conversation, type Message } from '../services/inbox.service';
import { ChatInput } from './chat-input';
import { ConversationHeader } from './conversation-header';
import { ChatBubble, type BubbleStatus } from './chat-bubble';
import { ChatEmptyState } from './chat-empty-state';
import { useSocket } from '../hooks/use-socket';
import { formatWhatsApp } from '@/lib/whatsapp-format';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  conversation?: Conversation | null;
  onConversationUpdate: () => void;
}

const MAX_TEXT_LEN = 8000;

const STATIC_MAP_STYLES = [
  'feature:all|element:labels.text.fill|color:0xa8a8a8',
  'feature:road.arterial|element:geometry|color:0x373737',
  'feature:road.highway|element:geometry|color:0x3c3c3c',
  'feature:road.highway.controlled_access|element:geometry|color:0x4e4e4e',
  'feature:road.local|element:labels.text.fill|color:0x616161',
  'feature:transit|element:labels.text.fill|color:0x757575',
  'feature:water|element:geometry|color:0x000000',
  'feature:water|element:labels.text.fill|color:0x3d3d3d',
  'feature:landscape|element:geometry|color:0x1a1a1a',
  'feature:poi|element:geometry|color:0x232323',
];

function buildStaticMapUrl(lat: number, lng: number): string {
  const template = process.env.NEXT_PUBLIC_STATIC_MAP_URL;
  if (template) {
    return template
      .replace(/\{lat\}/gi, String(lat))
      .replace(/\{lng\}/gi, String(lng))
      .replace(/\{lon\}/gi, String(lng));
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (key) {
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: '16',
      size: '400x200',
      scale: '2',
      markers: `color:red|${lat},${lng}`,
      key,
    });
    const styleQs = STATIC_MAP_STYLES.map((s) => `style=${encodeURIComponent(s)}`).join('&');
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}&${styleQs}`;
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '16',
    size: '400x200',
    markers: `${lat},${lng},red-pushpin`,
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}

function isSafeMediaUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('data:')) return false;
  return /^https?:\/\//i.test(url);
}

function needsResolve(url: unknown): boolean {
  if (typeof url !== 'string' || !url) return true;
  return url.includes('.enc?') || url.includes('mmg.whatsapp.net');
}

function MediaResolver({
  msg,
  type,
  children,
}: {
  msg: Message;
  type: 'AUDIO' | 'VIDEO' | 'IMAGE' | 'STICKER' | 'DOCUMENT';
  children: (resolvedUrl: string) => React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const c = msg.content || {};
  const initialUrl = c.mediaUrl as string | undefined;
  const canResolve = !!msg.externalId;
  const [url, setUrl] = useState<string | undefined>(
    initialUrl && !needsResolve(initialUrl) ? initialUrl : undefined,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    if (!canResolve) {
      setError('Mídia ainda não enviada');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await inboxService.resolveMedia(msg.id);
      setUrl(res.mediaUrl);
      queryClient.invalidateQueries({ queryKey: ['messages', msg.conversationId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mídia');
    } finally {
      setLoading(false);
    }
  }, [msg.id, msg.conversationId, queryClient, canResolve]);

  useEffect(() => {
    if (!url && !loading && !error && canResolve) {
      resolve();
    }
  }, [url, loading, error, resolve, canResolve]);

  if (url) return <>{children(url)}</>;
  if (loading) return (
    <p className="flex items-center gap-1.5 text-xs italic opacity-70">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando {type.toLowerCase()}...
    </p>
  );
  if (error) return (
    <button onClick={resolve} className="flex items-center gap-1.5 text-xs italic underline opacity-70">
      <RefreshCw className="h-3.5 w-3.5" /> {error} (clique pra tentar)
    </button>
  );
  return <p className="text-xs italic opacity-70">[{type}]</p>;
}

function MessageBody({ msg }: { msg: Message }) {
  const c = msg.content || {};
  switch (msg.type) {
    case 'TEXT':
      return (
        <p className="whitespace-pre-wrap break-words text-sm">
          {formatWhatsApp(toText(c.text))}
        </p>
      );
    case 'IMAGE':
      return (
        <MediaResolver msg={msg} type="IMAGE">
          {(url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Imagem" className="max-h-64 rounded-lg" loading="lazy" />
          )}
        </MediaResolver>
      );
    case 'STICKER':
      return (
        <MediaResolver msg={msg} type="STICKER">
          {(url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Figurinha" className="h-32 w-32 object-contain" loading="lazy" />
          )}
        </MediaResolver>
      );
    case 'VIDEO':
      return (
        <MediaResolver msg={msg} type="VIDEO">
          {(url) => (
            <video src={url} controls preload="metadata" className="max-h-64 rounded-lg" />
          )}
        </MediaResolver>
      );
    case 'AUDIO':
      return (
        <MediaResolver msg={msg} type="AUDIO">
          {(url) => (
            <audio src={url} controls preload="none" className="max-w-xs" />
          )}
        </MediaResolver>
      );
    case 'DOCUMENT':
      return (
        <MediaResolver msg={msg} type="DOCUMENT">
          {(url) => (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm underline"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{c.fileName || 'Documento'}</span>
            </a>
          )}
        </MediaResolver>
      );
    case 'LOCATION': {
      const lat = c.latitude;
      const lng = c.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return (
          <p className="flex items-center gap-1.5 text-xs italic opacity-70">
            <MapPin className="h-3.5 w-3.5" /> Localização indisponível
          </p>
        );
      }
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
      return (
        <div className="space-y-1">
          <iframe
            src={embedUrl}
            title="Mapa"
            loading="lazy"
            className="h-40 w-64 rounded-lg border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs underline"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {toText(c.text) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          </a>
        </div>
      );
    }
    case 'REACTION':
      return (
        <p className="text-xl">
          {c.reaction?.emoji || ''}
        </p>
      );
    case 'INTERACTIVE':
      return (
        <p className="text-sm">
          {toText(c.text)} <span className="opacity-60">[botão]</span>
        </p>
      );
    case 'CONTACT': {
      const contacts = Array.isArray(c.contacts) ? c.contacts : [];
      if (contacts.length === 0) {
        return (
          <p className="flex items-center gap-1.5 text-xs italic opacity-70">
            <User className="h-3.5 w-3.5" /> Contato (vazio)
          </p>
        );
      }
      return (
        <div className="space-y-2">
          {contacts.map((ct: any, idx: number) => (
            <div key={idx} className="rounded-md bg-muted p-2">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-4 w-4 shrink-0" />
                {ct.displayName || 'Contato'}
              </p>
              {Array.isArray(ct.phones) && ct.phones.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs">
                  {ct.phones.map((p: string, i: number) => (
                    <li key={i} className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0 opacity-70" />
                      <a href={`tel:${p}`} className="underline">{p}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }
    case 'PAYMENT': {
      const p = c.payment || {};
      const amount = typeof p.amount === 'number' && p.amount > 0
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency || 'BRL' }).format(p.amount)
        : null;
      const isPix = !!p.pixKey;
      return (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-900/20">
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {isPix ? <QrCode className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
            {isPix ? 'Pagamento Pix' : 'Pagamento'}
            {p.status && <span className="text-xs font-normal opacity-70">· {p.status}</span>}
          </p>
          {amount ? (
            <p className="mt-1 text-base font-semibold">{amount}</p>
          ) : (
            <p className="mt-1 text-xs italic opacity-70">Valor a combinar</p>
          )}
          {p.merchantName && <p className="text-xs">Recebedor: <span className="font-medium">{p.merchantName}</span></p>}
          {p.pixKey && (
            <p className="mt-1 text-xs">
              Chave {p.pixKeyType?.toLowerCase() || 'pix'}: <code className="rounded bg-muted px-1">{p.pixKey}</code>
            </p>
          )}
          {p.referenceId && <p className="mt-0.5 text-[10px] opacity-60">Ref: {p.referenceId}</p>}
          {p.note && <p className="mt-1 text-xs">{toText(p.note)}</p>}
        </div>
      );
    }
    default:
      return <p className="text-sm italic opacity-70">[{msg.type}]</p>;
  }
}

function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.length > MAX_TEXT_LEN ? value.slice(0, MAX_TEXT_LEN) + '…' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.text === 'string') return toText(v.text);
    if (typeof v.body === 'string') return toText(v.body);
    if (typeof v.caption === 'string') return toText(v.caption);
    if (typeof v.conversation === 'string') return toText(v.conversation);
  }
  return '';
}

function normalizeStatus(status: string): BubbleStatus | undefined {
  switch (status) {
    case 'SENT':
      return 'sent';
    case 'DELIVERED':
      return 'delivered';
    case 'READ':
      return 'read';
    case 'FAILED':
      return 'failed';
    default:
      return undefined;
  }
}

export function ChatPanel({ conversation, onConversationUpdate }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { on, emit } = useSocket();

  const conversationId = conversation?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => inboxService.getMessages(conversationId as string),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
  });

  const messages = data?.messages || [];

  useEffect(() => {
    if (!conversationId) return;
    emit('join:conversation', { conversationId });
    return () => {
      emit('leave:conversation', { conversationId });
    };
  }, [conversationId, emit]);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = on('message:new', (payload: any) => {
      if (payload.conversationId === conversationId || payload.message?.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });
    return unsub;
  }, [conversationId, on, queryClient]);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = on('message:updated', (payload: any) => {
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });
    return unsub;
  }, [conversationId, on, queryClient]);

  useEffect(() => {
    if (!conversationId) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollToEnd = () => {
      container.scrollTop = container.scrollHeight;
    };

    scrollToEnd();
    const timers = [50, 150, 400, 900].map((ms) => setTimeout(scrollToEnd, ms));

    const observer = new MutationObserver(scrollToEnd);
    observer.observe(container, { childList: true, subtree: true });
    const disconnectTimer = setTimeout(() => observer.disconnect(), 1500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(disconnectTimer);
      observer.disconnect();
    };
  }, [conversationId, messages.length === 0 ? 0 : 1]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 300) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!conversationId) return;
    inboxService
      .markRead(conversationId)
      .then((res) => {
        if (res.readCount > 0) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      })
      .catch(() => {});
  }, [conversationId, queryClient]);

  if (!conversation) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-background">
        <ChatEmptyState />
      </div>
    );
  }

  const handleSend = async (text: string) => {
    const msg = await inboxService.sendMessage({
      conversationId: conversation.id,
      type: 'TEXT',
      content: { text },
    });
    queryClient.setQueryData(['messages', conversation.id], (old: any) => {
      if (!old) return old;
      const exists = old.messages?.some((m: Message) => m.id === msg.id);
      if (exists) return old;
      return { ...old, messages: [...(old.messages || []), msg] };
    });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <ConversationHeader
        conversation={conversation}
        onUpdate={onConversationUpdate}
      />

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto bg-background p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {messages.map((msg) => {
              const isOutbound = msg.direction === 'OUTBOUND';
              const direction = isOutbound ? 'outbound' : 'inbound';
              const formatted = formatTime(msg.createdAt);
              const normalizedStatus = normalizeStatus(msg.status);

              if (msg.type === 'TEXT' && msg.status !== 'FAILED') {
                return (
                  <ChatBubble
                    key={msg.id}
                    direction={direction}
                    timestamp={formatted}
                    status={normalizedStatus}
                  >
                    {formatWhatsApp(toText(msg.content?.text))}
                  </ChatBubble>
                );
              }

              const isFailed = msg.status === 'FAILED';

              return (
                <div
                  key={msg.id}
                  className={cn('flex w-full', isOutbound ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-xs',
                      isFailed
                        ? 'rounded-br-sm border border-destructive/40 bg-destructive/10 text-destructive-foreground'
                        : isOutbound
                          ? 'rounded-br-sm bg-primary/90 text-primary-foreground'
                          : 'rounded-bl-sm border border-border bg-card text-card-foreground',
                    )}
                    title={isFailed ? msg.failedReason || 'Falha ao enviar' : undefined}
                  >
                    <MessageBody msg={msg} />
                    {msg.type !== 'TEXT' && msg.content?.caption && (
                      <p className="mt-1.5 break-words text-sm">
                        {formatWhatsApp(toText(msg.content.caption))}
                      </p>
                    )}
                    {isFailed && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {msg.failedReason || 'Falha ao enviar'}
                      </p>
                    )}
                    <div
                      className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-[10px]',
                        isOutbound ? 'opacity-70' : 'text-muted-foreground',
                      )}
                    >
                      <span>{formatted}</span>
                      {isOutbound && msg.metadata?.viaMobile && (
                        <Smartphone className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatInput
        conversationId={conversation.id}
        onSend={handleSend}
        disabled={conversation.status === 'CLOSED'}
        onMediaSent={() => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }}
      />
    </div>
  );
}
