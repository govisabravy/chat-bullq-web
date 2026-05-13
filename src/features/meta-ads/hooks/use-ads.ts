import { useQuery } from '@tanstack/react-query';
import { DateRange, metaAdsService } from '../services/meta-ads.service';

export function useAds(adSetId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ads', adSetId, params],
    queryFn: () => metaAdsService.listAds(adSetId as string, params),
    enabled: !!adSetId,
    staleTime: 60_000,
  });
}

export function useAd(adId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'ad', adId, params],
    queryFn: () => metaAdsService.getAd(adId as string, params),
    enabled: !!adId,
    staleTime: 60_000,
  });
}
