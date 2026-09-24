import { NextRequest, NextResponse } from 'next/server';
import { quotingService } from '@/modules/quoting';
import { db } from '@/prisma/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const quote = await quotingService.getQuote(id);
      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }

      // Also get customer details for WhatsApp pre-fill
      const customer = await db.orm.public.Customer.where({ id: quote.customerId }).first();
      return NextResponse.json({
        success: true,
        quote: {
          ...quote,
          customerPhone: customer?.phone || '',
          customerEmail: customer?.email || '',
        },
      });
    }

    const status = searchParams.get('status') || undefined;
    const quotes = await quotingService.listQuotes({ status });
    return NextResponse.json({ success: true, quotes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, quoteId, quoteData } = body;

    if (action === 'CREATE') {
      if (!quoteData || !quoteData.leadId || !quoteData.customerId || !quoteData.items?.length) {
        return NextResponse.json({ error: 'Missing required quote fields or items' }, { status: 400 });
      }
      const quote = await quotingService.createQuote(quoteData);
      await logAudit({
        action: 'QUOTE_CREATED',
        entityType: 'QUOTE',
        entityId: quote.id,
        after: { total: quote.total, leadId: quote.leadId },
      });
      return NextResponse.json({ success: true, quote });
    }

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 });
    }

    if (action === 'SEND') {
      const updated = await quotingService.sendQuote(quoteId);
      await logAudit({
        action: 'QUOTE_SENT',
        entityType: 'QUOTE',
        entityId: quoteId,
        after: { status: 'SENT' },
      });
      return NextResponse.json({ success: true, quote: updated });
    }

    if (action === 'ACCEPT') {
      const updated = await quotingService.acceptQuote(quoteId);
      await logAudit({
        action: 'QUOTE_ACCEPTED',
        entityType: 'QUOTE',
        entityId: quoteId,
        after: { status: 'ACCEPTED' },
      });
      return NextResponse.json({ success: true, quote: updated });
    }

    if (action === 'DECLINE') {
      const updated = await quotingService.declineQuote(quoteId);
      await logAudit({
        action: 'QUOTE_DECLINED',
        entityType: 'QUOTE',
        entityId: quoteId,
        after: { status: 'DECLINED' },
      });
      return NextResponse.json({ success: true, quote: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in admin quotes API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
