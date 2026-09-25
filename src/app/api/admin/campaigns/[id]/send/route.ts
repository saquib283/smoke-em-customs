import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { campaignService } from '@/modules/campaigns/index.ts';
import { logAudit } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/campaigns/[id]/send
 * Launches batch delivery of the campaign to the targeted customer segment.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await campaignService.launchCampaign(id);

    // Record audit log
    await logAudit({
      actorId: session.user.id,
      action: 'CAMPAIGN_LAUNCHED',
      entityType: 'CAMPAIGN',
      entityId: id,
      after: {
        title: campaign.title,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign broadcast completed. Sent: ${campaign.sentCount}, Failed: ${campaign.failedCount}`,
      campaign,
    });
  } catch (err: any) {
    console.error('[AdminCampaignLaunch] Error launching campaign:', err);
    return NextResponse.json({ error: err.message || 'Failed to launch campaign' }, { status: 500 });
  }
}
