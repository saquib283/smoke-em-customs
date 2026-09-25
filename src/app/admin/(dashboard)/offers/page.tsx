import React from 'react';
import { contentService } from '@/modules/content';
import { catalogueService } from '@/modules/catalogue';
import { OffersClient } from './OffersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOffersPage() {
  const [offers, services, packages] = await Promise.all([
    contentService.listOffers(),
    catalogueService.listServices(),
    catalogueService.listPackages(),
  ]);

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const packageOptions = packages.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <div>
      <OffersClient
        initialOffers={offers}
        services={serviceOptions}
        packages={packageOptions}
      />
    </div>
  );
}
