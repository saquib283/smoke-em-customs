import { describe, it } from 'node:test';
import assert from 'node:assert';

/* ─── Simulated Quote & Booking Integration Flow ─── */

type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

interface QuoteLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  vehicleId?: string;
  leadId?: string;
  status: QuoteStatus;
  items: QuoteLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  expiresAt: Date;
  bookingId?: string;
}

interface Booking {
  id: string;
  customerId: string;
  vehicleId?: string;
  quoteId?: string;
  resourceId: string;
  startAt: Date;
  priceQuoted: number;
  status: string;
}

class SimulatedQuotationEngine {
  private quotes: Quote[] = [];
  private bookings: Booking[] = [];
  private quoteCounter = 1000;

  createDraftQuote(params: {
    customerId: string;
    vehicleId?: string;
    leadId?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; description?: string }>;
    discountAmount?: number;
    notes?: string;
  }): Quote {
    this.quoteCounter += 1;
    const quoteNumber = `SMC-Q-${this.quoteCounter}`;

    const items: QuoteLineItem[] = params.items.map((it, idx) => ({
      id: `item-${idx + 1}`,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.quantity * it.unitPrice,
    }));

    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const discount = Math.min(params.discountAmount || 0, subtotal);
    const taxable = subtotal - discount;
    const taxAmount = Math.round(taxable * 0.18 * 100) / 100; // 18% GST
    const totalAmount = taxable + taxAmount;

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days validity

    const quote: Quote = {
      id: `quote-${this.quoteCounter}`,
      quoteNumber,
      customerId: params.customerId,
      vehicleId: params.vehicleId,
      leadId: params.leadId,
      status: 'DRAFT',
      items,
      subtotal,
      discountAmount: discount,
      taxAmount,
      totalAmount,
      notes: params.notes,
      expiresAt,
    };

    this.quotes.push(quote);
    return quote;
  }

  sendQuote(quoteId: string): Quote {
    const q = this.quotes.find((x) => x.id === quoteId);
    if (!q) throw new Error('Quote not found');
    if (q.status !== 'DRAFT') {
      throw new Error(`Cannot send quote in ${q.status} status`);
    }
    q.status = 'SENT';
    return q;
  }

  convertQuoteToBooking(quoteId: string, bookingParams: { resourceId: string; startAt: Date }): {
    booking: Booking;
    quote: Quote;
  } {
    const q = this.quotes.find((x) => x.id === quoteId);
    if (!q) throw new Error('Quote not found');
    if (q.status !== 'SENT' && q.status !== 'DRAFT') {
      throw new Error(`Cannot convert quote in status ${q.status}`);
    }

    const bookingId = `book-q-${q.id}`;
    const booking: Booking = {
      id: bookingId,
      customerId: q.customerId,
      vehicleId: q.vehicleId,
      quoteId: q.id,
      resourceId: bookingParams.resourceId,
      startAt: bookingParams.startAt,
      priceQuoted: q.totalAmount,
      status: 'CONFIRMED',
    };

    q.status = 'ACCEPTED';
    q.bookingId = bookingId;
    this.bookings.push(booking);

    return { booking, quote: q };
  }

  formatWhatsAppSummary(quote: Quote, clientName: string, vehicleText: string): string {
    const lines = [
      `*SMOKE M CUSTOMS — Official Quotation*`,
      `Quote #${quote.quoteNumber}`,
      `Client: ${clientName}`,
      `Vehicle: ${vehicleText}`,
      `---`,
      ...quote.items.map((it) => `• ${it.name} (${it.quantity}x) — ₹${it.totalPrice.toLocaleString('en-IN')}`),
      `---`,
      `Subtotal: ₹${quote.subtotal.toLocaleString('en-IN')}`,
      quote.discountAmount > 0 ? `Discount: -₹${quote.discountAmount.toLocaleString('en-IN')}` : null,
      `GST (18%): ₹${quote.taxAmount.toLocaleString('en-IN')}`,
      `*Grand Total: ₹${quote.totalAmount.toLocaleString('en-IN')}*`,
      `---`,
      `Valid for 14 days until ${quote.expiresAt.toLocaleDateString('en-IN')}.`,
    ].filter(Boolean);

    return lines.join('\n');
  }
}

