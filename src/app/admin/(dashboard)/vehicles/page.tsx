import React from 'react';
import { crmService } from '@/modules/crm';
import { VehiclesClient } from './VehiclesClient';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage() {
  const vehicles = await crmService.listAllVehicles();

  return (
    <div>
      <VehiclesClient initialVehicles={vehicles} />
    </div>
  );
}
