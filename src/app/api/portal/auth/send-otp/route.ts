import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerOtp } from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const result = await sendCustomerOtp(phone);
    if (!result.success) {
      return NextResponse.json(
        { error: result.message, notFound: result.notFound },
        { status: result.notFound ? 404 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error sending customer OTP:', err);
    return NextResponse.json({ error: err.message || 'Failed to send OTP' }, { status: 500 });
  }
}
