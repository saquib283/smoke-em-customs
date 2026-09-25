/**
 * WhatsApp Module — Smoke M Customs
 * Architecture §15
 * Provides clean boundary for deep-links and manual customer messaging.
 */

export interface WhatsAppAdapter {
  buildDeepLink(phone: string, message: string): string;
  sendMessage?(phone: string, template: string, vars: Record<string, string>): Promise<void>;
}

export class DeepLinkWhatsAppAdapter implements WhatsAppAdapter {
  buildDeepLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }
}

export const whatsappAdapter = new DeepLinkWhatsAppAdapter();

export interface QuoteSummaryPayload {
  id: string;
  customerName: string;
  customerPhone?: string;
  vehicleText?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string | number;
    lineTotal: string | number;
  }>;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  total: string | number;
  validUntil?: string | null;
  notes?: string | null;
  terms?: string | null;
}

/**
 * Generates a clean, professional WhatsApp text summary for a formal quote.
 * PRD §12, FR-31
 */
export function generateQuoteWhatsAppSummary(
  quote: QuoteSummaryPayload,
  shareUrl?: string
): string {
  const quoteRef = `#${quote.id.slice(-6).toUpperCase()}`;
  const validUntilFormatted = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '7 days from issue';

  const subtotalNum = Number(quote.subtotal) || 0;
  const discountNum = Number(quote.discount) || 0;
  const taxNum = Number(quote.tax) || 0;
  const totalNum = Number(quote.total) || 0;

  const itemLines = quote.items
    .map((item, idx) => {
      const qty = item.quantity || 1;
      const unit = Number(item.unitPrice) || 0;
      const line = Number(item.lineTotal) || qty * unit;
      return `${idx + 1}. *${item.description.trim()}*\n   Qty: ${qty} × ₹${unit.toLocaleString('en-IN')} = ₹${line.toLocaleString('en-IN')}`;
    })
    .join('\n');

  let message = `*SMOKE M CUSTOMS — FORMAL ESTIMATE / QUOTATION*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*Quote Ref:* ${quoteRef}\n`;
  message += `*Client:* ${quote.customerName}\n`;
  if (quote.vehicleText) {
    message += `*Vehicle:* ${quote.vehicleText}\n`;
  }
  message += `*Validity:* Valid until ${validUntilFormatted}\n\n`;

  message += `*Selected Treatments & Packages:*\n`;
  message += `${itemLines}\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*Subtotal:* ₹${subtotalNum.toLocaleString('en-IN')}\n`;
  if (discountNum > 0) {
    message += `*Discount:* -₹${discountNum.toLocaleString('en-IN')}\n`;
  }
  if (taxNum > 0) {
    message += `*GST (18%):* +₹${taxNum.toLocaleString('en-IN')}\n`;
  }
  message += `*TOTAL ESTIMATE:* ₹${totalNum.toLocaleString('en-IN')}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (quote.notes) {
    message += `*Studio Notes & Warranty:*\n${quote.notes.trim()}\n\n`;
  }

  if (shareUrl) {
    message += `*View & Print Formal Quotation:*\n${shareUrl}\n\n`;
  }

  message += `To lock in your detailing bay or discuss custom options, reply directly to this message or call our studio!`;

  return message;
}

export {
  whatsAppCloudClient,
  WhatsAppCloudApiClient,
  normalizeWhatsAppPhone,
  buildLeadWelcomeMessage,
  buildQuoteNotificationMessage,
  buildBookingConfirmationMessage,
  buildBookingCancelledMessage,
} from './client.ts';
export type {
  WhatsAppSendResult,
  InboundTextMessage,
  InboundStatusUpdate,
  ParsedWhatsAppWebhook,
} from './client.ts';

export {
  getWhatsAppConfig,
  updateWhatsAppConfig,
} from './config.ts';
export type { WhatsAppConfig } from './config.ts';

