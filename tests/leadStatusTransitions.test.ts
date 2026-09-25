import { describe, it } from 'node:test';
import assert from 'node:assert';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'FOLLOW_UP' | 'BOOKED' | 'COMPLETED' | 'LOST';

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'QUOTE_SENT', 'LOST'],
  CONTACTED: ['QUOTE_SENT', 'FOLLOW_UP', 'BOOKED', 'LOST'],
  QUOTE_SENT: ['FOLLOW_UP', 'BOOKED', 'LOST'],
  FOLLOW_UP: ['QUOTE_SENT', 'BOOKED', 'LOST'],
  BOOKED: ['COMPLETED', 'FOLLOW_UP', 'LOST'],
  COMPLETED: [], // Terminal state - requires explicit re-engagement creating new lead
  LOST: ['NEW'], // Re-opening a previously lost inquiry
};

function isValidLeadTransition(current: LeadStatus, next: LeadStatus): boolean {
  if (current === next) return true; // Idempotent
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

function isFollowUpDue(
  status: LeadStatus,
  lastActivityDate: Date,
  now: Date,
  thresholdDays = 3
): boolean {
  // Closed / converted leads are never due for follow-up
  if (status === 'BOOKED' || status === 'COMPLETED' || status === 'LOST') {
    return false;
  }
  const diffMs = now.getTime() - lastActivityDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

interface LeadStatusHistoryRecord {
  leadId: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  changedAt: Date;
  notes?: string;
}

function recordStatusTransition(
  leadId: string,
  fromStatus: LeadStatus | null,
  toStatus: LeadStatus,
  notes?: string
): LeadStatusHistoryRecord {
  if (fromStatus !== null && !isValidLeadTransition(fromStatus, toStatus)) {
    throw new Error(`ILLEGAL_TRANSITION: Cannot transition lead from ${fromStatus} to ${toStatus}`);
  }
  return {
    leadId,
    fromStatus,
    toStatus,
    changedAt: new Date(),
    notes,
  };
}

describe('Lead Status Transitions & Lifecycle State Machine (PRD §8.4, §19 AC-6)', () => {
  it('permits the standard forward conversion progression (NEW -> CONTACTED -> QUOTE_SENT -> FOLLOW_UP -> BOOKED -> COMPLETED)', () => {
    assert.strictEqual(isValidLeadTransition('NEW', 'CONTACTED'), true);
    assert.strictEqual(isValidLeadTransition('CONTACTED', 'QUOTE_SENT'), true);
    assert.strictEqual(isValidLeadTransition('QUOTE_SENT', 'FOLLOW_UP'), true);
    assert.strictEqual(isValidLeadTransition('FOLLOW_UP', 'BOOKED'), true);
    assert.strictEqual(isValidLeadTransition('BOOKED', 'COMPLETED'), true);
  });

  it('permits fast-track booking directly from CONTACTED or QUOTE_SENT', () => {
    assert.strictEqual(isValidLeadTransition('CONTACTED', 'BOOKED'), true);
    assert.strictEqual(isValidLeadTransition('QUOTE_SENT', 'BOOKED'), true);
  });

  it('permits marking leads as LOST from any active stage', () => {
    assert.strictEqual(isValidLeadTransition('NEW', 'LOST'), true);
    assert.strictEqual(isValidLeadTransition('CONTACTED', 'LOST'), true);
    assert.strictEqual(isValidLeadTransition('QUOTE_SENT', 'LOST'), true);
    assert.strictEqual(isValidLeadTransition('FOLLOW_UP', 'LOST'), true);
  });

  it('permits re-opening a LOST lead back to NEW', () => {
    assert.strictEqual(isValidLeadTransition('LOST', 'NEW'), true);
  });

  it('blocks invalid transitions and backward leaps from COMPLETED', () => {
    assert.strictEqual(isValidLeadTransition('COMPLETED', 'NEW'), false);
    assert.strictEqual(isValidLeadTransition('COMPLETED', 'BOOKED'), false);
    assert.strictEqual(isValidLeadTransition('COMPLETED', 'QUOTE_SENT'), false);
  });

  it('blocks premature jumps from NEW directly to BOOKED without contact or quote', () => {
    assert.strictEqual(isValidLeadTransition('NEW', 'BOOKED'), false);
    assert.strictEqual(isValidLeadTransition('NEW', 'COMPLETED'), false);
  });

  it('records status transition history and rejects illegal transitions', () => {
    const record = recordStatusTransition('lead-101', 'NEW', 'CONTACTED', 'Customer called via phone');
    assert.strictEqual(record.leadId, 'lead-101');
    assert.strictEqual(record.fromStatus, 'NEW');
    assert.strictEqual(record.toStatus, 'CONTACTED');
    assert.strictEqual(record.notes, 'Customer called via phone');
    assert.ok(record.changedAt instanceof Date);

    // Initial creation record (fromStatus = null)
    const initRecord = recordStatusTransition('lead-102', null, 'NEW', 'Web form intake');
    assert.strictEqual(initRecord.fromStatus, null);
    assert.strictEqual(initRecord.toStatus, 'NEW');

    // Illegal transition throws error
    assert.throws(
      () => recordStatusTransition('lead-103', 'COMPLETED', 'NEW'),
      /ILLEGAL_TRANSITION/
    );
  });

  it('enforces 3-day inactivity threshold exclusively on active lead statuses', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    const fourDaysAgo = new Date('2026-10-06T12:00:00Z');
    const twoDaysAgo = new Date('2026-10-08T12:00:00Z');

    // Active leads inactive > 3 days -> TRUE
    assert.strictEqual(isFollowUpDue('NEW', fourDaysAgo, now, 3), true);
    assert.strictEqual(isFollowUpDue('CONTACTED', fourDaysAgo, now, 3), true);
    assert.strictEqual(isFollowUpDue('QUOTE_SENT', fourDaysAgo, now, 3), true);
    assert.strictEqual(isFollowUpDue('FOLLOW_UP', fourDaysAgo, now, 3), true);

    // Active leads recent (< 3 days) -> FALSE
    assert.strictEqual(isFollowUpDue('NEW', twoDaysAgo, now, 3), false);
    assert.strictEqual(isFollowUpDue('CONTACTED', twoDaysAgo, now, 3), false);

    // Closed / terminal leads (even if > 3 days inactive) -> always FALSE
    assert.strictEqual(isFollowUpDue('BOOKED', fourDaysAgo, now, 3), false);
    assert.strictEqual(isFollowUpDue('COMPLETED', fourDaysAgo, now, 3), false);
    assert.strictEqual(isFollowUpDue('LOST', fourDaysAgo, now, 3), false);
  });
});
