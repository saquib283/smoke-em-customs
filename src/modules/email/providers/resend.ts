/**
 * Resend Email Provider — Smoke M Customs
 * Connects to Resend's modern REST API.
 * Free tier offers 3,000 emails/month.
 */

import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types.ts';

export class ResendEmailProvider implements EmailProvider {
  name = 'Resend Cloud API';
  type = 'RESEND' as const;
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom = 'Smoke M Customs <concierge@smokecustoms.com>') {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Resend API key is missing' };
    }

    try {
      const from = options.fromEmail
        ? `"${options.fromName || 'Smoke M Customs'}" <${options.fromEmail}>`
        : this.defaultFrom;

      const payload: Record<string, any> = {
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      };

      if (options.attachments && options.attachments.length > 0) {
        payload['attachments'] = options.attachments.map((att) => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        }));
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || `Resend API error: ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data?.id,
        simulated: false,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Resend network communication error',
      };
    }
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key is required' };
    }
    try {
      const res = await fetch('https://api.resend.com/api-keys', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (res.ok) return { success: true };
      return { success: false, error: `Invalid API key (${res.status})` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection verification failed' };
    }
  }
}
