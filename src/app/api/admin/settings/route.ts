import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';
import { db } from '@/prisma/db';
import { getBookingRules, updateBookingRules } from '@/lib/studio-config';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const [resources, hours, blockedDates] = await Promise.all([
      bookingService.listResources(),
      bookingService.getBusinessHours(),
      bookingService.listAllBlockedDates(),
    ]);

    const bookingRules = getBookingRules();

    return NextResponse.json({
      success: true,
      resources,
      hours,
      blockedDates,
      bookingRules,
    });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── 1. Bay Management ──
    if (action === 'CREATE_BAY') {
      const { name } = body;
      if (!name) {
        return NextResponse.json({ error: 'Bay name is required' }, { status: 400 });
      }
      const created = await bookingService.createResource(name);
      await logAudit({
        action: 'BAY_CREATED',
        entityType: 'RESOURCE',
        entityId: created.id,
        after: { name: created.name },
      });
      return NextResponse.json({ success: true, resource: created });
    }

    if (action === 'TOGGLE_BAY') {
      const { resourceId, isActive } = body;
      if (!resourceId) {
        return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
      }
      await db.orm.public.Resource.where({ id: resourceId }).update({ isActive: !isActive });
      await logAudit({
        action: 'BAY_STATUS_TOGGLED',
        entityType: 'RESOURCE',
        entityId: resourceId,
        after: { isActive: !isActive },
      });
      const updated = await bookingService.listResources();
      return NextResponse.json({ success: true, resources: updated });
    }

    // ── 2. Business Hours Editor ──
    if (action === 'UPDATE_HOURS') {
      const { dayOfWeek, startTime, endTime, isClosed } = body;
      if (dayOfWeek === undefined) {
        return NextResponse.json({ error: 'dayOfWeek is required' }, { status: 400 });
      }
      const updatedHours = await bookingService.updateBusinessHours(
        Number(dayOfWeek),
        startTime || '10:00',
        endTime || '19:00',
        !!isClosed
      );
      await logAudit({
        action: 'BUSINESS_HOURS_UPDATED',
        entityType: 'SETTING',
        entityId: `day-${dayOfWeek}`,
        after: { dayOfWeek, startTime, endTime, isClosed },
      });
      return NextResponse.json({ success: true, hours: updatedHours });
    }

    // ── 3. Blocked Dates Manager ──
    if (action === 'ADD_BLOCKED_DATE') {
      const { date, reason } = body;
      if (!date) {
        return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
      }
      await bookingService.blockDate(date, reason);
      await logAudit({
        action: 'DATE_BLOCKED',
        entityType: 'SETTING',
        entityId: date,
        after: { date, reason },
      });
      const updated = await bookingService.listAllBlockedDates();
      return NextResponse.json({ success: true, blockedDates: updated });
    }

    if (action === 'DELETE_BLOCKED_DATE') {
      const { date } = body;
      if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }
      await bookingService.unblockDate(date);
      await logAudit({
        action: 'DATE_UNBLOCKED',
        entityType: 'SETTING',
        entityId: date,
      });
      const updated = await bookingService.listAllBlockedDates();
      return NextResponse.json({ success: true, blockedDates: updated });
    }

    // ── 4. Booking Rules Configuration ──
    if (action === 'UPDATE_BOOKING_RULES') {
      const { bufferMinutes, minLeadTimeHours, slotGranularityMinutes } = body;
      const updatedRules = updateBookingRules({
        bufferMinutes,
        minLeadTimeHours,
        slotGranularityMinutes,
      });
      await logAudit({
        action: 'BOOKING_RULES_UPDATED',
        entityType: 'SETTING',
        entityId: 'global-booking-rules',
        after: updatedRules,
      });
      return NextResponse.json({ success: true, bookingRules: updatedRules });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in settings API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
