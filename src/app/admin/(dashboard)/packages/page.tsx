import React from 'react';
import { catalogueService } from '@/modules/catalogue';
import { PackagesClient } from './PackagesClient';

export const dynamic = 'force-dynamic';

export default async function PackagesAdminPage() {
  const [packages, services] = await Promise.all([
    catalogueService.listPackages(),
    catalogueService.listServices(),
  ]);

  return (
    <div>
      <PackagesClient initialPackages={packages} availableServices={services} />
    </div>
  );
}
