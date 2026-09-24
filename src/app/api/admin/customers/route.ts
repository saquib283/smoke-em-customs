import { NextRequest, NextResponse } from 'next/server';
import { crmService } from '@/modules/crm';
import { db } from '@/prisma/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const customer = await crmService.getCustomer(id);
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // Also get past bookings for this customer
      const bookings = await db.orm.public.Booking
        .where({ customerId: id })
        .orderBy((b) => b.startAt.desc())
        .all();

      const bookingHistory = [];
      for (const b of bookings) {
        const service = b.serviceId
          ? await db.orm.public.Service.where({ id: b.serviceId }).first()
          : null;
        const pkg = b.packageId
          ? await db.orm.public.Package.where({ id: b.packageId }).first()
          : null;

        bookingHistory.push({
          id: b.id,
          startAt: b.startAt,
          status: b.status,
          serviceName: service?.name || pkg?.name || 'Detailing Job',
          priceQuoted: b.priceQuoted ? String(b.priceQuoted) : null,
        });
      }

      return NextResponse.json({
        success: true,
        customer: {
          ...customer,
          bookings: bookingHistory,
        },
      });
    }

    const search = searchParams.get('search') || undefined;
    const customers = await crmService.listCustomers({ search });
    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    console.error('Error fetching customers:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, customerId, customerData, vehicleData } = body;

    if (action === 'CREATE_CUSTOMER') {
      const customer = await crmService.findOrCreateCustomer(customerData);
      return NextResponse.json({ success: true, customer });
    }

    if (action === 'ADD_VEHICLE') {
      if (!customerId || !vehicleData) {
        return NextResponse.json({ error: 'Missing customerId or vehicleData' }, { status: 400 });
      }
      const vehicle = await crmService.addVehicle(customerId, vehicleData);
      return NextResponse.json({ success: true, vehicle });
    }

    if (action === 'UPDATE_CUSTOMER') {
      if (!customerId || !customerData) {
        return NextResponse.json({ error: 'Missing customerId or customerData' }, { status: 400 });
      }
      const updated = await crmService.updateCustomer(customerId, customerData);
      return NextResponse.json({ success: true, customer: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in admin customers API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
