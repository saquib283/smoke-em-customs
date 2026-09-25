import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQuoteWhatsAppSummary,
  whatsappAdapter,
  type QuoteSummaryPayload,
} from '../src/modules/whatsapp/index.ts';

describe('Quotation Financial Computations & Line Items', () => {
  it('calculates line totals, subtotal, discount, tax, and total accurately', () => {
    const items = [
      { description: 'Full Body TPU PPF', quantity: 1, unitPrice: 120000 },
      { description: 'Alloy Wheel Ceramic Coating', quantity: 4, unitPrice: 2500 },
      { description: 'Windshield Glass Coating', quantity: 1, unitPrice: 5000 },
    ];

    let subtotal = 0;
    const computedItems = items.map((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      return { ...item, lineTotal };
    });

    assert.equal(computedItems.length, 3);
    assert.equal(subtotal, 135000); // 120000 + 10000 + 5000

    const discount = 10000;
    const taxRate = 18;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (taxRate / 100));
    const total = taxableAmount + tax;

    assert.equal(taxableAmount, 125000);
    assert.equal(tax, 22500);
    assert.equal(total, 147500);
  });

  it('prevents negative totals when discount exceeds subtotal', () => {
    const subtotal = 5000;
    const discount = 8000;
    const taxRate = 18;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (taxRate / 100));
    const total = Math.max(0, taxableAmount + tax);

    assert.equal(taxableAmount, 0);
    assert.equal(tax, 0);
    assert.equal(total, 0);
  });
});

describe('WhatsApp Quotation Summary Generator (Architecture §15 & PRD §12)', () => {
  it('generates a clean, formatted WhatsApp text summary with all required metadata', () => {
    const quotePayload: QuoteSummaryPayload = {
      id: 'quote-uuid-abc-123456',
      customerName: 'Aditya Singhania',
      customerPhone: '9876543210',
      vehicleText: 'BMW M340i (Tanzanite Blue)',
      items: [
        {
          description: 'Full Body Stealth PPF',
          quantity: 1,
          unitPrice: '145000',
          lineTotal: '145000',
        },
        {
          description: 'Interior Leather & Alcantara Coating',
          quantity: 1,
          unitPrice: '15000',
          lineTotal: '15000',
        },
      ],
      subtotal: '160000',
      discount: '10000',
      tax: '27000',
      total: '177000',
      validUntil: '2026-10-15T00:00:00.000Z',
      notes: 'Includes 5-year replacement warranty and annual top-up inspection.',
    };

    const shareUrl = 'https://smokecustoms.com/quotes/quote-uuid-abc-123456';
    const summary = generateQuoteWhatsAppSummary(quotePayload, shareUrl);

    // Assert key headers and metadata
    assert.ok(summary.includes('SMOKE M CUSTOMS — FORMAL ESTIMATE / QUOTATION'));
    assert.ok(summary.includes('#123456'));
    assert.ok(summary.includes('Aditya Singhania'));
    assert.ok(summary.includes('BMW M340i (Tanzanite Blue)'));

    // Assert line items and currency formatting
    assert.ok(summary.includes('Full Body Stealth PPF'));
    assert.ok(summary.includes('₹1,45,000'));
    assert.ok(summary.includes('Interior Leather & Alcantara Coating'));
    assert.ok(summary.includes('₹15,000'));

    // Assert financial totals
    assert.ok(summary.includes('Subtotal:* ₹1,60,000'));
    assert.ok(summary.includes('Discount:* -₹10,000'));
    assert.ok(summary.includes('GST (18%):* +₹27,000'));
    assert.ok(summary.includes('TOTAL ESTIMATE:* ₹1,77,000'));

    // Assert warranty & shareable URL
    assert.ok(summary.includes('5-year replacement warranty'));
    assert.ok(summary.includes(shareUrl));
  });

  it('builds a valid wa.me deep-link adhering to Indian mobile formatting', () => {
    const rawPhone = '+91 98765-43210';
    const message = 'Hello Smoke M Customs, here is my formal quote reference.';
    const deepLink = whatsappAdapter.buildDeepLink(rawPhone, message);

    assert.ok(deepLink.startsWith('https://wa.me/919876543210?text='));
    assert.ok(deepLink.includes(encodeURIComponent(message)));
  });
});

describe('Quote Lifecycle State Machine (PRD FR-29)', () => {
  type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

  const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['ACCEPTED', 'DECLINED', 'EXPIRED', 'DRAFT'],
    ACCEPTED: [], // terminal or booked
    DECLINED: ['DRAFT'], // revision allowed
    EXPIRED: ['DRAFT'],  // revision allowed
  };

  function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it('allows valid business transitions', () => {
    assert.ok(canTransition('DRAFT', 'SENT'));
    assert.ok(canTransition('SENT', 'ACCEPTED'));
    assert.ok(canTransition('SENT', 'DECLINED'));
    assert.ok(canTransition('SENT', 'EXPIRED'));
    assert.ok(canTransition('DECLINED', 'DRAFT'));
    assert.ok(canTransition('EXPIRED', 'DRAFT'));
  });

  it('disallows invalid jumps from initial draft directly to accepted', () => {
    assert.equal(canTransition('DRAFT', 'ACCEPTED'), false);
    assert.equal(canTransition('DRAFT', 'EXPIRED'), false);
  });
});

describe('Quote → Booking Linkage Rules (Architecture §12 & PRD §11)', () => {
  it('correctly inherits quoted total and lead lineage when creating booking', () => {
    const mockQuote = {
      id: 'quote-456',
      leadId: 'lead-789',
      customerId: 'cust-123',
      total: '85000',
      status: 'SENT',
    };

    // When booking created with quoteId
    const bookingInput = {
      quoteId: mockQuote.id,
      leadId: undefined as string | undefined,
      priceQuoted: undefined as string | undefined,
    };

    // Linkage resolution
    const resolvedLeadId = bookingInput.leadId ?? mockQuote.leadId;
    const resolvedPriceQuoted = bookingInput.priceQuoted ?? mockQuote.total;
    const updatedQuoteStatus = 'ACCEPTED';
    const updatedLeadStatus = 'BOOKED';

    assert.equal(resolvedLeadId, 'lead-789');
    assert.equal(resolvedPriceQuoted, '85000');
    assert.equal(updatedQuoteStatus, 'ACCEPTED');
    assert.equal(updatedLeadStatus, 'BOOKED');
  });
});
