import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService } from '@/modules/email/index.ts';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/admin/email/settings
 * Retrieves active email provider configuration and template toggles.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = emailService.getConfig();
    const templates = emailService.getTemplates();

    // Mask sensitive passwords/keys in response
    const sanitizedConfig = {
      ...config,
      smtpPassword: config.smtpPassword ? '••••••••' : '',
      resendApiKey: config.resendApiKey ? '••••••••' : '',
    };

    return NextResponse.json({
      config: sanitizedConfig,
      templates,
    });
  } catch (err: any) {
    console.error('[AdminEmailSettings] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/email/settings
 * Updates active email provider configuration and template customization.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { config: newConfig, templates: newTemplates } = body;

    let updatedConfig = emailService.getConfig();

    if (newConfig) {
      // If password/key sent as placeholder bullets, preserve existing
      const configToApply = { ...newConfig };
      if (configToApply.smtpPassword === '••••••••') {
        delete configToApply.smtpPassword;
      }
      if (configToApply.resendApiKey === '••••••••') {
        delete configToApply.resendApiKey;
      }

      updatedConfig = emailService.updateConfig(configToApply);

      // Audit Log
      await logAudit({
        actorId: session.user.id,
        action: 'EMAIL_CONFIG_UPDATED',
        entityType: 'SETTING',
        entityId: 'email_settings',
        after: {
          providerType: updatedConfig.providerType,
          smtpHost: updatedConfig.smtpHost,
          fromEmail: updatedConfig.fromEmail,
          isEnabled: updatedConfig.isEnabled,
        },
      });
    }

    if (newTemplates && typeof newTemplates === 'object') {
      for (const [key, tpl] of Object.entries(newTemplates)) {
        emailService.updateTemplate(key, tpl as any);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully.',
      config: {
        ...updatedConfig,
        smtpPassword: updatedConfig.smtpPassword ? '••••••••' : '',
        resendApiKey: updatedConfig.resendApiKey ? '••••••••' : '',
      },
      templates: emailService.getTemplates(),
    });
  } catch (err: any) {
    console.error('[AdminEmailSettings] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
