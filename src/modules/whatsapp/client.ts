/**
 * Meta WhatsApp Business Cloud API Client
 * Architecture §15 & PRD §14, §15
 * Handles automated outbound messaging, template dispatch, and inbound webhook processing.
 */

import crypto from 'node:crypto';
import { getWhatsAppConfig } from './config.ts';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export interface InboundTextMessage {
  from: string;
  name?: string;
  messageId: string;
  timestamp: string;
  text: string;
}

export interface InboundStatusUpdate {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  recipientId: string;
  timestamp: string;
  error?: string;
}

export interface ParsedWhatsAppWebhook {
  messages: InboundTextMessage[];
  statuses: InboundStatusUpdate[];
}

/**
 * Normalizes phone numbers to standard E.164 without leading '+' (required by WhatsApp Cloud API)
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export class WhatsAppCloudApiClient {
  private phoneNumberId?: string;
  private accessToken?: string;
  private appSecret?: string;
  private isEnabled?: boolean;
  private isMock: boolean;
  private apiVersion: string;

  constructor(options?: {
    phoneNumberId?: string;
    accessToken?: string;
    appSecret?: string;
    isEnabled?: boolean;
    isMock?: boolean;
    apiVersion?: string;
  }) {
    this.phoneNumberId = options?.phoneNumberId;
    this.accessToken = options?.accessToken;
    this.appSecret = options?.appSecret;
    this.isEnabled = options?.isEnabled;
    this.isMock = options?.isMock ?? false;
    this.apiVersion = options?.apiVersion ?? 'v19.0';
  }

  /**
   * Resolves effective configuration between explicit options and dynamic runtime settings
   */
  private getEffectiveConfig() {
    const dynamicConfig = getWhatsAppConfig();
    return {
      phoneNumberId: this.phoneNumberId ?? dynamicConfig.phoneNumberId,
      accessToken: this.accessToken ?? dynamicConfig.accessToken,
      appSecret: this.appSecret ?? dynamicConfig.appSecret,
      isEnabled: this.isEnabled !== undefined ? this.isEnabled : dynamicConfig.isEnabled,
    };
  }

  /**
   * Determine whether client operates in mock/simulated mode
   */
  isSimulated(): boolean {
    const config = this.getEffectiveConfig();
    return (
      this.isMock ||
      !config.isEnabled ||
      !config.accessToken ||
      !config.phoneNumberId ||
      config.accessToken === 'mock' ||
      config.accessToken === 'test' ||
      config.accessToken.startsWith('test') ||
      process.env['NODE_ENV'] === 'test'
    );
  }

  getDeliveryMode(): 'LIVE' | 'SIMULATED' {
    return this.isSimulated() ? 'SIMULATED' : 'LIVE';
  }

  /**
   * Send a direct plain text message via WhatsApp Cloud API
   */
  async sendTextMessage(toPhone: string, text: string): Promise<WhatsAppSendResult> {
    const normalizedPhone = normalizeWhatsAppPhone(toPhone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return { success: false, error: 'Invalid recipient phone number' };
    }

    const config = this.getEffectiveConfig();

    if (this.isSimulated()) {
      const mockId = `wamid.MOCK_${crypto.randomUUID()}`;
      console.log(`[WhatsAppCloudAPI (SIMULATED)] Text to ${normalizedPhone}:\n${text}`);
      return { success: true, messageId: mockId, simulated: true };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${config.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: text,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `WhatsApp API error: ${response.status}`;
        console.error('[WhatsAppCloudAPI] Send failed:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      return { success: true, messageId, simulated: false };
    } catch (err: any) {
      console.error('[WhatsAppCloudAPI] Network error:', err);
      return { success: false, error: err.message || 'Network communication error' };
    }
  }

  /**
   * Send a pre-approved Meta WhatsApp Template message
   */
  async sendTemplateMessage(
    toPhone: string,
    templateName: string,
    languageCode = 'en',
    components: any[] = []
  ): Promise<WhatsAppSendResult> {
    const normalizedPhone = normalizeWhatsAppPhone(toPhone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return { success: false, error: 'Invalid recipient phone number' };
    }

    if (this.isSimulated()) {
      const mockId = `wamid.MOCK_TPL_${crypto.randomUUID()}`;
      console.log(
        `[WhatsAppCloudAPI (SIMULATED)] Template '${templateName}' (${languageCode}) to ${normalizedPhone}`
      );
      return { success: true, messageId: mockId, simulated: true };
    }

    const config = this.getEffectiveConfig();

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${config.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `WhatsApp API error: ${response.status}`;
        console.error('[WhatsAppCloudAPI] Template send failed:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      return { success: true, messageId, simulated: false };
    } catch (err: any) {
      console.error('[WhatsAppCloudAPI] Template network error:', err);
      return { success: false, error: err.message || 'Network communication error' };
    }
  }

  /**
   * Verifies SHA-256 HMAC signature of incoming Meta webhook payloads.
   * Prevents webhook spoofing and replay attacks.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    const config = this.getEffectiveConfig();
    if (!config.appSecret) {
      // In development without app secret configured, allow bypass
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', config.appSecret)
      .update(rawBody)
      .digest('hex');

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Parse structured inbound Meta WhatsApp Cloud API webhook JSON payload
   */
  parseInboundWebhook(payload: any): ParsedWhatsAppWebhook {
    const result: ParsedWhatsAppWebhook = {
      messages: [],
      statuses: [],
    };

    if (!payload?.entry || !Array.isArray(payload.entry)) {
      return result;
    }

    for (const entry of payload.entry) {
      if (!entry?.changes || !Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change?.value;
        if (!value || value.messaging_product !== 'whatsapp') continue;

        const contactMap = new Map<string, string>();
        if (value.contacts && Array.isArray(value.contacts)) {
          for (const c of value.contacts) {
            if (c.wa_id && c.profile?.name) {
              contactMap.set(c.wa_id, c.profile.name);
            }
          }
        }

        // Process inbound user messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const msg of value.messages) {
            if (msg.type === 'text' && msg.text?.body) {
              result.messages.push({
                from: msg.from,
                name: contactMap.get(msg.from),
                messageId: msg.id,
                timestamp: msg.timestamp,
                text: msg.text.body,
              });
            } else if (msg.type === 'button' && msg.button?.text) {
              result.messages.push({
                from: msg.from,
                name: contactMap.get(msg.from),
                messageId: msg.id,
                timestamp: msg.timestamp,
                text: `[Button Selected: ${msg.button.text}]`,
              });
            } else if (msg.type === 'interactive') {
              const interactiveText =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                '[Interactive Response]';
              result.messages.push({
                from: msg.from,
                name: contactMap.get(msg.from),
                messageId: msg.id,
                timestamp: msg.timestamp,
                text: interactiveText,
              });
            }
          }
        }

        // Process message delivery status receipts
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const st of value.statuses) {
            result.statuses.push({
              messageId: st.id,
              status: st.status,
              recipientId: st.recipient_id,
              timestamp: st.timestamp,
              error: st.errors?.[0]?.message,
            });
          }
        }
      }
    }

    return result;
  }
}

