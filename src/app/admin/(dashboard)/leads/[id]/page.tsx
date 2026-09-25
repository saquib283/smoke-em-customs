import React from 'react';
import { notFound } from 'next/navigation';
import { crmService } from '@/modules/crm';
import { notificationsService } from '@/modules/notifications';
import { LeadDetailClient } from './LeadDetailClient';


export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lead = await crmService.getLead(id);

  if (!lead) {
    notFound();
  }

  const communications = await notificationsService.listCommunications({ leadId: id });

  return <LeadDetailClient initialLead={lead} initialCommunications={communications} />;
}
