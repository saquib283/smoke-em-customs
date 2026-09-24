/**
 * Notifications Module — Implementation
 * Manages in-app notifications and communication logs.
 * Architecture §13
 */

import { db } from '@/prisma/db';

export interface NotificationListItem {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export type NotificationDetail = NotificationListItem;

export interface CreateNotificationInput {
  type: 'NEW_LEAD' | 'NEW_BOOKING_PENDING' | 'BOOKING_CANCELLED' | 'LEAD_NEEDS_FOLLOWUP' | 'QUOTE_EXPIRING';
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

export interface ListNotificationsOptions {
  unreadOnly?: boolean;
  page?: number;
  perPage?: number;
}

export interface LogCommunicationInput {
  customerId: string;
  leadId?: string;
  channel: 'WHATSAPP' | 'CALL' | 'EMAIL' | 'SMS';
  direction: 'OUTBOUND' | 'INBOUND';
  summary: string;
}

export interface CommunicationEntry {
  id: string;
  channel: string;
  direction: string;
  summary: string;
  createdAt: string;
}

export class NotificationsService {
  async createNotification(data: CreateNotificationInput): Promise<NotificationDetail> {
    const n = await db.orm.public.Notification.create({
      type: data.type,
      title: data.title,
      body: data.body,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      isRead: false,
    });

    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      entityType: n.entityType,
      entityId: n.entityId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    };
  }

  async listNotifications(options?: ListNotificationsOptions): Promise<NotificationListItem[]> {
    let query = db.orm.public.Notification;

    if (options?.unreadOnly) {
      query = query.where({ isRead: false });
    }

    const list = await query
      .orderBy((n) => n.createdAt.desc())
      .limit(options?.perPage ?? 20)
      .all();

    return list.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      entityType: n.entityType,
      entityId: n.entityId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));
  }

  async markAsRead(id: string): Promise<void> {
    await db.orm.public.Notification.where({ id }).update({ isRead: true });
  }

  async markAllAsRead(): Promise<void> {
    const unread = await db.orm.public.Notification.where({ isRead: false }).all();
    for (const item of unread) {
      await db.orm.public.Notification.where({ id: item.id }).update({ isRead: true });
    }
  }

  async getUnreadCount(): Promise<number> {
    const unread = await db.orm.public.Notification.where({ isRead: false }).all();
    return unread.length;
  }

  // ── Communication Log ──

  async logCommunication(data: LogCommunicationInput): Promise<void> {
    await db.orm.public.Communication.create({
      customerId: data.customerId,
      leadId: data.leadId ?? null,
      channel: data.channel,
      direction: data.direction,
      summary: data.summary.trim(),
    });
  }

  async listCommunications(customerId: string): Promise<CommunicationEntry[]> {
    const comms = await db.orm.public.Communication
      .where({ customerId })
      .orderBy((c) => c.createdAt.desc())
      .all();

    return comms.map((c) => ({
      id: c.id,
      channel: c.channel,
      direction: c.direction,
      summary: c.summary,
      createdAt: c.createdAt,
    }));
  }
}

export const notificationsService = new NotificationsService();
