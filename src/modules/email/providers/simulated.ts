/**
 * Simulated Email Provider — Smoke M Customs
 * Zero-configuration local development & test provider.
 * Logs email output to console and returns simulated message IDs.
 */

import crypto from 'node:crypto';
import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types.ts';

export class SimulatedEmailProvider implements EmailProvider {
  name = 'Simulated Email Provider';
  type = 'SIMULATED' as const;

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const messageId = `sim_${crypto.randomUUID()}`;

    console.log(`[EmailProvider: SIMULATED] Dispatching to: ${recipients}`);
    console.log(`[EmailProvider: SIMULATED] Subject: ${options.subject}`);
    console.log(`[EmailProvider: SIMULATED] From: ${options.fromName || 'Smoke M Customs'} <${options.fromEmail || 'concierge@smokecustoms.com'}>`);
    if (options.attachments && options.attachments.length > 0) {
      console.log(`[EmailProvider: SIMULATED] Attachments: ${options.attachments.map((a) => a.filename).join(', ')}`);
    }

    return {
      success: true,
      messageId,
      simulated: true,
      previewUrl: `https://ethereal.email/simulated/${messageId}`,
    };
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}
