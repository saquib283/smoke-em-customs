import { NextRequest, NextResponse } from 'next/server';
import { notificationsService } from '@/modules/notifications';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await notificationsService.listNotifications({
      unreadOnly,
      perPage: 30,
    });
    const unreadCount = await notificationsService.getUnreadCount();

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === 'MARK_READ') {
      if (!id) {
        return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
      }
      await notificationsService.markAsRead(id);
      const unreadCount = await notificationsService.getUnreadCount();
      return NextResponse.json({ success: true, unreadCount });
    }

    if (action === 'MARK_ALL_READ') {
      await notificationsService.markAllAsRead();
      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
