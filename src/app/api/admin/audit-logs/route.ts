import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const logs = await listAuditLogs({
      entityType,
      entityId,
      actorId,
      limit,
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