describe('Quote Lifecycle & Booking Conversion Integration (PRD §11, §12 & Architecture §15)', () => {
  it('calculates financial totals with 18% GST and item line totals accurately', () => {
    const engine = new SimulatedQuotationEngine();
    const quote = engine.createDraftQuote({
      customerId: 'cust-10',
      vehicleId: 'veh-5',
      leadId: 'lead-2',
      items: [
        { name: 'Self-Healing TPU PPF (Full Body)', quantity: 1, unitPrice: 85000 },
        { name: 'Graphene Ceramic Topcoat', quantity: 1, unitPrice: 15000 },
        { name: 'Alloy Wheel Ceramic Barrier', quantity: 4, unitPrice: 2000 },
      ],
      discountAmount: 8000,
    });

    // Subtotal: 85000 + 15000 + 8000 = 108,000
    assert.strictEqual(quote.subtotal, 108000);
    // Discount: 8,000 -> Taxable: 100,000
    assert.strictEqual(quote.discountAmount, 8000);
    // GST (18% of 100,000) = 18,000
    assert.strictEqual(quote.taxAmount, 18000);
    // Total = 118,000
    assert.strictEqual(quote.totalAmount, 118000);
    assert.strictEqual(quote.status, 'DRAFT');
  });

  it('manages the quote lifecycle progression from DRAFT to SENT and into an ACCEPTED Booking', () => {
    const engine = new SimulatedQuotationEngine();
    const quote = engine.createDraftQuote({
      customerId: 'cust-10',
      vehicleId: 'veh-5',
      items: [{ name: 'Paint Correction & Ceramic Shield', quantity: 1, unitPrice: 42000 }],
    });

    // 1. Transition to SENT
    const sentQuote = engine.sendQuote(quote.id);
    assert.strictEqual(sentQuote.status, 'SENT');

    // 2. Client confirms -> converts to Booking
    const conversion = engine.convertQuoteToBooking(sentQuote.id, {
      resourceId: 'bay-1',
      startAt: new Date('2026-10-25T11:00:00Z'),
    });

    assert.strictEqual(conversion.quote.status, 'ACCEPTED');
    assert.strictEqual(conversion.quote.bookingId, conversion.booking.id);
    assert.strictEqual(conversion.booking.quoteId, sentQuote.id);
    assert.strictEqual(conversion.booking.priceQuoted, sentQuote.totalAmount);
    assert.strictEqual(conversion.booking.customerId, sentQuote.customerId);
    assert.strictEqual(conversion.booking.vehicleId, sentQuote.vehicleId);
  });

  it('formats comprehensive WhatsApp quotation summaries with line item breakdowns', () => {
    const engine = new SimulatedQuotationEngine();
    const quote = engine.createDraftQuote({
      customerId: 'cust-10',
      vehicleId: 'veh-5',
      items: [{ name: 'Front Bumper & Hood PPF', quantity: 1, unitPrice: 35000 }],
      discountAmount: 0,
    });

    const summary = engine.formatWhatsAppSummary(quote, 'Rajesh Khanna', 'Mercedes-Benz E-Class');
    assert.ok(summary.includes('SMOKE M CUSTOMS — Official Quotation'));
    assert.ok(summary.includes('Quote #SMC-Q-'));
    assert.ok(summary.includes('Client: Rajesh Khanna'));
    assert.ok(summary.includes('Vehicle: Mercedes-Benz E-Class'));
    assert.ok(summary.includes('Front Bumper & Hood PPF'));
    assert.ok(summary.includes('Grand Total: ₹41,300')); // 35000 + 18% GST (6300) = 41300
  });
});
