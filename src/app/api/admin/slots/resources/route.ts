import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const resources = await bookingService.listResources();
    return NextResponse.json({ success: true, resources });
  } catch (err: any) {
    console.error('Error listing resources:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Bay name is required' }, { status: 400 });
    }

    const resource = await bookingService.createResource(name);
    return NextResponse.json({ success: true, resource });
  } catch (err: any) {
    console.error('Error creating resource:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Bay ID is required' }, { status: 400 });
    }

    const updated = await bookingService.updateResource(id, { name, isActive });
    return NextResponse.json({ success: true, resource: updated });
  } catch (err: any) {
    console.error('Error updating resource:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bay ID is required' }, { status: 400 });
    }

    const res = await bookingService.deleteResource(id);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('Error deleting resource:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 400 });
  }
}
