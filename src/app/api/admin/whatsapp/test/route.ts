import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { whatsAppCloudClient } from '@/modules/whatsapp';

/**
 * POST /api/admin/whatsapp/test
 * Sends a real or simulated test WhatsApp message to verify Meta Cloud API connectivity.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toPhone, customMessage } = body;

    if (!toPhone) {
      return NextResponse.json({ error: 'Recipient phone number is required.' }, { status: 400 });
    }

    const text =
      customMessage?.trim() ||
      `*SMOKE M CUSTOMS — WhatsApp API Connection Test*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Test message dispatched successfully from Smoke M Customs Cloud Engine.\n` +
      `Timestamp: ${new Date().toLocaleString('en-IN')}\n` +
      `Mode: ${whatsAppCloudClient.getDeliveryMode()}\n\n` +
      `Your two-way WhatsApp communication pipeline is operational!`;

    const result = await whatsAppCloudClient.sendTextMessage(toPhone, text);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to dispatch WhatsApp test message.',
          mode: whatsAppCloudClient.getDeliveryMode(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      simulated: result.simulated,
      mode: whatsAppCloudClient.getDeliveryMode(),
      preview: text,
    });
  } catch (err: any) {
    console.error('[AdminWhatsAppTest] Test message error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
