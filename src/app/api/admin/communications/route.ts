import { NextRequest, NextResponse } from 'next/server';
import { notificationsService } from '@/modules/notifications';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || undefined;
    const leadId = searchParams.get('leadId') || undefined;

    const communications = await notificationsService.listCommunications({
      customerId,
      leadId,
    });

    return NextResponse.json({
      success: true,
      communications,
    });
  } catch (err: any) {
    console.error('Error fetching communications:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, leadId, channel, direction, summary, actorId } = body;

    if (!customerId || !channel || !direction || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, channel, direction, summary' },
        { status: 400 }
      );
    }

    const comm = await notificationsService.logCommunication({
      customerId,
      leadId,
      channel,
      direction,
      summary,
    });

    await logAudit({
      actorId: actorId ?? null,
      action: 'COMMUNICATION_LOGGED',
      entityType: leadId ? 'LEAD' : 'CUSTOMER',
      entityId: leadId || customerId,
      after: {
        id: comm.id,
        channel: comm.channel,
        direction: comm.direction,
        summary: comm.summary,
      },
    });

    return NextResponse.json({
      success: true,
      communication: comm,
    });
  } catch (err: any) {
    console.error('Error logging communication:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
