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
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import { inboxService, type Conversation } from '../services/inbox.service';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeInUp, listStagger } from '@/lib/motion';

const channelIcons: Record<string, React.ElementType> = {
  WHATSAPP_ZAPPFY: MessageSquare,
  WHATSAPP_OFFICIAL: Smartphone,
  INSTAGRAM: Instagram,
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-warning',
  OPEN: 'bg-success',
  BOT: 'bg-info',
  WAITING: 'bg-primary',
  CLOSED: 'bg-muted-foreground',
};

const statusOptions = [
  { label: 'Pendentes', value: 'PENDING', icon: Clock },
  { label: 'Abertos', value: 'OPEN', icon: MessageCircle },
  { label: 'Aguardando', value: 'WAITING', icon: Hourglass },
  { label: 'Fechados', value: 'CLOSED', icon: CheckCircle2 },
] as const;

interface ConversationListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onPrefetch?: (id: string) => void;
}

export function ConversationList({ activeId, onSelect, onPrefetch }: ConversationListProps) {
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations', statusFilterKey, debouncedSearch],
    queryFn: () => {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilters.size > 0) params.status = Array.from(statusFilters).join(',');
      if (debouncedSearch) params.search = debouncedSearch;
      return inboxService.getConversations(params);
    },
    refetchInterval: 10000,
    retry: 1,
  });

  const conversations = data?.conversations || [];

  const getLastMessagePreview = (conv: Conversation) => {
    const last = conv.messages[0];
    if (!last) return 'Sem mensagens';
    const prefix = last.direction === 'OUTBOUND' ? 'Você: ' : '';
    const raw = last.content?.text;
    const text =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object'
          ? (raw as any).text || (raw as any).body || (raw as any).caption || ''
          : '';
    return prefix + (text || `[${last.type}]`);
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
    <div className="flex h-full min-h-0 w-80 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="relative flex-1">
          <Input
            ref={searchRef}
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            iconLeft={<Search className="h-4 w-4" />}
            className={`h-9 text-[13px] ${search ? 'pr-9' : ''}`}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                handleSearchChange('');
                searchRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-smooth hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Popover className="relative">
          <PopoverButton
            className={`relative flex h-9 w-9 items-center justify-center rounded-md border border-border outline-none transition-smooth data-[open]:bg-accent ${
              statusFilters.size > 0
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {statusFilters.size > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs">
                {statusFilters.size}
              </span>
            )}
          </PopoverButton>

          <PopoverPanel
            anchor="bottom end"
            transition
            className="z-50 mt-1.5 w-52 rounded-lg border border-border bg-popover p-1.5 shadow-soft outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 [--anchor-gap:0.375rem]"
          >
            <div>
              <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              {statusOptions.map((f) => {
                const isActive = statusFilters.has(f.value);
                const Icon = f.icon;
                return (
                  <div
                    key={f.value}
                    onClick={() => toggleStatus(f.value)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleStatus(f.value);
                      }
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-smooth ${
                      isActive
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <span onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isActive}
                        onChange={() => toggleStatus(f.value)}
                        aria-label={f.label}
                      />
                    </span>
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{f.label}</span>
                  </div>
                );
              })}
              {statusFilters.size > 0 && (
                <>
                  <Separator className="my-1" />
                  <button
                    onClick={clearStatusFilters}
                    className="flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground transition-smooth hover:bg-accent/50 hover:text-foreground"
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

      {statusFilters.size > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {Array.from(statusFilters).map((value) => {
            const option = statusOptions.find((f) => f.value === value);
            if (!option) return null;
            return (
              <Badge
                key={value}
                variant="info"
                className="gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]"
              >
                {option.label}
                <button
                  onClick={() => toggleStatus(value)}
                  className="rounded-full p-0.5 transition-smooth hover:bg-info/20"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
          {statusFilters.size > 1 && (
            <button
              onClick={clearStatusFilters}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground"
            >
              <X className="h-2.5 w-2.5" />
              Limpar
            </button>
          )}
        </div>
      )}

      <Separator className="mx-3 w-auto" />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-3 py-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <p className="mt-3 text-[13px] font-medium text-destructive">
              Erro ao carregar conversas
            </p>
            <p className="mt-1 px-4 text-[11px] text-muted-foreground">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-[13px] font-medium text-muted-foreground">
              Nenhuma conversa encontrada
            </p>
            {(statusFilters.size > 0 || search) && (
              <button
                onClick={() => {
                  clearStatusFilters();
                  handleSearchChange('');
                }}
                className="mt-2 text-xs text-primary transition-smooth hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <motion.ul
            variants={listStagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
          >
            {conversations.map((conv) => {
              const Icon = channelIcons[conv.channel.type] || MessageSquare;
              const isActive = conv.id === activeId;
              const unread = conv.unreadCount ?? 0;
              return (
                <motion.li
                  key={conv.id}
                  variants={fadeInUp}
                  layout
                  className="list-none"
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    onMouseEnter={() => onPrefetch?.(conv.id)}
                    onFocus={() => onPrefetch?.(conv.id)}
                    className={`group relative flex w-full gap-3 px-3 py-2.5 text-left transition-smooth ${
                      isActive ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="conversation-active"
                        className="absolute left-0 top-0 h-full w-[2px] bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <div className="relative shrink-0">
                      <Avatar
                        src={conv.contact.avatarUrl}
                        alt={conv.contact.name || ''}
                        fallback={conv.contact.name || conv.contact.phone || '??'}
                        size="lg"
                        className="h-10 w-10 text-[13px]"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-card ${
                          statusColors[conv.status] || 'bg-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-[13px] font-medium ${
                            isActive ? 'text-foreground' : 'text-foreground/90'
                          }`}
                        >
                          {conv.contact.name || conv.contact.phone || 'Desconhecido'}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="truncate text-[12px] text-muted-foreground">
                          {getLastMessagePreview(conv)}
                        </p>
                        {unread > 0 && (
                          <Badge
                            variant="info"
                            className="ml-auto h-5 min-w-5 shrink-0 justify-center rounded-full border-transparent bg-info px-1.5 text-[10px] font-bold text-info-foreground"
                          >
                            {unread > 99 ? '99+' : unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
