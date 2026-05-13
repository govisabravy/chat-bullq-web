import { useQuery } from '@tanstack/react-query';
import { CampaignListParams, DateRange, metaAdsService } from '../services/meta-ads.service';

export function useCampaigns(accId: string | null | undefined, params: CampaignListParams = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'campaigns', accId, params],
    queryFn: () => metaAdsService.listCampaigns(accId as string, params),
    enabled: !!accId,
    staleTime: 60_000,
  });
}

export function useCampaign(campaignId: string | null | undefined, params: DateRange = {}) {
  return useQuery({
    queryKey: ['meta-ads', 'campaign', campaignId, params],
    queryFn: () => metaAdsService.getCampaign(campaignId as string, params),
    enabled: !!campaignId,
    staleTime: 60_000,
  });
}
