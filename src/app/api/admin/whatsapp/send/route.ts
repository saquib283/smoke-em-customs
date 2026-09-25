import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { logAudit } from '@/lib/audit';
import { whatsAppCloudClient } from '@/modules/whatsapp';

/**
 * POST /api/admin/whatsapp/send
 * Authenticated admin endpoint to dispatch custom WhatsApp messages to clients
 * and automatically log them in the customer's CRM communication history.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, phone, text, leadId } = body;

    if (!phone || !text?.trim()) {
      return NextResponse.json(
        { error: 'Phone number and message text are required.' },
        { status: 400 }
      );
    }

    // 1. Send via WhatsApp Cloud Client
    const result = await whatsAppCloudClient.sendTextMessage(phone, text.trim());

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch WhatsApp message.' },
        { status: 502 }
      );
    }

    // 2. Record communication in CRM if customerId provided
    if (customerId) {
      await db.orm.public.Communication.create({
        customerId,
        leadId: leadId || undefined,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        summary: text.trim(),
      });

      // 3. Record Audit Log
      await logAudit({
        actorId: session.user.id,
        action: 'WHATSAPP_SENT',
        entityType: 'customer',
        entityId: customerId,
        after: {
          phone,
          messagePreview: text.slice(0, 100),
          messageId: result.messageId,
          simulated: result.simulated,
        },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      simulated: result.simulated,
      message: 'WhatsApp message dispatched successfully.',
    });
  } catch (err: any) {
    console.error('[AdminWhatsAppSend] Error dispatching WhatsApp:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch message' },
      { status: 500 }
    );
  }
}
