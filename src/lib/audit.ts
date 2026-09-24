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
  entityType: 'BOOKING' | 'LEAD' | 'QUOTE' | 'SERVICE' | 'PACKAGE' | 'RESOURCE' | 'SETTING';
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
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
