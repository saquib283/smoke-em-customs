import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWhatsAppConfig, updateWhatsAppConfig, whatsAppCloudClient } from '@/modules/whatsapp';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/admin/whatsapp/settings
 * Returns current WhatsApp Cloud API credentials, active delivery mode, and automated workflow toggles.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getWhatsAppConfig();

    // Mask sensitive keys/tokens in response
    const sanitizedConfig = {
      ...config,
      accessToken: config.accessToken ? '••••••••' : '',
      appSecret: config.appSecret ? '••••••••' : '',
    };

    return NextResponse.json({
      config: sanitizedConfig,
      deliveryMode: whatsAppCloudClient.getDeliveryMode(),
      isSimulated: whatsAppCloudClient.isSimulated(),
      webhookUrl: `${process.env['AUTH_URL'] || 'https://smokecustoms.com'}/api/webhooks/whatsapp`,
    });
  } catch (err: any) {
    console.error('[AdminWhatsAppSettings] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/whatsapp/settings
 * Updates active WhatsApp configuration and persists changes.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { config: newConfig } = body;

    if (!newConfig) {
      return NextResponse.json({ error: 'Missing configuration payload' }, { status: 400 });
    }

    const configToApply = { ...newConfig };
    // Preserve existing masked secrets if placeholder was sent
    if (configToApply.accessToken === '••••••••') {
      delete configToApply.accessToken;
    }
    if (configToApply.appSecret === '••••••••') {
      delete configToApply.appSecret;
    }

    const updated = updateWhatsAppConfig(configToApply);

    await logAudit({
      actorId: session.user.id,
      action: 'WHATSAPP_CONFIG_UPDATED',
      entityType: 'SETTINGS',
      entityId: 'whatsapp',
      after: {
        isEnabled: updated.isEnabled,
        phoneNumberId: updated.phoneNumberId,
        autoSendLeadWelcome: updated.autoSendLeadWelcome,
        autoSendQuoteNotification: updated.autoSendQuoteNotification,
        autoSendBookingConfirmation: updated.autoSendBookingConfirmation,
        autoSendBookingCancellation: updated.autoSendBookingCancellation,
      },
    });

    const sanitizedConfig = {
      ...updated,
      accessToken: updated.accessToken ? '••••••••' : '',
      appSecret: updated.appSecret ? '••••••••' : '',
    };

    return NextResponse.json({
      success: true,
      config: sanitizedConfig,
      deliveryMode: whatsAppCloudClient.getDeliveryMode(),
    });
  } catch (err: any) {
    console.error('[AdminWhatsAppSettings] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
