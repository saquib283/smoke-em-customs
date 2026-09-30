/**
 * Quoting Module — Implementation
 * Manages formal quote generation, line items, pricing calculations, and lifecycle.
 * Architecture §11, PRD §12
 */

import { db } from '@/prisma/db';
import { notificationsService } from '@/modules/notifications';

import type {
  QuoteListItem,
  QuoteDetail,
  QuoteItemDetail,
  CreateQuoteInput,
  CreateQuoteItemInput,
  UpdateQuoteInput,
  ListQuotesOptions,
  QuoteStats,
} from './types';
export * from './types';

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
        description: item.description.trim(),
        quantity: qty,
        unitPrice: String(unit),
        lineTotal: String(line),
      };
    });

    const discountNum = parseFloat(data.discount ?? '0') || 0;
    const taxNum = parseFloat(data.tax ?? '0') || 0;
    const totalNum = Math.max(0, subtotalNum - discountNum + taxNum);

    // If vehicleId not supplied, try to inherit from Lead
    let vehicleId = data.vehicleId ?? null;
    if (!vehicleId && data.leadId) {
      const lead = await db.orm.public.Lead.where({ id: data.leadId }).first();
      if (lead?.vehicleId) {
        vehicleId = lead.vehicleId;
      }
    }

    const defaultTerms =
      data.terms ||
      '• 50% advance booking deposit required upon vehicle handover.\n• Remaining balance payable upon job completion and pre-delivery inspection.\n• Warranty valid subject to adherence to prescribed maintenance schedule.';

    const defaultNotes =
      data.notes ||
      'Includes complimentary multi-point paint inspection and interior vacuuming.';

    const quote = await db.orm.public.Quote.create({
      leadId: data.leadId,
      customerId: data.customerId,
      vehicleId: vehicleId ?? null,
      issuedById: data.issuedById ?? null,
      subtotal: String(subtotalNum),
      discount: String(discountNum),
      tax: String(taxNum),
      total: String(totalNum),
      validUntil: data.validUntil ?? null,
      notes: defaultNotes,
      terms: defaultTerms,
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

    try {
      const customer = await db.orm.public.Customer.where({ id: data.customerId }).first();
      await notificationsService.emitEvent({
        type: 'quote.created',
        quoteId: quote.id,
        leadId: quote.leadId,
        customerId: quote.customerId,
        customerName: customer?.name ?? 'Client',
        total: String(quote.total),
      });
    } catch {
      // Non-blocking
    }

    return (await this.getQuote(quote.id))!;
  }

  async getQuote(id: string): Promise<QuoteDetail | null> {
    const q = await db.orm.public.Quote.where({ id }).first();
    if (!q) return null;

    const [customer, vehicle, admin, items, linkedBooking] = await Promise.all([
      db.orm.public.Customer.where({ id: q.customerId }).first(),
      q.vehicleId ? db.orm.public.Vehicle.where({ id: q.vehicleId }).first() : Promise.resolve(null),
      q.issuedById ? db.orm.public.AdminUser.where({ id: q.issuedById }).first() : Promise.resolve(null),
      db.orm.public.QuoteItem.where({ quoteId: id }).all(),
      db.orm.public.Booking.where({ quoteId: id }).first(),
    ]);

    const vehicleText = vehicle
      ? `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` (${vehicle.variant})` : ''}`
      : null;

    return {
      id: q.id,
      leadId: q.leadId,
      customerId: q.customerId,
      customerName: customer?.name ?? 'Unknown Client',
      customerPhone: customer?.phone ?? '',
      customerEmail: customer?.email ?? null,
      vehicleId: q.vehicleId,
      vehicleBrand: vehicle?.brand ?? null,
      vehicleModel: vehicle?.model ?? null,
      vehicleText,
      issuedById: q.issuedById,
      issuedByName: admin?.name ?? null,
      status: q.status,
      subtotal: String(q.subtotal),
      discount: String(q.discount),
      tax: String(q.tax),
      total: String(q.total),
      itemCount: items.length,
      validUntil: q.validUntil,
      notes: q.notes,
      terms: q.terms,
      createdAt: q.createdAt,
      linkedBookingId: linkedBooking?.id ?? null,
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

    if (options?.status && options.status !== 'ALL') {
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
      const [customer, vehicle, items, linkedBooking] = await Promise.all([
        db.orm.public.Customer.where({ id: q.customerId }).first(),
        q.vehicleId ? db.orm.public.Vehicle.where({ id: q.vehicleId }).first() : Promise.resolve(null),
        db.orm.public.QuoteItem.where({ quoteId: q.id }).all(),
        db.orm.public.Booking.where({ quoteId: q.id }).first(),
      ]);

      const vehicleText = vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : null;

      result.push({
        id: q.id,
        customerName: customer?.name ?? 'Unknown Client',
        customerPhone: customer?.phone ?? '',
        vehicleText,
        leadId: q.leadId,
        status: q.status,
        total: String(q.total),
        itemCount: items.length,
        validUntil: q.validUntil,
        createdAt: q.createdAt,
        linkedBookingId: linkedBooking?.id ?? null,
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
          description: item.description.trim(),
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
    } else if (data.discount !== undefined || data.tax !== undefined) {
      const discountNum = parseFloat(data.discount ?? String(existing.discount)) || 0;
      const taxNum = parseFloat(data.tax ?? String(existing.tax)) || 0;
      const subtotalNum = parseFloat(String(existing.subtotal)) || 0;
      const totalNum = Math.max(0, subtotalNum - discountNum + taxNum);

      await db.orm.public.Quote.where({ id }).update({
        discount: String(discountNum),
        tax: String(taxNum),
        total: String(totalNum),
      });
    }

    const updatePayload: Record<string, any> = {};
    if (data.vehicleId !== undefined) updatePayload['vehicleId'] = data.vehicleId;
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

    // Update linked lead to QUOTE_SENT if not already in final/booked stage
    const lead = await db.orm.public.Lead.where({ id: quote.leadId }).first();
    if (lead && lead.status !== 'BOOKED' && lead.status !== 'COMPLETED') {
      await db.orm.public.Lead.where({ id: quote.leadId }).update({ status: 'QUOTE_SENT' });
    }

    try {
      const customer = await db.orm.public.Customer.where({ id: quote.customerId }).first();
      await notificationsService.emitEvent({
        type: 'quote.sent',
        quoteId: id,
        leadId: quote.leadId,
        customerId: quote.customerId,
        customerName: customer?.name ?? 'Client',
        customerPhone: customer?.phone,
        total: String(quote.total),
      });
    } catch {
      // Non-blocking
    }

    return (await this.getQuote(id))!;
  }

  async acceptQuote(id: string): Promise<QuoteDetail> {
    const quote = await db.orm.public.Quote.where({ id }).first();
    if (!quote) throw new Error(`Quote ${id} not found`);

    const oldStatus = quote.status;
    await db.orm.public.Quote.where({ id }).update({ status: 'ACCEPTED' });

    try {
      const customer = await db.orm.public.Customer.where({ id: quote.customerId }).first();
      await notificationsService.emitEvent({
        type: 'quote.status_changed',
        quoteId: id,
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'ACCEPTED',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getQuote(id))!;
  }

  async declineQuote(id: string): Promise<QuoteDetail> {
    const quote = await db.orm.public.Quote.where({ id }).first();
    if (!quote) throw new Error(`Quote ${id} not found`);

    const oldStatus = quote.status;
    await db.orm.public.Quote.where({ id }).update({ status: 'DECLINED' });

    try {
      const customer = await db.orm.public.Customer.where({ id: quote.customerId }).first();
      await notificationsService.emitEvent({
        type: 'quote.status_changed',
        quoteId: id,
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'DECLINED',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getQuote(id))!;
  }

  async expireQuote(id: string): Promise<QuoteDetail> {
    const quote = await db.orm.public.Quote.where({ id }).first();
    if (!quote) throw new Error(`Quote ${id} not found`);

    const oldStatus = quote.status;
    await db.orm.public.Quote.where({ id }).update({ status: 'EXPIRED' });

    try {
      const customer = await db.orm.public.Customer.where({ id: quote.customerId }).first();
      await notificationsService.emitEvent({
        type: 'quote.status_changed',
        quoteId: id,
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'EXPIRED',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getQuote(id))!;
  }

  async revertToDraft(id: string): Promise<QuoteDetail> {
    const quote = await db.orm.public.Quote.where({ id }).first();
    if (!quote) throw new Error(`Quote ${id} not found`);

    await db.orm.public.Quote.where({ id }).update({ status: 'DRAFT' });
    return (await this.getQuote(id))!;
  }

  async deleteQuote(id: string): Promise<boolean> {
    const quote = await db.orm.public.Quote.where({ id }).first();
    if (!quote) return false;
    await db.orm.public.QuoteItem.where({ quoteId: id }).delete();
    await db.orm.public.Quote.where({ id }).delete();
    return true;
  }

  async getQuoteStats(): Promise<QuoteStats> {
    const quotes = await db.orm.public.Quote.all();
    let draftCount = 0;
    let sentCount = 0;
    let acceptedCount = 0;
    let declinedCount = 0;
    let expiredCount = 0;
    let totalQuotedValue = 0;
    let acceptedRevenue = 0;

    for (const q of quotes) {
      const val = parseFloat(String(q.total)) || 0;
      totalQuotedValue += val;

      switch (q.status) {
        case 'DRAFT':
          draftCount++;
          break;
        case 'SENT':
          sentCount++;
          break;
        case 'ACCEPTED':
          acceptedCount++;
          acceptedRevenue += val;
          break;
        case 'DECLINED':
          declinedCount++;
          break;
        case 'EXPIRED':
          expiredCount++;
          break;
      }
    }

    return {
      totalCount: quotes.length,
      draftCount,
      sentCount,
      acceptedCount,
      declinedCount,
      expiredCount,
      totalQuotedValue,
      acceptedRevenue,
    };
  }
}

export const quotingService = new QuotingService();
export { buildQuotePDF, downloadQuotePDF } from './pdfGenerator';
