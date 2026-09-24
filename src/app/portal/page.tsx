import type { Metadata } from 'next';
import { PortalClient } from './PortalClient';

export const metadata: Metadata = {
  title: 'Client Service Portal — Smoke M Customs',
  description:
    'Client portal for Smoke M Customs. View booked detailing bay appointments, job card progress, digital warranty certificates, and registered garage vehicles.',
};

export const dynamic = 'force-dynamic';

export default function PortalPage() {
  return <PortalClient />;
}
