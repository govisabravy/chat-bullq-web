import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UpsertZohoPayload, zohoService } from '../services/zoho.service';

export function useZohoConnection() {
  return useQuery({
    queryKey: ['zoho-connection'],
    queryFn: () => zohoService.get(),
    staleTime: 60_000,
  });
}

export function useUpsertZohoConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertZohoPayload) => zohoService.upsert(payload),
    onSuccess: () => {
      toast.success('Zoho conectado');
      qc.invalidateQueries({ queryKey: ['zoho-connection'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao conectar Zoho');
    },
  });
}

export function useDisconnectZoho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => zohoService.disconnect(),
    onSuccess: () => {
      toast.success('Zoho desconectado');
      qc.invalidateQueries({ queryKey: ['zoho-connection'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao desconectar');
    },
  });
}
