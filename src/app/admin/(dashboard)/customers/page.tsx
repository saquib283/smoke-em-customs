import React from 'react';
import { crmService } from '@/modules/crm';
import { CustomersClient } from './CustomersClient';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await crmService.listCustomers();

  return (
    <div>
      <CustomersClient initialCustomers={customers} />
    </div>
  );
}
