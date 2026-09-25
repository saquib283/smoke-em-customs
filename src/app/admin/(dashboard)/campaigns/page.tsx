import type { Metadata } from 'next';
import { campaignService } from '@/modules/campaigns/index.ts';
import { CampaignsClient } from './CampaignsClient';

export const metadata: Metadata = {
  title: 'Email Campaigns — Studio Control | Smoke M Customs',
  description: 'Manage and broadcast email campaigns to customer segments.',
};

export const revalidate = 0;

export default async function CampaignsPage() {
  const initialCampaigns = await campaignService.listCampaigns();

  return <CampaignsClient initialCampaigns={initialCampaigns} />;
}
