import React from 'react';
import { crmService } from '@/modules/crm';
import { LeadsClient } from './LeadsClient';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await crmService.listLeads();

  return (
    <div>
      <LeadsClient initialLeads={leads} />
    </div>
  );
}
