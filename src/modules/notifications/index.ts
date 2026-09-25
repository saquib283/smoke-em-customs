/**
 * Notifications Module — Implementation
 * Manages in-app notifications, event bus, handler registry, and communication logs.
 * Architecture §13, PRD §14
 */

import { db } from '@/prisma/db';
import { eventBus, AppEvent } from './bus';
import './handlers'; // Initialize and register handlers

export * from './bus';
export * from './handlers';

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
  type?: string;
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
  customerId: string;
  customerName?: string;
  leadId: string | null;
  channel: string;
  direction: string;
  summary: string;
  createdAt: string;
}

export class NotificationsService {
  /**
   * Dispatches a business event across registered handlers (event bus).
   */
  async emitEvent(event: AppEvent): Promise<void> {
    await eventBus.emit(event);
  }

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
    if (options?.type && options.type !== 'ALL') {
      query = query.where({ type: options.type as any });
    }

    const list = await query
      .orderBy((n) => n.createdAt.desc())
      .limit(options?.perPage ?? 50)
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

  async deleteNotification(id: string): Promise<boolean> {
    const existing = await db.orm.public.Notification.where({ id }).first();
    if (!existing) return false;
    await db.orm.public.Notification.where({ id }).delete();
    return true;
  }

  async getUnreadCount(): Promise<number> {
    const unread = await db.orm.public.Notification.where({ isRead: false }).all();
    return unread.length;
  }

  // ── Communication Log ──

  async logCommunication(data: LogCommunicationInput): Promise<CommunicationEntry> {
    const comm = await db.orm.public.Communication.create({
      customerId: data.customerId,
      leadId: data.leadId ?? null,
      channel: data.channel,
      direction: data.direction,
      summary: data.summary.trim(),
    });

    const customer = await db.orm.public.Customer.where({ id: data.customerId }).first();

    return {
      id: comm.id,
      customerId: comm.customerId,
      customerName: customer?.name ?? 'Client',
      leadId: comm.leadId,
      channel: comm.channel,
      direction: comm.direction,
      summary: comm.summary,
      createdAt: comm.createdAt,
    };
  }

  async listCommunications(options?: { customerId?: string; leadId?: string }): Promise<CommunicationEntry[]> {
    let query = db.orm.public.Communication;

    if (options?.customerId) {
      query = query.where({ customerId: options.customerId });
    }
    if (options?.leadId) {
      query = query.where({ leadId: options.leadId });
    }

    const comms = await query.orderBy((c) => c.createdAt.desc()).limit(100).all();

    const results: CommunicationEntry[] = [];
    for (const c of comms) {
      const customer = await db.orm.public.Customer.where({ id: c.customerId }).first();
      results.push({
        id: c.id,
        customerId: c.customerId,
        customerName: customer?.name ?? 'Client',
        leadId: c.leadId,
        channel: c.channel,
        direction: c.direction,
        summary: c.summary,
        createdAt: c.createdAt,
      });
    }

    return results;
  }
}

export const notificationsService = new NotificationsService();
