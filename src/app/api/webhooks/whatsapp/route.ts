import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import { env } from '@/lib/env';
import {
  whatsAppCloudClient,
  normalizeWhatsAppPhone,
} from '@/modules/whatsapp';
import { crmService } from '@/modules/crm';

/**
 * GET /api/webhooks/whatsapp
 * Meta Webhook verification handshake.
 * Verifies hub.verify_token and returns hub.challenge.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsAppWebhook] Verification challenge succeeded.');
    return new Response(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[WhatsAppWebhook] Verification token mismatch or invalid mode.');
  return new Response('Forbidden', { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Meta Inbound Webhook event receiver.
 * Handles incoming WhatsApp customer messages and delivery status updates.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Verify cryptographic HMAC signature
    const isValidSignature = whatsAppCloudClient.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn('[WhatsAppWebhook] Invalid payload HMAC signature rejected.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // 2. Parse structured events using WhatsApp Cloud Client
    const parsed = whatsAppCloudClient.parseInboundWebhook(payload);

    // 3. Process Inbound Messages from Customers
    for (const msg of parsed.messages) {
      const normalizedPhone = normalizeWhatsAppPhone(msg.from);

      // Match or find customer by phone
      let customer = await crmService.getCustomerByPhone(normalizedPhone);

      if (!customer) {
        // Find by 10-digit suffix fallback
        const tenDigits = normalizedPhone.slice(-10);
        customer = await crmService.getCustomerByPhone(tenDigits);
      }

      if (!customer) {
        // Auto-create new customer and intake lead from WhatsApp inquiry
        const customerName = msg.name?.trim() || `WhatsApp Client (+${normalizedPhone})`;
        const createdCustomer = await crmService.findOrCreateCustomer({
          name: customerName,
          phone: normalizedPhone,
          preferredContactMethod: 'WHATSAPP',
        });
        customer = await crmService.getCustomer(createdCustomer.id);

        if (customer) {
          // Create initial inbound lead
          await crmService.createLead({
            customerName: customer.name,
            customerPhone: customer.phone,
            source: 'whatsapp_inbound',
            additionalNotes: msg.text,
          });
        }
      }

      if (customer) {
        // Record inbound interaction in CRM Communication timeline
        await db.orm.public.Communication.create({
          customerId: customer.id,
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          summary: msg.text,
        });

        // Trigger real-time alert in Admin Notification Feed
        await db.orm.public.Notification.create({
          type: 'NEW_LEAD',
          title: `WhatsApp from ${customer.name}`,
          body: msg.text.length > 120 ? `${msg.text.slice(0, 117)}...` : msg.text,
          entityType: 'customer',
          entityId: customer.id,
          isRead: false,
        });
      }
    }

    // 4. Process Message Delivery Receipts
    for (const st of parsed.statuses) {
      console.log(`[WhatsAppWebhook] Status update: Msg ${st.messageId} -> ${st.status}`);
    }

    return NextResponse.json({
      status: 'ok',
      processed: {
        messages: parsed.messages.length,
        statuses: parsed.statuses.length,
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppWebhook] Webhook processing error:', err);
    // Always return HTTP 200 to prevent Meta from spamming retries for unrecoverable errors
    return NextResponse.json({ status: 'error', error: err.message }, { status: 200 });
  }
}
