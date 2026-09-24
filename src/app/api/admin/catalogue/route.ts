import { NextRequest, NextResponse } from 'next/server';
import { catalogueService } from '@/modules/catalogue';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'SERVICES';

    if (type === 'PACKAGES') {
      const packages = await catalogueService.listPackages();
      return NextResponse.json({ success: true, packages });
    }

    const services = await catalogueService.listServices();
    return NextResponse.json({ success: true, services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, action, id, data } = body;

    if (target === 'SERVICE') {
      if (action === 'CREATE') {
        const created = await catalogueService.createService(data);
        await logAudit({
          action: 'SERVICE_CREATED',
          entityType: 'SERVICE',
          entityId: created.id,
          after: { name: created.name, slug: created.slug },
        });
        return NextResponse.json({ success: true, service: created });
      }
      if (action === 'UPDATE') {
        const updated = await catalogueService.updateService(id, data);
        await logAudit({
          action: 'SERVICE_UPDATED',
          entityType: 'SERVICE',
          entityId: id,
          after: data,
        });
        return NextResponse.json({ success: true, service: updated });
      }
      if (action === 'DELETE') {
        await catalogueService.deleteService(id);
        await logAudit({
          action: 'SERVICE_DELETED',
          entityType: 'SERVICE',
          entityId: id,
        });
        return NextResponse.json({ success: true });
      }
    }

    if (target === 'PACKAGE') {
      if (action === 'CREATE') {
        const created = await catalogueService.createPackage(data);
        await logAudit({
          action: 'PACKAGE_CREATED',
          entityType: 'PACKAGE',
          entityId: created.id,
          after: { name: created.name, slug: created.slug },
        });
        return NextResponse.json({ success: true, package: created });
      }
      if (action === 'UPDATE') {
        const updated = await catalogueService.updatePackage(id, data);
        await logAudit({
          action: 'PACKAGE_UPDATED',
          entityType: 'PACKAGE',
          entityId: id,
          after: data,
        });
        return NextResponse.json({ success: true, package: updated });
      }
      if (action === 'DELETE') {
        await catalogueService.deletePackage(id);
        await logAudit({
          action: 'PACKAGE_DELETED',
          entityType: 'PACKAGE',
          entityId: id,
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid target or action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in catalogue admin API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
