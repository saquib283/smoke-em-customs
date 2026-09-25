import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { campaignService } from '@/modules/campaigns/index.ts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/campaigns/[id]/test
 * Dispatches a personalized test preview to the requested email.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const testEmail = body.testEmail || session.user.email;

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid test recipient email is required.' },
        { status: 400 }
      );
    }

    const result = await campaignService.sendTestPreview(id, testEmail);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch test preview email.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test preview email sent to ${testEmail}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
