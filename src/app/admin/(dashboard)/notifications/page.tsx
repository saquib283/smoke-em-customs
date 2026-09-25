import React from 'react';
import { notificationsService } from '@/modules/notifications';
import { NotificationsClient } from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const [notifications, unreadCount] = await Promise.all([
    notificationsService.listNotifications({ perPage: 100 }),
    notificationsService.getUnreadCount(),
  ]);

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