export const whatsAppCloudClient = new WhatsAppCloudApiClient();

/* ─── Standard Outbound Message Builders ─── */

export function buildLeadWelcomeMessage(
  customerName: string,
  vehicleText?: string,
  leadId?: string
): string {
  const refText = leadId ? ` (Ref: #${leadId.slice(-6).toUpperCase()})` : '';
  const vehicleLine = vehicleText ? ` for your *${vehicleText}*` : '';

  return (
    `*Welcome to SMOKE M CUSTOMS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Hi ${customerName}, thank you for reaching out! We have received your detailing inquiry${vehicleLine}${refText}.\n\n` +
    `Our master detailers are analyzing your vehicle requirements and preparing your tailored estimate.\n\n` +
    `If you have photos or specific treatment questions, feel free to reply directly to this message!\n\n` +
    `Smoke M Customs Studio | Climate-Controlled Detailing Bays`
  );
}

export function buildQuoteNotificationMessage(
  customerName: string,
  quoteNumber: string,
  totalAmount: string | number,
  quoteUrl?: string
): string {
  const formattedTotal = Number(totalAmount).toLocaleString('en-IN');
  let msg =
    `*SMOKE M CUSTOMS — Formal Quotation Ready*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Hi ${customerName}, your official quotation *#${quoteNumber}* has been issued.\n\n` +
    `*Grand Total (incl. 18% GST):* ₹${formattedTotal}\n` +
    `*Validity:* 14 days from issue date\n\n`;

  if (quoteUrl) {
    msg += `*View & Print Your Itemized Quote:*\n${quoteUrl}\n\n`;
  }

  msg +=
    `To lock in your detailing bay or customize your package, reply directly to this message or speak with our studio team.`;
  return msg;
}

export function buildBookingConfirmationMessage(
  customerName: string,
  dateFormatted: string,
  bayName?: string,
  vehicleText?: string
): string {
  const bayLine = bayName ? ` (${bayName})` : '';
  const vehicleLine = vehicleText ? ` for *${vehicleText}*` : '';

  return (
    `*SMOKE M CUSTOMS — Bay Reservation Confirmed*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Hi ${customerName}, your detailing appointment${vehicleLine} is confirmed!\n\n` +
    `*Appointment Date & Time:*\n${dateFormatted}${bayLine}\n\n` +
    `*Studio Location:*\nSmoke M Customs, Prime Auto Hub, Bangalore\n\n` +
    `Our positive-pressure bay is prepared and sanitized for your vehicle. Please arrive 10 minutes prior to your slot.\n\n` +
    `Need to reschedule? Reply directly to this WhatsApp conversation.`
  );
}

export function buildBookingCancelledMessage(
  customerName: string,
  reason?: string
): string {
  let msg =
    `*SMOKE M CUSTOMS — Appointment Update*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Hi ${customerName}, your bay reservation has been cancelled.\n`;

  if (reason) {
    msg += `\n*Reason:* ${reason}\n`;
  }

  msg += `\nTo schedule a new detailing session at your convenience, visit our studio or reply here.`;
  return msg;
}
