'use client';

import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Smartphone,
  Instagram,
  Search,
  X,
  Clock,
  MessageCircle,
  Hourglass,
  CheckCircle2,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
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

const statusOptions = [
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
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toggleStatus = useCallback((value: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const clearStatusFilters = useCallback(() => setStatusFilters(new Set()), []);

  const statusFilterKey = Array.from(statusFilters).sort().join(',');

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', statusFilterKey, debouncedSearch],
    queryFn: () => {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilters.size > 0) params.status = Array.from(statusFilters).join(',');
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
      {/* Search + Filter */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
        <div className="group relative flex-1">
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

        <Popover className="relative">
          <PopoverButton className={`relative flex h-[30px] w-[30px] items-center justify-center rounded-md transition-colors outline-none data-[open]:bg-zinc-100 data-[open]:text-zinc-600 dark:data-[open]:bg-zinc-800 dark:data-[open]:text-zinc-300 ${
            statusFilters.size > 0
              ? 'bg-primary/10 text-primary dark:bg-primary/20 data-[open]:bg-primary/10 data-[open]:text-primary dark:data-[open]:bg-primary/20 dark:data-[open]:text-primary'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
          }`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {statusFilters.size > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                {statusFilters.size}
              </span>
            )}
          </PopoverButton>

          <PopoverPanel
            anchor="bottom end"
            transition
            className="z-50 mt-1.5 w-48 rounded-lg border border-zinc-200/80 bg-white p-1 shadow-lg outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-zinc-800 dark:bg-zinc-900 [--anchor-gap:0.25rem]"
          >
            <div>
              <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Status
              </p>
              {statusOptions.map((f) => {
                const isActive = statusFilters.has(f.value);
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    onClick={() => toggleStatus(f.value)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                      isActive
                        ? 'bg-primary/[0.06] font-medium text-primary dark:bg-primary/10'
                        : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}>
                      {isActive && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{f.label}</span>
                  </button>
                );
              })}
              {statusFilters.size > 0 && (
                <>
                  <div className="mx-2 my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={clearStatusFilters}
                    className="flex w-full items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300"
                  >
                    <X className="h-3 w-3" />
                    Limpar filtros
                  </button>
                </>
              )}
            </div>
          </PopoverPanel>
        </Popover>
      </div>

      {/* Active filter chips */}
      {statusFilters.size > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {Array.from(statusFilters).map((value) => {
            const option = statusOptions.find((f) => f.value === value);
            if (!option) return null;
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary dark:bg-primary/20"
              >
                {option.label}
                <button
                  onClick={() => toggleStatus(value)}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/20 dark:hover:bg-primary/30"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
          {statusFilters.size > 1 && (
            <button
              onClick={clearStatusFilters}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-2.5 w-2.5" />
              Limpar
            </button>
          )}
        </div>
      )}

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
            {(statusFilters.size > 0 || search) && (
              <button
                onClick={() => { clearStatusFilters(); handleSearchChange(''); }}
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
