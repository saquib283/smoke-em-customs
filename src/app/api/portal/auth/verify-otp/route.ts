import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerOtp } from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and verification code are required' }, { status: 400 });
    }

    const result = await verifyCustomerOtp(phone, code);
    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
      customer: result.customer,
    });

    // Set secure HTTP-only cookie
    response.cookies.set('smc_customer_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Error verifying customer OTP:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
