import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService, renderLuxuryEmailLayout } from '@/modules/email/index.ts';

/**
 * POST /api/admin/email/test
 * Verifies email provider connectivity and dispatches a test email to the recipient.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const recipientEmail = body.toEmail || session.user.email;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid test recipient email address is required.' },
        { status: 400 }
      );
    }

    // 1. Verify active connection
    const verifyResult = await emailService.verifyConnection();
    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Provider connection check failed: ${verifyResult.error || 'Unable to connect to host.'}`,
        },
        { status: 400 }
      );
    }

    const config = emailService.getConfig();

    // 2. Render luxury test email
    const subject = `[Smoke M Customs] Email Service Test — ${config.providerType}`;
    const bodyHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
        Email Service Connection Verified
      </h2>
      <p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
        This test message confirms that your Smoke M Customs email service is operational and properly configured.
      </p>

      <div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 13px; color: #E8E8ED;">
          <tr><td style="color: #8E8E9A; width: 40%;">Active Provider:</td><td><strong style="color: #E5A93C;">${config.providerType}</strong></td></tr>
          ${config.smtpHost ? `<tr><td style="color: #8E8E9A;">SMTP Host:</td><td>${config.smtpHost}:${config.smtpPort}</td></tr>` : ''}
          <tr><td style="color: #8E8E9A;">From Address:</td><td>${config.fromName} &lt;${config.fromEmail}&gt;</td></tr>
          <tr><td style="color: #8E8E9A;">Sent At:</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #8E8E9A; margin: 0;">
        Client automated emails (booking reservations, formal estimates, welcome acknowledgments) and email marketing campaigns will now be routed through this configuration.
      </p>
    `;

    const html = renderLuxuryEmailLayout({
      title: subject,
      preheader: `Email provider test for ${config.providerType} succeeded.`,
      bodyHtml,
      ctaText: 'Open Admin Studio Control',
      ctaUrl: 'https://smokecustoms.com/admin',
    });

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch test email.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email dispatched successfully to ${recipientEmail}.`,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      simulated: result.simulated,
    });
  } catch (err: any) {
    console.error('[AdminEmailTest] Test error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
