import { useQuery } from '@tanstack/react-query';
import { SummaryParams, TimeseriesParams, metaAdsService } from '../services/meta-ads.service';

export function useTimeseries(params: TimeseriesParams) {
  return useQuery({
    queryKey: ['meta-ads', 'timeseries', params],
    queryFn: () => metaAdsService.timeseries(params),
    enabled: !!params.accountId && !!params.from && !!params.to,
    staleTime: 60_000,
  });
}

export function useSummary(params: SummaryParams) {
  return useQuery({
    queryKey: ['meta-ads', 'summary', params],
    queryFn: () => metaAdsService.summary(params),
    enabled: !!params.accountId && !!params.from && !!params.to,
    staleTime: 60_000,
  });
}

export function useTopAdsByCpl(params: SummaryParams) {
  return useQuery({
    queryKey: ['meta-ads', 'top-ads-by-cpl', params],
    queryFn: () => metaAdsService.topAdsByCpl(params),
    enabled: !!params.accountId && !!params.from && !!params.to,
    staleTime: 60_000,
  });
}
