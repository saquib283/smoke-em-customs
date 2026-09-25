/**
 * Audit Logging Helper — Smoke M Customs
 * Architecture §17 & PRD §13 (AR-2)
 *
 * Records all state-changing administrative operations (status changes,
 * slot adjustments, cancellations, and catalogue modifications).
 */

import { db } from '@/prisma/db';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  entityType: 'BOOKING' | 'LEAD' | 'QUOTE' | 'SERVICE' | 'PACKAGE' | 'RESOURCE' | 'SETTING' | string;
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

export interface ListAuditLogsOptions {
  entityType?: 'BOOKING' | 'LEAD' | 'QUOTE' | 'SERVICE' | 'PACKAGE' | 'RESOURCE' | 'SETTING' | string;
  entityId?: string;
  actorId?: string;
  limit?: number;
}

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: any;
  after: any;
  createdAt: string;
}

function parseJson(val: any): any {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await db.orm.public.AuditLog.create({
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ? JSON.stringify(input.before) : null,
      after: input.after ? JSON.stringify(input.after) : null,
    });
  } catch (err) {
    // Non-blocking: audit log failure should not crash core business transactions
    console.error('Failed to write audit log entry:', err);
  }
}

export async function listAuditLogs(options?: ListAuditLogsOptions): Promise<AuditLogItem[]> {
  try {
    let query = db.orm.public.AuditLog;
    if (options?.entityType) {
      query = query.where({ entityType: options.entityType });
    }
    if (options?.entityId) {
      query = query.where({ entityId: options.entityId });
    }
    if (options?.actorId) {
      query = query.where({ actorId: options.actorId });
    }

    const logs = await query.orderBy((a) => a.createdAt.desc()).limit(options?.limit ?? 50).all();

    return logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      before: parseJson(log.before),
      after: parseJson(log.after),
      createdAt: log.createdAt,
    }));
  } catch (err) {
    console.error('Failed to list audit logs:', err);
    return [];
  }
}
