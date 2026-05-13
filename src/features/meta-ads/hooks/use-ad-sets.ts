import { useQuery } from '@tanstack/react-query';
import { DateRange, metaAdsService } from '../services/meta-ads.service';

export function useAdSets(campaignId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ad-sets', campaignId, params],
    queryFn: () => metaAdsService.listAdSets(campaignId as string, params),
    enabled: !!campaignId,
    staleTime: 60_000,
  });
}

export function useAdSet(adSetId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ad-set', adSetId, params],
    queryFn: () => metaAdsService.getAdSet(adSetId as string, params),
    enabled: !!adSetId,
    staleTime: 60_000,
  });
}
