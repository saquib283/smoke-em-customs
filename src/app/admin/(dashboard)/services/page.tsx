import React from 'react';
import { catalogueService } from '@/modules/catalogue';
import { ServicesClient } from './ServicesClient';

export const dynamic = 'force-dynamic';

export default async function ServicesAdminPage() {
  const services = await catalogueService.listServices();

  return (
    <div>
      <ServicesClient initialServices={services} />
    </div>
  );
}
