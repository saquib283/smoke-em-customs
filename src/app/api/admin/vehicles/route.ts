import { NextRequest, NextResponse } from 'next/server';
import { crmService } from '@/modules/crm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const vehicle = await crmService.getVehicle(id);
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, vehicle });
    }

    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const vehicles = await crmService.listAllVehicles({ search, type });

    return NextResponse.json({ success: true, vehicles });
  } catch (err: any) {
    console.error('Error fetching vehicles:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, customerId, vehicleId, vehicleData } = body;

    if (action === 'ADD_VEHICLE') {
      if (!customerId || !vehicleData) {
        return NextResponse.json({ error: 'Missing customerId or vehicleData' }, { status: 400 });
      }
      const vehicle = await crmService.addVehicle(customerId, vehicleData);
      return NextResponse.json({ success: true, vehicle });
    }

    if (action === 'UPDATE_VEHICLE') {
      if (!vehicleId || !vehicleData) {
        return NextResponse.json({ error: 'Missing vehicleId or vehicleData' }, { status: 400 });
      }
      const vehicle = await crmService.updateVehicle(vehicleId, vehicleData);
      return NextResponse.json({ success: true, vehicle });
    }

    if (action === 'DELETE_VEHICLE') {
      if (!vehicleId) {
        return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
      }
      await crmService.deleteVehicle(vehicleId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error modifying vehicle:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
