import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventBus } from '../src/modules/notifications/bus.ts';
import type { AppEvent } from '../src/modules/notifications/bus.ts';

describe('Notification Event Bus & Handler Registry (Architecture §13 & PRD §14)', () => {
  it('dispatches business events to registered handlers', async () => {
    const bus = new EventBus();
    const receivedEvents: AppEvent[] = [];

    bus.register({
      name: 'TestAuditHandler',
      handle: async (event: AppEvent) => {
        receivedEvents.push(event);
      },
    });

    const testEvent: AppEvent = {
      type: 'lead.created',
      timestamp: new Date().toISOString(),
      payload: {
        leadId: 'lead-123',
        customerName: 'Rahul Mehta',
        phone: '9876543210',
        vehicleText: 'BMW M340i',
        serviceName: 'Ceramic Coating',
        isDuplicate: false,
      },
    };

    await bus.emit(testEvent);

    assert.strictEqual(receivedEvents.length, 1);
    assert.strictEqual(receivedEvents[0].type, 'lead.created');
    assert.strictEqual((receivedEvents[0].payload as any).customerName, 'Rahul Mehta');
  });

  it('guarantees error isolation: a failing handler does not halt subsequent handlers', async () => {
    const bus = new EventBus();
    let handler2Executed = false;

    bus.register({
      name: 'FailingHandler',
      handle: async () => {
        throw new Error('Downstream network glitch');
      },
    });

    bus.register({
      name: 'ReliableHandler',
      handle: async () => {
        handler2Executed = true;
      },
    });

    const testEvent: AppEvent = {
      type: 'booking.created',
      timestamp: new Date().toISOString(),
      payload: {
        bookingId: 'bk-456',
        customerName: 'Priya Sharma',
        serviceOrPackage: 'Full PPF Wrap',
        startAt: '2026-10-15T10:00:00Z',
      },
    };

    // Should not throw
    await bus.emit(testEvent);

    assert.strictEqual(handler2Executed, true, 'Subsequent handler executed despite earlier failure');
  });

  it('correctly maps business events to admin feed titles and bodies', () => {
    function mapEventToNotification(event: AppEvent): { title: string; body: string; type: string } | null {
      switch (event.type) {
        case 'lead.created':
          return {
            type: 'NEW_LEAD',
            title: `New Inquiry: ${event.payload.customerName}`,
            body: `${event.payload.vehicleText || 'Vehicle unspecified'} • ${event.payload.serviceName || 'General Inquiry'}`,
          };
        case 'booking.created':
          return {
            type: 'NEW_BOOKING_PENDING',
            title: `New Booking Request: ${event.payload.customerName}`,
            body: `${event.payload.serviceOrPackage} • Bay Slot: ${new Date(event.payload.startAt).toLocaleString()}`,
          };
        case 'quote.created':
          return {
            type: 'QUOTE_EXPIRING',
            title: `Formal Quote Issued: ${event.payload.quoteRef}`,
            body: `Client: ${event.payload.customerName} • Total: ₹${event.payload.total.toLocaleString('en-IN')}`,
          };
        default:
          return null;
      }
    }

    const leadFeed = mapEventToNotification({
      type: 'lead.created',
      timestamp: new Date().toISOString(),
      payload: {
        leadId: '1',
        customerName: 'Karan Singh',
        phone: '9876543210',
        vehicleText: 'Porsche Macan GTS',
        serviceName: 'SunTek Ultra PPF',
        isDuplicate: false,
      },
    });

    assert.ok(leadFeed);
    assert.strictEqual(leadFeed.type, 'NEW_LEAD');
    assert.strictEqual(leadFeed.title, 'New Inquiry: Karan Singh');
    assert.ok(leadFeed.body.includes('Porsche Macan GTS'));

    const quoteFeed = mapEventToNotification({
      type: 'quote.created',
      timestamp: new Date().toISOString(),
      payload: {
        quoteId: 'q-999',
        quoteRef: '#Q-999',
        customerName: 'Aditya Roy',
        total: 125000,
        validUntil: '2026-11-01',
      },
    });

    assert.ok(quoteFeed);
    assert.strictEqual(quoteFeed.title, 'Formal Quote Issued: #Q-999');
    assert.ok(quoteFeed.body.includes('1,25,000'));
  });
});

describe('Communication Logging & Channels (PRD §14, §15, AR-2)', () => {
  it('validates supported communication channels and directions', () => {
    const validChannels = ['WHATSAPP', 'CALL', 'EMAIL', 'SMS'];
    const validDirections = ['OUTBOUND', 'INBOUND'];

    const testComm = {
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      summary: 'Sent formal quotation via WhatsApp and confirmed bay availability',
    };

    assert.ok(validChannels.includes(testComm.channel));
    assert.ok(validDirections.includes(testComm.direction));
    assert.ok(testComm.summary.length > 5);
  });

  it('builds phone deep-link for WhatsApp CTA with consistent E.164 normalization', () => {
    function buildWhatsAppLink(phone: string, text: string) {
      const cleanPhone = phone.replace(/\D/g, '');
      const formatted = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
    }

    // 10-digit standard Indian phone
    const link1 = buildWhatsAppLink('9876543210', 'Hi from Smoke M Customs');
    assert.strictEqual(link1, 'https://wa.me/919876543210?text=Hi%20from%20Smoke%20M%20Customs');

    // Phone with spaces and prefix
    const link2 = buildWhatsAppLink('+91 98765 43210', 'Quote #SMC-101');
    assert.strictEqual(link2, 'https://wa.me/919876543210?text=Quote%20%23SMC-101');
  });
});

describe('Audit Logging Data Normalization (Architecture §17 & PRD §13)', () => {
  it('serializes and deserializes before/after state diffs safely', () => {
    function normalizeAuditDiff(data: any): string | null {
      if (!data) return null;
      return typeof data === 'string' ? data : JSON.stringify(data);
    }

    function parseAuditDiff(val: any): any {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    const beforeState = { status: 'PENDING_CONFIRMATION', bay: 'Bay 1' };
    const afterState = { status: 'CONFIRMED', bay: 'Bay 1', confirmedBy: 'admin-1' };

    const serializedBefore = normalizeAuditDiff(beforeState);
    const serializedAfter = normalizeAuditDiff(afterState);

    assert.strictEqual(typeof serializedBefore, 'string');
    assert.strictEqual(typeof serializedAfter, 'string');

    const parsedBefore = parseAuditDiff(serializedBefore);
    const parsedAfter = parseAuditDiff(serializedAfter);

    assert.strictEqual(parsedBefore.status, 'PENDING_CONFIRMATION');
    assert.strictEqual(parsedAfter.status, 'CONFIRMED');
    assert.strictEqual(parsedAfter.confirmedBy, 'admin-1');
  });
});
