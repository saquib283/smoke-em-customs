/**
 * Booking Module — Implementation
 * Manages availability, slot management, and booking lifecycle.
 * Architecture §10
 */

import { db } from '@/prisma/db';
import { notificationsService } from '@/modules/notifications';

export interface TimeSlot {
  startAt: string;
  endAt: string;
  resourceId: string;
  resourceName: string;
  isAvailable: boolean;
}

export interface BookingListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleText: string | null;
  serviceName: string | null;
  packageName: string | null;
  resourceName: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  source: string;
  createdAt: string;
}

export interface BookingDetail extends BookingListItem {
  customerId: string;
  vehicleId: string | null;
  leadId: string | null;
  quoteId: string | null;
  resourceId: string;
  serviceId: string | null;
  packageId: string | null;
  priceQuoted: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
}

export interface CreateBookingInput {
  customerId: string;
  vehicleId?: string;
  leadId?: string;
  quoteId?: string;
  serviceId?: string;
  packageId?: string;
  resourceId: string;
  startAt: string;
  durationMinutes: number;
  source: 'public_web' | 'admin';
  priceQuoted?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export interface ListBookingsOptions {
  customerId?: string;
  status?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface BusinessHoursEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ResourceDetail {
  id: string;
  name: string;
  isActive: boolean;
}

export class BookingService {
  // ── Availability Engine ──

  async getAvailableSlots(dateStr: string, serviceOrPackageId?: string): Promise<TimeSlot[]> {
    // 1. Check if date is blocked
    const isBlocked = await db.orm.public.BlockedDate.where({ date: dateStr }).first();
    if (isBlocked) {
      return [];
    }

    // 2. Determine duration and buffer
    let durationMinutes = 120; // fallback 2 hours
    let bufferMinutes = 15; // default buffer per Architecture §10.2

    if (serviceOrPackageId) {
      let service = await db.orm.public.Service.where({ id: serviceOrPackageId }).first();
      if (!service) {
        service = await db.orm.public.Service.where({ slug: serviceOrPackageId }).first();
      }

      if (service) {
        durationMinutes = service.durationMinutes;
        if (service.bufferMinutesOverride !== null && service.bufferMinutesOverride !== undefined) {
          bufferMinutes = service.bufferMinutesOverride;
        }
      } else {
        let pkg = await db.orm.public.Package.where({ id: serviceOrPackageId }).first();
        if (!pkg) {
          pkg = await db.orm.public.Package.where({ slug: serviceOrPackageId }).first();
        }
        if (pkg) {
          durationMinutes = pkg.durationMinutes;
        }
      }
    }

    const totalOccupancyMinutes = durationMinutes + bufferMinutes;

    // 3. Get business hours for this day of week (dateStr: YYYY-MM-DD)
    const targetDate = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon ...

    const hours = await db.orm.public.BusinessHours.where({ dayOfWeek }).first();
    if (!hours) {
      // Closed on this day
      return [];
    }

    // Parse business hours e.g. "10:00" and "19:00"
    const [startH, startM] = hours.startTime.split(':').map(Number);
    const [endH, endM] = hours.endTime.split(':').map(Number);

    const openTimeMinutes = startH * 60 + startM;
    const closeTimeMinutes = endH * 60 + endM;

    // 4. Get active resources (bays)
    const resources = await db.orm.public.Resource.where({ isActive: true }).all();
    if (resources.length === 0) return [];

    // 5. Fetch existing bookings for this day
    const dayStartIso = `${dateStr}T00:00:00.000Z`;
    const dayEndIso = `${dateStr}T23:59:59.999Z`;

    const existingBookings = await db.orm.public.Booking
      .where((b) => b.startAt.gte(dayStartIso))
      .where((b) => b.startAt.lte(dayEndIso))
      .all();

    const activeBookings = existingBookings.filter((b) => b.status !== 'CANCELLED');

    // 6. Fetch blocked ranges for this day
    const blockedRanges = await db.orm.public.BlockedTimeRange
      .where((r) => r.startAt.lte(dayEndIso))
      .where((r) => r.endAt.gte(dayStartIso))
      .all();

    // 7. Generate candidate slots with 30-minute granularity step (Architecture §10.2)
    const slots: TimeSlot[] = [];
    const now = new Date();
    const minLeadTimeMs = 2 * 60 * 60 * 1000; // 2 hours minimum lead time (BR-7)
    const SLOT_GRANULARITY_MINUTES = 30;

    for (let minute = openTimeMinutes; minute + durationMinutes <= closeTimeMinutes; minute += SLOT_GRANULARITY_MINUTES) {
      const slotHour = Math.floor(minute / 60);
      const slotMin = minute % 60;
      const slotStartIso = `${dateStr}T${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}:00.000Z`;
      
      const endMinute = minute + durationMinutes;
      const endHour = Math.floor(endMinute / 60);
      const endMin = endMinute % 60;
      const slotEndIso = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00.000Z`;

      const occupancyEndMinute = minute + totalOccupancyMinutes;
      const occEndHour = Math.floor(occupancyEndMinute / 60);
      const occEndMin = occupancyEndMinute % 60;
      const occupancyEndIso = `${dateStr}T${String(occEndHour).padStart(2, '0')}:${String(occEndMin).padStart(2, '0')}:00.000Z`;

      // Check lead time (FR-22: Min lead-time enforcement of 2h)
      const slotStartTime = new Date(slotStartIso).getTime();
      if (slotStartTime < now.getTime() + minLeadTimeMs) {
        continue;
      }

      // Check resource availability
      for (const res of resources) {
        const hasBookingConflict = activeBookings.some((b) => {
          if (b.resourceId !== res.id) return false;
          // Overlaps if (b.startAt < occupancyEndIso && b.endAt > slotStartIso)
          return b.startAt < occupancyEndIso && b.endAt > slotStartIso;
        });

        const hasBlockedConflict = blockedRanges.some((r) => {
          if (r.resourceId && r.resourceId !== res.id) return false;
          return r.startAt < occupancyEndIso && r.endAt > slotStartIso;
        });

        if (!hasBookingConflict && !hasBlockedConflict) {
          slots.push({
            startAt: slotStartIso,
            endAt: slotEndIso,
            resourceId: res.id,
            resourceName: res.name,
            isAvailable: true,
          });
          // Found an available resource for this time, move to next slot time
          break;
        }
      }
    }

    return slots;
  }

  async isSlotAvailable(resourceId: string, startAt: string, endAt: string, excludeBookingId?: string): Promise<boolean> {
    const conflicts = await db.orm.public.Booking
      .where({ resourceId })
      .where((b) => b.startAt.lt(endAt))
      .where((b) => b.endAt.gt(startAt))
      .all();

    const activeConflicts = conflicts.filter(
      (b) => b.status !== 'CANCELLED' && (!excludeBookingId || b.id !== excludeBookingId)
    );
    if (activeConflicts.length > 0) return false;

    const blocked = await db.orm.public.BlockedTimeRange
      .where((r) => r.startAt.lt(endAt))
      .where((r) => r.endAt.gt(startAt))
      .all();

    const resBlocked = blocked.filter((r) => !r.resourceId || r.resourceId === resourceId);
    return resBlocked.length === 0;
  }

  // ── Booking CRUD ──

  async createBooking(data: CreateBookingInput): Promise<BookingDetail> {
    const startDate = new Date(data.startAt);
    const endDate = new Date(startDate.getTime() + data.durationMinutes * 60 * 1000);
    const endAt = endDate.toISOString();

    // Tier 1 Re-validation: Check conflict before DB insert (Architecture §10.3)
    const available = await this.isSlotAvailable(data.resourceId, data.startAt, endAt);
    if (!available) {
      const err = new Error('SLOT_NO_LONGER_AVAILABLE');
      (err as any).code = 'SLOT_NO_LONGER_AVAILABLE';
      throw err;
    }

    const defaultStatus = data.source === 'admin' ? 'CONFIRMED' : 'PENDING_CONFIRMATION';

    let priceQuoted = data.priceQuoted ?? null;
    let linkedLeadId = data.leadId ?? null;

    // Quote -> Booking linkage: inherit quoted price and lead if not supplied
    if (data.quoteId) {
      try {
        const linkedQuote = await db.orm.public.Quote.where({ id: data.quoteId }).first();
        if (linkedQuote) {
          if (!priceQuoted) {
            priceQuoted = String(linkedQuote.total);
          }
          if (!linkedLeadId && linkedQuote.leadId) {
            linkedLeadId = linkedQuote.leadId;
          }
        }
      } catch (qErr) {
        console.warn('Note: Could not inspect linked quote:', qErr);
      }
    }

    let bookingId: string;
    try {
      // Tier 2: PostgreSQL EXCLUDE USING gist ("resourceId" WITH =, tstzrange("startAt", "endAt", '[)') WITH &&)
      const booking = await db.orm.public.Booking.create({
        customerId: data.customerId,
        vehicleId: data.vehicleId ?? null,
        leadId: linkedLeadId,
        quoteId: data.quoteId ?? null,
        serviceId: data.serviceId ?? null,
        packageId: data.packageId ?? null,
        resourceId: data.resourceId,
        startAt: data.startAt,
        endAt,
        durationMinutes: data.durationMinutes,
        status: defaultStatus,
        paymentStatus: 'NOT_APPLICABLE',
        priceQuoted,
        source: data.source,
        customerNotes: data.customerNotes ?? null,
        internalNotes: data.internalNotes ?? null,
      });
      bookingId = booking.id;
    } catch (dbErr: any) {
      // Catch PostgreSQL exclusion constraint violation (code 23P01)
      if (
        dbErr.code === '23P01' ||
        dbErr.message?.includes('no_overlapping_bookings') ||
        dbErr.message?.includes('exclusion constraint')
      ) {
        const err = new Error('SLOT_NO_LONGER_AVAILABLE');
        (err as any).code = 'SLOT_NO_LONGER_AVAILABLE';
        throw err;
      }
      throw dbErr;
    }

    // If linked to quote, mark Quote status as ACCEPTED
    if (data.quoteId) {
      try {
        await db.orm.public.Quote.where({ id: data.quoteId }).update({ status: 'ACCEPTED' });
      } catch (quoteErr) {
        console.warn('Note: Could not update linked quote status:', quoteErr);
      }
    }

    // If linked to lead, update lead status to BOOKED (Booking -> Lead lineage)
    if (linkedLeadId) {
      try {
        await db.orm.public.Lead.where({ id: linkedLeadId }).update({ status: 'BOOKED' });
      } catch (leadErr) {
        console.warn('Note: Could not update linked lead status:', leadErr);
      }
    }

    // Dispatch event through notification event bus (Architecture §13)
    try {
      const [customer, res] = await Promise.all([
        db.orm.public.Customer.where({ id: data.customerId }).first(),
        db.orm.public.Resource.where({ id: data.resourceId }).first(),
      ]);
      await notificationsService.emitEvent({
        type: 'booking.created',
        bookingId,
        customerId: data.customerId,
        customerName: customer?.name ?? 'Customer',
        customerPhone: customer?.phone,
        startAt: data.startAt,
        resourceName: res?.name ?? 'Bay 1',
        priceQuoted,
      });
    } catch (evtErr) {
      console.warn('Note: Event emission failed for booking creation:', evtErr);
    }

    return (await this.getBooking(bookingId))!;
  }

  async getBooking(id: string): Promise<BookingDetail | null> {
    const b = await db.orm.public.Booking.where({ id }).first();
    if (!b) return null;

    const customer = await db.orm.public.Customer.where({ id: b.customerId }).first();
    const vehicle = b.vehicleId ? await db.orm.public.Vehicle.where({ id: b.vehicleId }).first() : null;
    const service = b.serviceId ? await db.orm.public.Service.where({ id: b.serviceId }).first() : null;
    const pkg = b.packageId ? await db.orm.public.Package.where({ id: b.packageId }).first() : null;
    const resource = await db.orm.public.Resource.where({ id: b.resourceId }).first();

    return {
      id: b.id,
      customerId: b.customerId,
      customerName: customer?.name ?? 'Unknown',
      customerPhone: customer?.phone ?? '',
      vehicleId: b.vehicleId,
      vehicleText: vehicle ? `${vehicle.brand} ${vehicle.model}` : null,
      leadId: b.leadId,
      quoteId: b.quoteId,
      serviceId: b.serviceId,
      serviceName: service?.name ?? null,
      packageId: b.packageId,
      packageName: pkg?.name ?? null,
      resourceId: b.resourceId,
      resourceName: resource?.name ?? 'Bay 1',
      startAt: b.startAt,
      endAt: b.endAt,
      durationMinutes: b.durationMinutes,
      status: b.status,
      paymentStatus: b.paymentStatus,
      priceQuoted: b.priceQuoted ? String(b.priceQuoted) : null,
      source: b.source,
      customerNotes: b.customerNotes,
      internalNotes: b.internalNotes,
      cancellationReason: b.cancellationReason,
      createdAt: b.createdAt,
    };
  }

  async listBookings(options?: ListBookingsOptions): Promise<BookingListItem[]> {
    let query = db.orm.public.Booking;

    if (options?.customerId) {
      query = query.where({ customerId: options.customerId });
    }
    if (options?.status) {
      query = query.where({ status: options.status as any });
    }
    if (options?.resourceId) {
      query = query.where({ resourceId: options.resourceId });
    }
    if (options?.startDate) {
      query = query.where((b) => b.startAt.gte(options.startDate!));
    }
    if (options?.endDate) {
      query = query.where((b) => b.startAt.lte(options.endDate!));
    }

    const bookings = await query.orderBy((b) => b.startAt.desc()).all();

    const result: BookingListItem[] = [];
    const customerCache = new Map<string, any>();
    const vehicleCache = new Map<string, any>();
    const serviceCache = new Map<string, any>();
    const packageCache = new Map<string, any>();
    const resourceCache = new Map<string, any>();

    for (const b of bookings) {
      if (!customerCache.has(b.customerId)) {
        customerCache.set(b.customerId, await db.orm.public.Customer.where({ id: b.customerId }).first());
      }
      if (b.vehicleId && !vehicleCache.has(b.vehicleId)) {
        vehicleCache.set(b.vehicleId, await db.orm.public.Vehicle.where({ id: b.vehicleId }).first());
      }
      if (b.serviceId && !serviceCache.has(b.serviceId)) {
        serviceCache.set(b.serviceId, await db.orm.public.Service.where({ id: b.serviceId }).first());
      }
      if (b.packageId && !packageCache.has(b.packageId)) {
        packageCache.set(b.packageId, await db.orm.public.Package.where({ id: b.packageId }).first());
      }
      if (!resourceCache.has(b.resourceId)) {
        resourceCache.set(b.resourceId, await db.orm.public.Resource.where({ id: b.resourceId }).first());
      }

      const customer = customerCache.get(b.customerId);
      const vehicle = b.vehicleId ? vehicleCache.get(b.vehicleId) : null;
      const service = b.serviceId ? serviceCache.get(b.serviceId) : null;
      const pkg = b.packageId ? packageCache.get(b.packageId) : null;
      const resource = resourceCache.get(b.resourceId);

      result.push({
        id: b.id,
        customerName: customer?.name ?? 'Unknown',
        customerPhone: customer?.phone ?? '',
        vehicleText: vehicle ? `${vehicle.brand} ${vehicle.model}` : null,
        serviceName: service?.name ?? null,
        packageName: pkg?.name ?? null,
        resourceName: resource?.name ?? 'Bay 1',
        startAt: b.startAt,
        endAt: b.endAt,
        durationMinutes: b.durationMinutes,
        status: b.status,
        paymentStatus: b.paymentStatus,
        source: b.source,
        createdAt: b.createdAt,
      });
    }

    return result;
  }

  async confirmBooking(id: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    const oldStatus = booking?.status ?? 'PENDING_CONFIRMATION';
    await db.orm.public.Booking.where({ id }).update({ status: 'CONFIRMED' });

    try {
      const customer = booking ? await db.orm.public.Customer.where({ id: booking.customerId }).first() : null;
      await notificationsService.emitEvent({
        type: 'booking.status_changed',
        bookingId: id,
        customerId: booking?.customerId ?? '',
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'CONFIRMED',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getBooking(id))!;
  }

  async cancelBooking(id: string, reason?: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    const oldStatus = booking?.status ?? 'CONFIRMED';
    await db.orm.public.Booking.where({ id }).update({
      status: 'CANCELLED',
      cancellationReason: reason ?? 'Cancelled by admin',
    });

    try {
      const customer = booking ? await db.orm.public.Customer.where({ id: booking.customerId }).first() : null;
      await notificationsService.emitEvent({
        type: 'booking.status_changed',
        bookingId: id,
        customerId: booking?.customerId ?? '',
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'CANCELLED',
        reason,
      });
    } catch {
      // Non-blocking
    }

    return (await this.getBooking(id))!;
  }

  async rescheduleBooking(id: string, newStartAt: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    if (!booking) throw new Error(`Booking ${id} not found`);

    const newStart = new Date(newStartAt);
    const newEnd = new Date(newStart.getTime() + booking.durationMinutes * 60 * 1000);
    const newEndAt = newEnd.toISOString();

    const isAvail = await this.isSlotAvailable(booking.resourceId, newStartAt, newEndAt);
    if (!isAvail) {
      throw new Error('New slot is not available');
    }

    await db.orm.public.Booking.where({ id }).update({
      startAt: newStartAt,
      endAt: newEndAt,
      status: 'RESCHEDULED',
    });

    return (await this.getBooking(id))!;
  }

  async completeBooking(id: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    const oldStatus = booking?.status ?? 'IN_PROGRESS';
    await db.orm.public.Booking.where({ id }).update({ status: 'COMPLETED' });

    try {
      const customer = booking ? await db.orm.public.Customer.where({ id: booking.customerId }).first() : null;
      await notificationsService.emitEvent({
        type: 'booking.status_changed',
        bookingId: id,
        customerId: booking?.customerId ?? '',
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'COMPLETED',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getBooking(id))!;
  }

  async startJob(id: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    if (!booking) throw new Error(`Booking ${id} not found`);

    const oldStatus = booking.status;
    await db.orm.public.Booking.where({ id }).update({ status: 'IN_PROGRESS' });

    try {
      const customer = await db.orm.public.Customer.where({ id: booking.customerId }).first();
      await notificationsService.emitEvent({
        type: 'booking.status_changed',
        bookingId: id,
        customerId: booking.customerId,
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'IN_PROGRESS',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getBooking(id))!;
  }

  async markNoShow(id: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    if (!booking) throw new Error(`Booking ${id} not found`);

    const oldStatus = booking.status;
    await db.orm.public.Booking.where({ id }).update({
      status: 'NO_SHOW',
      cancellationReason: 'Customer did not arrive for scheduled appointment',
    });

    try {
      const customer = await db.orm.public.Customer.where({ id: booking.customerId }).first();
      await notificationsService.emitEvent({
        type: 'booking.status_changed',
        bookingId: id,
        customerId: booking.customerId,
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: 'NO_SHOW',
      });
    } catch {
      // Non-blocking
    }

    return (await this.getBooking(id))!;
  }

  async reassignBay(id: string, newResourceId: string): Promise<BookingDetail> {
    const booking = await db.orm.public.Booking.where({ id }).first();
    if (!booking) throw new Error(`Booking ${id} not found`);

    // Verify the new bay is available for the booking's time window
    const isAvail = await this.isSlotAvailable(newResourceId, booking.startAt, booking.endAt, id);
    if (!isAvail) {
      throw new Error('New bay is not available for this time slot');
    }

    const oldResource = await db.orm.public.Resource.where({ id: booking.resourceId }).first();
    await db.orm.public.Booking.where({ id }).update({ resourceId: newResourceId });
    const newResource = await db.orm.public.Resource.where({ id: newResourceId }).first();

    try {
      const customer = await db.orm.public.Customer.where({ id: booking.customerId }).first();
      await notificationsService.emitEvent({
        type: 'booking.status_changed',
        bookingId: id,
        customerId: booking.customerId,
        customerName: customer?.name ?? 'Client',
        fromStatus: `Bay: ${oldResource?.name ?? 'Unknown'}`,
        toStatus: `Bay: ${newResource?.name ?? 'Unknown'}`,
      });
    } catch {
      // Non-blocking
    }

    return (await this.getBooking(id))!;
  }

  // ── Calendar & Resource Helpers ──

  async getResourceBookings(resourceId: string, startDate: string, endDate: string): Promise<BookingListItem[]> {
    return this.listBookings({ resourceId, startDate, endDate });
  }

  async getBusinessHours(): Promise<BusinessHoursEntry[]> {
    const hours = await db.orm.public.BusinessHours.all();
    return hours.map((h) => ({
      id: h.id,
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));
  }

  async getBlockedDates(monthStr: string): Promise<string[]> {
    // monthStr: YYYY-MM
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const lastDateStr = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

    const dates = await db.orm.public.BlockedDate
      .where((d) => d.date.gte(`${monthStr}-01`))
      .where((d) => d.date.lte(lastDateStr))
      .all();

    return dates.map((d) => d.date);
  }

  async blockDate(date: string, reason?: string): Promise<void> {
    await db.orm.public.BlockedDate.create({
      date,
      reason: reason ?? null,
    });
  }

  async unblockDate(date: string): Promise<void> {
    await db.orm.public.BlockedDate.where({ date }).delete();
  }

  async listAllBlockedDates(): Promise<{ id: string; date: string; reason: string | null; createdAt: string }[]> {
    const dates = await db.orm.public.BlockedDate
      .orderBy((d) => d.date.asc())
      .all();

    return dates.map((d) => ({
      id: d.id,
      date: d.date,
      reason: d.reason,
      createdAt: d.createdAt,
    }));
  }

  async updateBusinessHours(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isClosed = false
  ): Promise<BusinessHoursEntry[]> {
    const existing = await db.orm.public.BusinessHours.where({ dayOfWeek }).first();

    if (isClosed) {
      if (existing) {
        await db.orm.public.BusinessHours.where({ id: existing.id }).delete();
      }
    } else {
      if (existing) {
        await db.orm.public.BusinessHours.where({ id: existing.id }).update({
          startTime,
          endTime,
        });
      } else {
        await db.orm.public.BusinessHours.create({
          dayOfWeek,
          startTime,
          endTime,
        });
      }
    }

    return this.getBusinessHours();
  }

  async listResources(): Promise<ResourceDetail[]> {
    const list = await db.orm.public.Resource.all();
    return list.map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.isActive,
    }));
  }

  async createResource(name: string): Promise<ResourceDetail> {
    const r = await db.orm.public.Resource.create({
      name: name.trim(),
      isActive: true,
    });
    return {
      id: r.id,
      name: r.name,
      isActive: r.isActive,
    };
  }
}

export const bookingService = new BookingService();
