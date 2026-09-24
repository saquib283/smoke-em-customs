/**
 * Quoting Module — Implementation
 * Manages quote generation, pricing, and lifecycle.
 * Architecture §11
 */

import { db } from '@/prisma/db';

export interface QuoteListItem {
  id: string;
  customerName: string;
  leadId: string;
  status: string;
  total: string;
  validUntil: string | null;
  createdAt: string;
}

export interface QuoteDetail extends QuoteListItem {
  customerId: string;
  vehicleId: string | null;
  issuedById: string | null;
  subtotal: string;
  discount: string;
  tax: string;
  notes: string | null;
  terms: string | null;
  items: QuoteItemDetail[];
}

export interface QuoteItemDetail {
  id: string;
  serviceId: string | null;
  packageId: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface CreateQuoteInput {
  leadId: string;
  customerId: string;
  vehicleId?: string;
  issuedById?: string;
  items: CreateQuoteItemInput[];
  discount?: string;
  tax?: string;
  notes?: string;
  terms?: string;
  validUntil?: string;
}

export interface CreateQuoteItemInput {
  serviceId?: string;
  packageId?: string;
  description: string;
  quantity?: number;
  unitPrice: string;
}

export type UpdateQuoteInput = Partial<Omit<CreateQuoteInput, 'leadId' | 'customerId'>>;

export interface ListQuotesOptions {
  status?: string;
  leadId?: string;
  customerId?: string;
  page?: number;
  perPage?: number;
}

export class QuotingService {
  async createQuote(data: CreateQuoteInput): Promise<QuoteDetail> {
    let subtotalNum = 0;
    const itemsData = data.items.map((item) => {
      const qty = item.quantity ?? 1;
      const unit = parseFloat(item.unitPrice) || 0;
      const line = qty * unit;
      subtotalNum += line;
      return {
        serviceId: item.serviceId ?? null,
        packageId: item.packageId ?? null,
        description: item.description,
        quantity: qty,
        unitPrice: String(unit),
        lineTotal: String(line),
      };
    });

    const discountNum = parseFloat(data.discount ?? '0') || 0;
    const taxNum = parseFloat(data.tax ?? '0') || 0;
    const totalNum = Math.max(0, subtotalNum - discountNum + taxNum);

    const quote = await db.orm.public.Quote.create({
      leadId: data.leadId,
      customerId: data.customerId,
      vehicleId: data.vehicleId ?? null,
      issuedById: data.issuedById ?? null,
      subtotal: String(subtotalNum),
      discount: String(discountNum),
      tax: String(taxNum),
      total: String(totalNum),
      validUntil: data.validUntil ?? null,
      notes: data.notes ?? null,
      terms: data.terms ?? null,
      status: 'DRAFT',
    });

    for (const item of itemsData) {
      await db.orm.public.QuoteItem.create({
        quoteId: quote.id,
        serviceId: item.serviceId,
        packageId: item.packageId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      });
    }

    return (await this.getQuote(quote.id))!;
  }

  async getQuote(id: string): Promise<QuoteDetail | null> {
    const q = await db.orm.public.Quote.where({ id }).first();
    if (!q) return null;

    const customer = await db.orm.public.Customer.where({ id: q.customerId }).first();
    const items = await db.orm.public.QuoteItem.where({ quoteId: id }).all();

    return {
      id: q.id,
      leadId: q.leadId,
      customerId: q.customerId,
      customerName: customer?.name ?? 'Unknown',
      vehicleId: q.vehicleId,
      issuedById: q.issuedById,
      status: q.status,
      subtotal: String(q.subtotal),
      discount: String(q.discount),
      tax: String(q.tax),
      total: String(q.total),
      validUntil: q.validUntil,
      notes: q.notes,
      terms: q.terms,
      createdAt: q.createdAt,
      items: items.map((i) => ({
        id: i.id,
        serviceId: i.serviceId,
        packageId: i.packageId,
        description: i.description,
        quantity: i.quantity,
        unitPrice: String(i.unitPrice),
        lineTotal: String(i.lineTotal),
      })),
    };
  }

