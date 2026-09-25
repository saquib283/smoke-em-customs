/**
 * Notification Event Bus — Smoke M Customs
 * Architecture §13 (ADR-3)
 * Provides a lightweight, typed in-process event bus for decoupled business event handling.
 */

export type AppEvent =
  | {
      type: 'lead.created';
      leadId: string;
      customerId: string;
      customerName: string;
      customerPhone?: string;
      vehicleText?: string | null;
      serviceInterest?: string | null;
    }
  | {
      type: 'lead.status_changed';
      leadId: string;
      customerId: string;
      customerName: string;
      fromStatus: string;
      toStatus: string;
    }
  | {
      type: 'lead.needs_followup';
      leadId: string;
      customerId: string;
      customerName: string;
      daysInactive: number;
    }
  | {
      type: 'booking.created';
      bookingId: string;
      customerId: string;
      customerName: string;
      customerPhone?: string;
      startAt: string;
      resourceName?: string;
      serviceOrPackageName?: string | null;
      priceQuoted?: string | null;
    }
  | {
      type: 'booking.status_changed';
      bookingId: string;
      customerId: string;
      customerName: string;
      fromStatus: string;
      toStatus: string;
      reason?: string | null;
    }
  | {
      type: 'quote.created';
      quoteId: string;
      leadId: string;
      customerId: string;
      customerName: string;
      total: string;
    }
  | {
      type: 'quote.sent';
      quoteId: string;
      leadId: string;
      customerId: string;
      customerName: string;
      customerPhone?: string;
      total: string;
    }
  | {
      type: 'quote.status_changed';
      quoteId: string;
      customerName: string;
      fromStatus: string;
      toStatus: string;
    }
  | {
      type: 'quote.expiring';
      quoteId: string;
      customerName: string;
      validUntil: string;
    };

export interface EventHandler {
  name: string;
  handle(event: AppEvent): Promise<void>;
}

export class EventBus {
  private handlers: EventHandler[] = [];

  register(handler: EventHandler): void {
    if (!this.handlers.some((h) => h.name === handler.name)) {
      this.handlers.push(handler);
    }
  }

  unregister(handlerName: string): void {
    this.handlers = this.handlers.filter((h) => h.name !== handlerName);
  }

  getHandlers(): EventHandler[] {
    return [...this.handlers];
  }

  async emit(event: AppEvent): Promise<void> {
    const promises = this.handlers.map(async (handler) => {
      try {
        await handler.handle(event);
      } catch (err) {
        // Error isolation: failure in one handler must not fail the bus or other handlers
        console.error(`[EventBus] Handler '${handler.name}' failed on event '${event.type}':`, err);
      }
    });

    await Promise.allSettled(promises);
  }
}

export const eventBus = new EventBus();
