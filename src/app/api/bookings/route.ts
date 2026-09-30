import { NextRequest, NextResponse } from 'next/server';
import { crmService } from '@/modules/crm';
import { bookingService } from '@/modules/booking';
import { catalogueService } from '@/modules/catalogue';
import { checkPublicFormLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkPublicFormLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'Customer name and phone number are required.' },
        { status: 400 }
      );
    }

    if (!body.startAt || !body.resourceId) {
      return NextResponse.json(
        { error: 'A valid date, time slot, and detailing bay are required.' },
        { status: 400 }
      );
    }

    // 1. Find or create Customer
    const customer = await crmService.findOrCreateCustomer({
      name: body.customerName.trim(),
      phone: body.customerPhone.trim(),
      email: body.customerEmail?.trim() || undefined,
    });

    // 2. Add or find Vehicle
    let vehicleId: string | null = null;
    if (body.vehicleBrand && body.vehicleModel) {
      const VALID_TYPES = ['HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'LUXURY', 'TWO_WHEELER', 'OTHER'] as const;
      type ValidType = typeof VALID_TYPES[number];
      let normalizedType: ValidType | undefined = undefined;

      if (body.vehicleType) {
        const raw = String(body.vehicleType).toUpperCase().trim();
        if (VALID_TYPES.includes(raw as ValidType)) {
          normalizedType = raw as ValidType;
        } else if (raw.includes('SUV')) {
          normalizedType = 'SUV';
        } else if (raw.includes('LUX') || raw.includes('SPORT') || raw.includes('SUPER')) {
          normalizedType = 'LUXURY';
        } else if (raw.includes('HATCH') || raw.includes('COMPACT')) {
          normalizedType = 'HATCHBACK';
        } else if (raw.includes('SEDAN')) {
          normalizedType = 'SEDAN';
        } else {
          normalizedType = 'OTHER';
        }
      }

      const vehicle = await crmService.addVehicle(customer.id, {
        brand: body.vehicleBrand.trim(),
        model: body.vehicleModel.trim(),
        variant: body.vehicleVariant?.trim() || undefined,
        vehicleType: normalizedType,
      });
      vehicleId = vehicle.id;
    }

    // 3. Resolve duration & pricing (support both ID and slug)
    let durationMinutes = 120;
    let priceQuoted: string | null = null;
    let resolvedServiceId: string | null = body.serviceId || null;
    let resolvedPackageId: string | null = body.packageId || null;

    if (body.serviceId || body.service) {
      const identifier = body.serviceId || body.service;
      let s = await catalogueService.getServiceById(identifier);
      if (!s) {
        s = await catalogueService.getServiceBySlug(identifier);
      }
      if (s) {
        resolvedServiceId = s.id;
        durationMinutes = s.durationMinutes;
        priceQuoted = s.startingPrice;
      }
    } else if (body.packageId || body.package) {
      const identifier = body.packageId || body.package;
      let p = await catalogueService.getPackageById(identifier);
      if (!p) {
        p = await catalogueService.getPackageBySlug(identifier);
      }
      if (p) {
        resolvedPackageId = p.id;
        durationMinutes = p.durationMinutes;
        priceQuoted = p.price ?? p.startingPrice;
      }
    }

    // 4. Create Booking
    const booking = await bookingService.createBooking({
      customerId: customer.id,
      vehicleId: vehicleId ?? undefined,
      leadId: body.leadId || undefined,
      quoteId: body.quoteId || undefined,
      serviceId: resolvedServiceId || undefined,
      packageId: resolvedPackageId || undefined,
      resourceId: body.resourceId,
      startAt: body.startAt,
      durationMinutes,
      source: 'public_web',
      priceQuoted: priceQuoted ?? undefined,
      customerNotes: body.customerNotes?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      message: 'Booking created successfully.',
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    if (err.message === 'SLOT_NO_LONGER_AVAILABLE' || err.code === 'SLOT_NO_LONGER_AVAILABLE') {
      return NextResponse.json(
        {
          error: 'SLOT_NO_LONGER_AVAILABLE',
          message: 'The selected bay time slot is no longer available. Please select another slot.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
