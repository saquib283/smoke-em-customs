import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  WhatsAppCloudApiClient,
  normalizeWhatsAppPhone,
  buildLeadWelcomeMessage,
  buildQuoteNotificationMessage,
  buildBookingConfirmationMessage,
  buildBookingCancelledMessage,
  getWhatsAppConfig,
  updateWhatsAppConfig,
} from '../src/modules/whatsapp/index.ts';

describe('Meta WhatsApp Cloud API Client & Utilities (Architecture §15 & PRD §14, §15)', () => {
  it('normalizes Indian phone numbers to E.164 without leading plus for Meta Cloud API', () => {
    assert.strictEqual(normalizeWhatsAppPhone('9876543210'), '919876543210');
    assert.strictEqual(normalizeWhatsAppPhone('+91 98765 43210'), '919876543210');
    assert.strictEqual(normalizeWhatsAppPhone('+91-98765-43210'), '919876543210');
    assert.strictEqual(normalizeWhatsAppPhone('919876543210'), '919876543210');
  });

  it('dispatches outbound text messages with simulated message IDs in test mode', async () => {
    const client = new WhatsAppCloudApiClient({
      phoneNumberId: 'test-phone-id',
      accessToken: 'test-token',
      isEnabled: true,
    });

    const result = await client.sendTextMessage(
      '9876543210',
      'Hi Rajesh, your ceramic coating appointment is scheduled for tomorrow at 10 AM.'
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.messageId?.startsWith('wamid.MOCK_'));
    assert.strictEqual(result.simulated, true);
  });

  it('dispatches outbound template messages with simulated message IDs', async () => {
    const client = new WhatsAppCloudApiClient({
      phoneNumberId: 'test-phone-id',
      accessToken: 'test-token',
      isEnabled: true,
    });

    const result = await client.sendTemplateMessage('9876543210', 'lead_welcome_v1', 'en');

    assert.strictEqual(result.success, true);
    assert.ok(result.messageId?.startsWith('wamid.MOCK_TPL_'));
    assert.strictEqual(result.simulated, true);
  });

  it('rejects sending to invalid recipient phone numbers under 10 digits', async () => {
    const client = new WhatsAppCloudApiClient({ isEnabled: true });
    const result = await client.sendTextMessage('12345', 'Hello');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid recipient phone number');
  });

  it('validates Meta webhook HMAC-SHA256 signature and rejects tampering', () => {
    const testSecret = 'meta_app_secret_test_key_12345';
    const client = new WhatsAppCloudApiClient({ appSecret: testSecret });

    const payload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ id: '123', changes: [] }],
    });

    const validHash = crypto.createHmac('sha256', testSecret).update(payload).digest('hex');
    const validHeader = `sha256=${validHash}`;

    // Valid signature passes
    assert.strictEqual(client.verifyWebhookSignature(payload, validHeader), true);

    // Tampered payload fails
    const tamperedPayload = payload + ' ';
    assert.strictEqual(client.verifyWebhookSignature(tamperedPayload, validHeader), false);

    // Wrong signature header fails
    assert.strictEqual(client.verifyWebhookSignature(payload, 'sha256=invalidhex0000000000'), false);
    assert.strictEqual(client.verifyWebhookSignature(payload, null), false);
  });

  it('parses structured Meta webhook JSON payload with messages and status receipts', () => {
    const client = new WhatsAppCloudApiClient();

    const sampleWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919876543210',
                  phone_number_id: 'PHONE_NUMBER_ID',
                },
                contacts: [
                  {
                    profile: { name: 'Karan Mehra' },
                    wa_id: '919876543210',
                  },
                ],
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.HBgLM...1',
                    timestamp: '1729000000',
                    text: { body: 'Can I reschedule my detailing slot to Friday?' },
                    type: 'text',
                  },
                ],
                statuses: [
                  {
                    id: 'wamid.HBgLM...0',
                    status: 'delivered',
                    timestamp: '1728999900',
                    recipient_id: '919876543210',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const parsed = client.parseInboundWebhook(sampleWebhookPayload);

    // Verify parsed message
    assert.strictEqual(parsed.messages.length, 1);
    assert.strictEqual(parsed.messages[0].from, '919876543210');
    assert.strictEqual(parsed.messages[0].name, 'Karan Mehra');
    assert.strictEqual(parsed.messages[0].text, 'Can I reschedule my detailing slot to Friday?');

    // Verify parsed delivery receipt status
    assert.strictEqual(parsed.statuses.length, 1);
    assert.strictEqual(parsed.statuses[0].status, 'delivered');
    assert.strictEqual(parsed.statuses[0].recipientId, '919876543210');
  });

  it('formats professional welcome, quote, and booking WhatsApp messages with branding', () => {
    // 1. Welcome Message
    const welcome = buildLeadWelcomeMessage('Vikram', 'Porsche 911 GT3', 'lead-uuid-123456');
    assert.ok(welcome.includes('Welcome to SMOKE M CUSTOMS'));
    assert.ok(welcome.includes('Porsche 911 GT3'));
    assert.ok(welcome.includes('Ref: #123456'));

    // 2. Formal Quote Notification Message
    const quoteMsg = buildQuoteNotificationMessage(
      'Vikram',
      'SMC-Q-1005',
      118000,
      'https://smokecustoms.com/quotes/quote-123'
    );
    assert.ok(quoteMsg.includes('Formal Quotation Ready'));
    assert.ok(quoteMsg.includes('SMC-Q-1005'));
    assert.ok(quoteMsg.includes('₹1,18,000'));
    assert.ok(quoteMsg.includes('https://smokecustoms.com/quotes/quote-123'));

    // 3. Booking Confirmation Message
    const bookMsg = buildBookingConfirmationMessage(
      'Vikram',
      'Saturday, Oct 24, 2026 at 10:00 AM',
      'Bay 1 (Ceramic Lab)',
      'Porsche 911 GT3'
    );
    assert.ok(bookMsg.includes('Bay Reservation Confirmed'));
    assert.ok(bookMsg.includes('Bay 1 (Ceramic Lab)'));
    assert.ok(bookMsg.includes('Oct 24, 2026'));

    // 4. Cancellation Notice
    const cancelMsg = buildBookingCancelledMessage('Vikram', 'Client requested date change');
    assert.ok(cancelMsg.includes('Appointment Update'));
    assert.ok(cancelMsg.includes('Client requested date change'));
  });

  it('manages dynamic WhatsApp configuration and delivery mode toggles', () => {
    const initialConfig = getWhatsAppConfig();
    assert.strictEqual(typeof initialConfig.isEnabled, 'boolean');
    assert.strictEqual(typeof initialConfig.autoSendLeadWelcome, 'boolean');

    // Update configuration
    const updated = updateWhatsAppConfig({
      autoSendLeadWelcome: false,
      studioBusinessPhone: '+91 99999 88888',
    });

    assert.strictEqual(updated.autoSendLeadWelcome, false);
    assert.strictEqual(updated.studioBusinessPhone, '+91 99999 88888');

    // Restore
    updateWhatsAppConfig({
      autoSendLeadWelcome: true,
      studioBusinessPhone: initialConfig.studioBusinessPhone,
    });
  });

  it('correctly parses interactive and button replies from Meta webhooks', () => {
    const client = new WhatsAppCloudApiClient();

    const buttonWebhook = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ wa_id: '919876543210', profile: { name: 'Aditya Roy' } }],
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.BUTTON_123',
                    timestamp: '1695640000',
                    type: 'button',
                    button: { text: 'Confirm Slot' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const parsed = client.parseInboundWebhook(buttonWebhook);
    assert.strictEqual(parsed.messages.length, 1);
    assert.strictEqual(parsed.messages[0].name, 'Aditya Roy');
    assert.ok(parsed.messages[0].text.includes('Confirm Slot'));
  });
});
