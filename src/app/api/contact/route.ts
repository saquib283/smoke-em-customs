import { NextRequest, NextResponse } from 'next/server';
import { crmService } from '@/modules/crm';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, vehicleText, serviceInterestName, message } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'A valid 10-digit mobile number is required.' },
        { status: 400 }
      );
    }

    const vehicleParts = (vehicleText || '').trim().split(/\s+/);
    const vehicleBrand = vehicleParts[0] || undefined;
    const vehicleModel = vehicleParts.slice(1).join(' ') || undefined;

    const notesSummary = [
      serviceInterestName ? `Interest: ${serviceInterestName}` : null,
      vehicleText ? `Vehicle: ${vehicleText}` : null,
      message ? `Message: ${message}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const lead = await crmService.createLead({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email?.trim() || undefined,
      vehicleBrand,
      vehicleModel,
      additionalNotes: notesSummary || undefined,
      source: 'CONTACT_FORM',
    });

    await logAudit({
      action: 'LEAD_CREATED_FROM_CONTACT',
      entityType: 'LEAD',
      entityId: lead.id,
      after: {
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        vehicleBrand,
        vehicleModel,
      },
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: 'Inquiry received. A detailing specialist will connect with you promptly.',
    });
  } catch (err: any) {
    console.error('Contact submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
