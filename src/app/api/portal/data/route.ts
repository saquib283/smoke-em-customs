import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerSession } from '@/lib/customer-auth';
import { crmService } from '@/modules/crm';
import { bookingService } from '@/modules/booking';
import { quotingService } from '@/modules/quoting';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('smc_customer_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: please sign in with mobile OTP' }, { status: 401 });
    }

    const session = verifyCustomerSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Session expired: please sign in again' }, { status: 401 });
    }

    const [customer, bookings, quotes] = await Promise.all([
      crmService.getCustomer(session.customerId),
      bookingService.listBookings({ customerId: session.customerId }),
      quotingService.listQuotes({ customerId: session.customerId }),
    ]);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer,
      bookings,
      quotes,
    });
  } catch (err: any) {
    console.error('Error fetching portal data:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
