import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { campaignService } from '@/modules/campaigns/index.ts';

/**
 * GET /api/admin/campaigns
 * Lists all marketing email campaigns.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await campaignService.listCampaigns();
    return NextResponse.json({ campaigns });
  } catch (err: any) {
    console.error('[AdminCampaigns] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/campaigns
 * Creates a new email campaign draft.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, subject, preheader, contentHtml, audienceType } = body;

    if (!title?.trim() || !subject?.trim() || !contentHtml?.trim()) {
      return NextResponse.json(
        { error: 'Campaign title, subject line, and email body content are required.' },
        { status: 400 }
      );
    }

    const campaign = await campaignService.createCampaign({
      title,
      subject,
      preheader,
      contentHtml,
      audienceType,
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campaign created successfully.',
    });
  } catch (err: any) {
    console.error('[AdminCampaigns] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
