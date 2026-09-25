import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { crmService } from '@/modules/crm';
import { normalizeWhatsAppPhone } from '@/modules/whatsapp';

/**
 * POST /api/admin/whatsapp/simulate-inbound
 * Admin testing tool to simulate an inbound client WhatsApp response.
 * Runs the exact same customer match/create, lead intake, communication log,
 * and admin feed alert logic as the live Meta webhook handler.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fromPhone, clientName, messageText, leadId } = body;

    if (!fromPhone || !messageText?.trim()) {
      return NextResponse.json(
        { error: 'fromPhone and messageText are required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeWhatsAppPhone(fromPhone);
    const text = messageText.trim();
    const displayName = clientName?.trim() || `WhatsApp Client (+${normalizedPhone})`;

    // 1. Match or auto-create customer
    let customer = await crmService.getCustomerByPhone(normalizedPhone);
    if (!customer) {
      const tenDigits = normalizedPhone.slice(-10);
      customer = await crmService.getCustomerByPhone(tenDigits);
    }

    let isNewCustomer = false;
    if (!customer) {
      const created = await crmService.findOrCreateCustomer({
        name: displayName,
        phone: normalizedPhone,
        preferredContactMethod: 'WHATSAPP',
      });
      customer = await crmService.getCustomer(created.id);
      isNewCustomer = true;
    }

    if (!customer) {
      return NextResponse.json({ error: 'Failed to resolve or create customer record.' }, { status: 500 });
    }

    // 2. Resolve or associate Lead
    let targetLeadId = leadId;
    if (!targetLeadId && isNewCustomer) {
      const createdLead = await crmService.createLead({
        customerName: customer.name,
        customerPhone: customer.phone,
        source: 'whatsapp_inbound',
        additionalNotes: text,
      });
      targetLeadId = createdLead.id;
    }

    // 3. Record Inbound Communication entry in CRM
    const comm = await db.orm.public.Communication.create({
      customerId: customer.id,
      leadId: targetLeadId || undefined,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      summary: text,
    });

    // 4. Trigger Admin Notification alert
    const notif = await db.orm.public.Notification.create({
      type: 'NEW_LEAD',
      title: `WhatsApp Inbound: ${customer.name}`,
      body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
      entityType: targetLeadId ? 'lead' : 'customer',
      entityId: targetLeadId || customer.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      simulated: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        isNew: isNewCustomer,
      },
      leadId: targetLeadId,
      communicationId: comm.id,
      notificationId: notif.id,
    });
  } catch (err: any) {
    console.error('[AdminWhatsAppSimulateInbound] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
