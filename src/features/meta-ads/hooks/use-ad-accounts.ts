import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AdAccount,
  ConnectAccountPayload,
  metaAdsService,
} from '../services/meta-ads.service';

export function useAdAccounts() {
  return useQuery({
    queryKey: ['meta-ads', 'accounts'],
    queryFn: () => metaAdsService.listAccounts(),
    staleTime: 60_000,
  });
}

export function useAdAccount(id: string | null | undefined) {
  return useQuery({
    queryKey: ['meta-ads', 'accounts', id],
    queryFn: () => metaAdsService.getAccount(id as string),
    enabled: !!id,
    refetchInterval: (query) => {
      const d = query.state.data as AdAccount | undefined;
      return d?.lastSyncStatus === 'RUNNING' ? 30_000 : false;
    },
  });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConnectAccountPayload) => metaAdsService.connectAccount(payload),
    onSuccess: (account) => {
      toast.success(`Conta ${account.name} conectada`);
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao conectar conta');
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metaAdsService.deleteAccount(id),
    onSuccess: () => {
      toast.success('Conta removida');
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover conta');
    },
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; scope?: 'hierarchy' | 'insights' | 'all' }) =>
      metaAdsService.triggerSync(args.id, args.scope),
    onSuccess: (_data, vars) => {
      toast.success('Sync iniciado');
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts', vars.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar sync');
    },
  });
}

export function useReconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; accessToken: string; appId?: string; appSecret?: string }) =>
      metaAdsService.reconnect(args.id, {
        accessToken: args.accessToken,
        appId: args.appId,
        appSecret: args.appSecret,
      }),
    onSuccess: (account) => {
      toast.success(`Conta ${account.name} reconectada`);
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts'] });
      qc.invalidateQueries({ queryKey: ['meta-ads', 'accounts', account.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao reconectar');
    },
  });
}
