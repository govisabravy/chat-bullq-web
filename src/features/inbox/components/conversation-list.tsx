'use client';

import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Smartphone,
  Instagram,
  Search,
  X,
  Inbox,
  Clock,
  MessageCircle,
  Hourglass,
  CheckCircle2,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { inboxService, type Conversation } from '../services/inbox.service';

const channelIcons: Record<string, React.ElementType> = {
  WHATSAPP_ZAPPFY: MessageSquare,
  WHATSAPP_OFFICIAL: Smartphone,
  INSTAGRAM: Instagram,
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-400',
  OPEN: 'bg-emerald-400',
  BOT: 'bg-blue-400',
  WAITING: 'bg-violet-400',
  CLOSED: 'bg-zinc-300 dark:bg-zinc-600',
};

const filters = [
  { label: 'Todos', value: '', icon: Inbox },
  { label: 'Pendentes', value: 'PENDING', icon: Clock },
  { label: 'Abertos', value: 'OPEN', icon: MessageCircle },
  { label: 'Aguardando', value: 'WAITING', icon: Hourglass },
  { label: 'Fechados', value: 'CLOSED', icon: CheckCircle2 },
] as const;

interface ConversationListProps {
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ activeId, onSelect }: ConversationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', statusFilter, debouncedSearch],
    queryFn: () => {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      return inboxService.getConversations(params);
    },
    refetchInterval: 10000,
  });

  const conversations = data?.conversations || [];

  const getLastMessagePreview = (conv: Conversation) => {
    const last = conv.messages[0];
    if (!last) return 'Sem mensagens';
    const prefix = last.direction === 'OUTBOUND' ? 'Você: ' : '';
    return prefix + (last.content?.text || `[${last.type}]`);
  };

  const formatTime = (date: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 24) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex h-full w-80 flex-col border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Search */}
      <div className="px-3 pt-3">
        <div className="group relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border-0 bg-zinc-100/80 py-1.5 pl-8 pr-8 text-[13px] text-zinc-900 outline-none ring-1 ring-transparent transition-all placeholder:text-zinc-400 focus:bg-white focus:ring-primary/30 focus:shadow-sm dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900 dark:focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => { handleSearchChange(''); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="relative px-3 py-2">
        <nav className="scrollbar-none flex gap-0.5 overflow-x-auto" role="tablist">
          {filters.map((f) => {
            const isActive = statusFilter === f.value;
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(f.value)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-zinc-100 dark:border-zinc-800/60" />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-3 py-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-36 animate-pulse rounded bg-zinc-50 dark:bg-zinc-800/60" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <MessageSquare className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="mt-3 text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
              Nenhuma conversa encontrada
            </p>
            {(statusFilter || search) && (
              <button
                onClick={() => { setStatusFilter(''); handleSearchChange(''); }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          conversations.map((conv) => {
            const Icon = channelIcons[conv.channel.type] || MessageSquare;
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`group flex w-full gap-3 px-3 py-2.5 text-left transition-colors duration-100 ${
                  isActive
                    ? 'bg-primary/[0.06] dark:bg-primary/10'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-[13px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {conv.contact.name?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-white dark:border-zinc-950 ${statusColors[conv.status] || 'bg-zinc-300'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[13px] font-medium ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {conv.contact.name || conv.contact.phone || 'Desconhecido'}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Icon className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
                    <p className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                      {getLastMessagePreview(conv)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