  async listQuotes(options?: ListQuotesOptions): Promise<QuoteListItem[]> {
    let query = db.orm.public.Quote;

    if (options?.status) {
      query = query.where({ status: options.status as any });
    }
    if (options?.leadId) {
      query = query.where({ leadId: options.leadId });
    }
    if (options?.customerId) {
      query = query.where({ customerId: options.customerId });
    }

    const quotes = await query.orderBy((q) => q.createdAt.desc()).all();

    const result: QuoteListItem[] = [];
    for (const q of quotes) {
      const customer = await db.orm.public.Customer.where({ id: q.customerId }).first();
      result.push({
        id: q.id,
        customerName: customer?.name ?? 'Unknown',
        leadId: q.leadId,
        status: q.status,
        total: String(q.total),
        validUntil: q.validUntil,
        createdAt: q.createdAt,
      });
    }

    return result;
  }

  async updateQuote(id: string, data: UpdateQuoteInput): Promise<QuoteDetail> {
    const existing = await db.orm.public.Quote.where({ id }).first();
    if (!existing) throw new Error(`Quote ${id} not found`);

    if (data.items) {
      await db.orm.public.QuoteItem.where({ quoteId: id }).delete();
      let subtotalNum = 0;
      for (const item of data.items) {
        const qty = item.quantity ?? 1;
        const unit = parseFloat(item.unitPrice) || 0;
        const line = qty * unit;
        subtotalNum += line;

        await db.orm.public.QuoteItem.create({
          quoteId: id,
          serviceId: item.serviceId ?? null,
          packageId: item.packageId ?? null,
          description: item.description,
          quantity: qty,
          unitPrice: String(unit),
          lineTotal: String(line),
        });
      }

      const discountNum = parseFloat(data.discount ?? String(existing.discount)) || 0;
      const taxNum = parseFloat(data.tax ?? String(existing.tax)) || 0;
      const totalNum = Math.max(0, subtotalNum - discountNum + taxNum);

      await db.orm.public.Quote.where({ id }).update({
        subtotal: String(subtotalNum),
        discount: String(discountNum),
        tax: String(taxNum),
        total: String(totalNum),
      });
    }

    const updatePayload: Record<string, any> = {};
    if (data.notes !== undefined) updatePayload['notes'] = data.notes;
    if (data.terms !== undefined) updatePayload['terms'] = data.terms;
    if (data.validUntil !== undefined) updatePayload['validUntil'] = data.validUntil;
    if (Object.keys(updatePayload).length > 0) {
      await db.orm.public.Quote.where({ id }).update(updatePayload);
    }

    return (await this.getQuote(id))!;
  }

  async sendQuote(id: string): Promise<QuoteDetail> {
    const quote = await db.orm.public.Quote.where({ id }).first();
    if (!quote) throw new Error(`Quote ${id} not found`);

    await db.orm.public.Quote.where({ id }).update({ status: 'SENT' });
    // Update linked lead to QUOTE_SENT
    await db.orm.public.Lead.where({ id: quote.leadId }).update({ status: 'QUOTE_SENT' });

    return (await this.getQuote(id))!;
  }

  async acceptQuote(id: string): Promise<QuoteDetail> {
    await db.orm.public.Quote.where({ id }).update({ status: 'ACCEPTED' });
    return (await this.getQuote(id))!;
  }

  async declineQuote(id: string): Promise<QuoteDetail> {
    await db.orm.public.Quote.where({ id }).update({ status: 'DECLINED' });
    return (await this.getQuote(id))!;
  }

  async expireQuote(id: string): Promise<QuoteDetail> {
    await db.orm.public.Quote.where({ id }).update({ status: 'EXPIRED' });
    return (await this.getQuote(id))!;
  }
}

export const quotingService = new QuotingService();
