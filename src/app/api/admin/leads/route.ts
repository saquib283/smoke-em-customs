import { NextRequest, NextResponse } from 'next/server';
import { crmService } from '@/modules/crm';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing lead ID' }, { status: 400 });
    }
    const lead = await crmService.getLead(id);
    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, leadId, status, notes, authorId, body: noteBody } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    if (action === 'UPDATE_STATUS') {
      const updated = await crmService.updateLeadStatus(leadId, status, notes);
      await logAudit({
        action: 'LEAD_STATUS_UPDATED',
        entityType: 'LEAD',
        entityId: leadId,
        after: { status, notes },
      });
      return NextResponse.json({ success: true, lead: updated });
    }

    if (action === 'ADD_NOTE') {
      await crmService.addLeadNote(leadId, authorId || 'admin', noteBody || '');
      await logAudit({
        action: 'LEAD_NOTE_ADDED',
        entityType: 'LEAD',
        entityId: leadId,
        after: { authorId, noteBody },
      });
      const lead = await crmService.getLead(leadId);
      return NextResponse.json({ success: true, lead });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error managing lead:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
