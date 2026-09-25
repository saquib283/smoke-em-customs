import React from 'react';
import type { Metadata } from 'next';
import { CampaignComposerClient } from './CampaignComposerClient';

export const metadata: Metadata = {
  title: 'Compose Campaign | Smoke M Customs Studio Admin',
};

export default function NewCampaignPage() {
  return <CampaignComposerClient />;
}
