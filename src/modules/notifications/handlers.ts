/**
 * Notification Handlers Registry — Smoke M Customs
 * Architecture §13 (ADR-3)
 * Registerable handlers responding to events on the central event bus.
 */

import { AppEvent, EventHandler, eventBus } from './bus';
import { db } from '@/prisma/db';
import {
  whatsappAdapter,
  whatsAppCloudClient,
  getWhatsAppConfig,
  buildLeadWelcomeMessage,
  buildQuoteNotificationMessage,
  buildBookingConfirmationMessage,
  buildBookingCancelledMessage,
} from '@/modules/whatsapp';
import { emailService } from '@/modules/email/index.ts';

/**
 * AdminFeedHandler
 * MVP's primary channel: writes persistent notifications to the Notification table
 * for display in the admin header bell and notification feed.
 */
export class AdminFeedHandler implements EventHandler {
  name = 'AdminFeedHandler';

  async handle(event: AppEvent): Promise<void> {
    switch (event.type) {
      case 'lead.created': {
        await db.orm.public.Notification.create({
          type: 'NEW_LEAD',
          title: 'New Client Lead Enquired',
          body: `${event.customerName} submitted an enquiry for ${event.vehicleText || 'vehicle'}${
            event.serviceInterest ? ` (${event.serviceInterest})` : ''
          }.`,
          entityType: 'lead',
          entityId: event.leadId,
          isRead: false,
        });
        break;
      }

      case 'lead.needs_followup': {
        await db.orm.public.Notification.create({
          type: 'LEAD_NEEDS_FOLLOWUP',
          title: 'Lead Follow-up Required',
          body: `${event.customerName} has had no CRM activity for ${event.daysInactive} days. Follow-up recommended.`,
          entityType: 'lead',
          entityId: event.leadId,
          isRead: false,
        });
        break;
      }

      case 'booking.created': {
        const timeFormatted = new Date(event.startAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        await db.orm.public.Notification.create({
          type: 'NEW_BOOKING_PENDING',
          title: 'New Studio Bay Appointment',
          body: `${event.customerName} reserved a slot on ${timeFormatted}${
            event.resourceName ? ` (${event.resourceName})` : ''
          }.`,
          entityType: 'booking',
          entityId: event.bookingId,
          isRead: false,
        });
        break;
      }

      case 'booking.status_changed': {
        if (event.toStatus === 'CANCELLED') {
          await db.orm.public.Notification.create({
            type: 'BOOKING_CANCELLED',
            title: 'Bay Booking Cancelled',
            body: `Appointment for ${event.customerName} was cancelled.${
              event.reason ? ` Reason: ${event.reason}` : ''
            }`,
            entityType: 'booking',
            entityId: event.bookingId,
            isRead: false,
          });
        }
        break;
      }

      case 'quote.expiring': {
        await db.orm.public.Notification.create({
          type: 'QUOTE_EXPIRING',
          title: 'Quotation Expiring Soon',
          body: `Quotation for ${event.customerName} will expire on ${new Date(
            event.validUntil
          ).toLocaleDateString('en-IN')}.`,
          entityType: 'quote',
          entityId: event.quoteId,
          isRead: false,
        });
        break;
      }

      case 'quote.sent': {
        await db.orm.public.Notification.create({
          type: 'NEW_LEAD',
          title: 'Formal Quote Dispatched',
          body: `Formal quotation of ₹${Number(event.total).toLocaleString(
            'en-IN'
          )} was issued to ${event.customerName}.`,
          entityType: 'quote',
          entityId: event.quoteId,
          isRead: false,
        });
        break;
      }

      default:
        break;
    }
  }
}

/**
 * WhatsAppDeepLinkHandler
 * MVP: Named logging handler verifying deep-link generation and event-to-channel wiring.
 */
export class WhatsAppDeepLinkHandler implements EventHandler {
  name = 'WhatsAppDeepLinkHandler';

  async handle(event: AppEvent): Promise<void> {
    if (event.type === 'lead.created' && event.customerPhone) {
      const link = whatsappAdapter.buildDeepLink(
        event.customerPhone,
        `Hi ${event.customerName}, thank you for contacting Smoke M Customs! We received your enquiry for ${event.vehicleText || 'your car'}.`
      );
      // Prepared for manual dispatch
      console.log(`[WhatsAppDeepLinkHandler] Ready deep-link for lead ${event.leadId}: ${link}`);
    } else if (event.type === 'booking.created' && event.customerPhone) {
      const link = whatsappAdapter.buildDeepLink(
        event.customerPhone,
        `Hi ${event.customerName}, your detailing bay slot at Smoke M Customs is confirmed for ${new Date(
          event.startAt
        ).toLocaleDateString('en-IN')}.`
      );
      console.log(`[WhatsAppDeepLinkHandler] Ready deep-link for booking ${event.bookingId}: ${link}`);
    }
  }
}

/**
 * WhatsAppApiHandler
 * Automated Meta WhatsApp Business Cloud API handler.
 * Dispatches automated client communications and records outbound entries in the CRM log.
 */
export class WhatsAppApiHandler implements EventHandler {
  name = 'WhatsAppApiHandler';

  async handle(event: AppEvent): Promise<void> {
    const config = getWhatsAppConfig();
    if (!config.isEnabled) {
      return;
    }

    try {
      switch (event.type) {
        case 'lead.created': {
          if (!config.autoSendLeadWelcome) break;
          let phone = event.customerPhone;
          if (!phone && event.customerId) {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            phone = customer?.phone;
          }
          if (phone) {
            const message = buildLeadWelcomeMessage(
              event.customerName,
              event.vehicleText ?? undefined,
              event.leadId
            );
            const res = await whatsAppCloudClient.sendTextMessage(phone, message);
            if (res.success) {
              await db.orm.public.Communication.create({
                customerId: event.customerId,
                leadId: event.leadId,
                channel: 'WHATSAPP',
                direction: 'OUTBOUND',
                summary: `Automated WhatsApp Welcome Message sent (Ref: #${event.leadId.slice(-6).toUpperCase()})`,
              });
            }
          }
          break;
        }

        case 'quote.sent': {
          if (!config.autoSendQuoteNotification) break;
          let phone = event.customerPhone;
          if (!phone && event.customerId) {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            phone = customer?.phone;
          }
          if (phone) {
            const baseUrl = process.env['AUTH_URL'] || 'http://localhost:3000';
            const quoteUrl = `${baseUrl}/quotes/${event.quoteId}`;
            const message = buildQuoteNotificationMessage(
              event.customerName,
              event.quoteId.slice(-6).toUpperCase(),
              event.total,
              quoteUrl
            );
            const res = await whatsAppCloudClient.sendTextMessage(phone, message);
            if (res.success) {
              await db.orm.public.Communication.create({
                customerId: event.customerId,
                leadId: event.leadId,
                channel: 'WHATSAPP',
                direction: 'OUTBOUND',
                summary: `Automated WhatsApp Formal Quote sent (Quote #${event.quoteId.slice(-6).toUpperCase()})`,
              });
            }
          }
          break;
        }

        case 'booking.created': {
          if (!config.autoSendBookingConfirmation) break;
          let phone = event.customerPhone;
          if (!phone && event.customerId) {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            phone = customer?.phone;
          }
          if (phone) {
            const timeFormatted = new Date(event.startAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const message = buildBookingConfirmationMessage(
              event.customerName,
              timeFormatted,
              event.resourceName ?? undefined,
              event.serviceOrPackageName ?? undefined
            );
            const res = await whatsAppCloudClient.sendTextMessage(phone, message);
            if (res.success) {
              await db.orm.public.Communication.create({
                customerId: event.customerId,
                channel: 'WHATSAPP',
                direction: 'OUTBOUND',
                summary: `Automated WhatsApp Booking Confirmation sent for ${timeFormatted}`,
              });
            }
          }
          break;
        }

        case 'booking.status_changed': {
          if (event.toStatus === 'CANCELLED') {
            if (!config.autoSendBookingCancellation) break;
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            if (customer?.phone) {
              const message = buildBookingCancelledMessage(
                event.customerName,
                event.reason ?? undefined
              );
              const res = await whatsAppCloudClient.sendTextMessage(customer.phone, message);
              if (res.success) {
                await db.orm.public.Communication.create({
                  customerId: event.customerId,
                  channel: 'WHATSAPP',
                  direction: 'OUTBOUND',
                  summary: `Automated WhatsApp Booking Cancellation notice sent`,
                });
              }
            }
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[WhatsAppApiHandler] Execution error:', err);
    }
  }
}

/**
 * EmailHandler
 * Automated Email notification handler.
 * Dispatches automated client transactional emails and records outbound entries in the CRM log.
 */
export class EmailHandler implements EventHandler {
  name = 'EmailHandler';

  async handle(event: AppEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'lead.created': {
          let email: string | undefined;
          let customerName = event.customerName;

          if (event.customerId) {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            email = customer?.email ?? undefined;
            if (customer?.name) customerName = customer.name;
          }

          if (email) {
            const result = await emailService.sendLeadWelcome({
              toEmail: email,
              customerName,
              vehicleText: event.vehicleText ?? undefined,
              leadId: event.leadId,
              serviceInterest: event.serviceInterest ?? undefined,
            });

            if (result.success) {
              await db.orm.public.Communication.create({
                customerId: event.customerId,
                leadId: event.leadId,
                channel: 'EMAIL',
                direction: 'OUTBOUND',
                summary: `Automated Welcome Email sent to ${email} (Ref: #${event.leadId.slice(-6).toUpperCase()})`,
              });
            }
          }
          break;
        }

        case 'quote.sent': {
          let email: string | undefined;
          let customerName = event.customerName;

          if (event.customerId) {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            email = customer?.email ?? undefined;
            if (customer?.name) customerName = customer.name;
          }

          if (email) {
            const baseUrl = process.env['AUTH_URL'] || 'http://localhost:3000';
            const quoteUrl = `${baseUrl}/quotes/${event.quoteId}`;

            const result = await emailService.sendQuoteReady({
              toEmail: email,
              customerName,
              quoteNumber: event.quoteId.slice(-6).toUpperCase(),
              totalAmount: event.total,
              items: [],
              quoteUrl,
            });

            if (result.success) {
              await db.orm.public.Communication.create({
                customerId: event.customerId,
                leadId: event.leadId,
                channel: 'EMAIL',
                direction: 'OUTBOUND',
                summary: `Automated Formal Quote Email sent to ${email} (Quote #${event.quoteId.slice(-6).toUpperCase()})`,
              });
            }
          }
          break;
        }

        case 'booking.created': {
          let email: string | undefined;
          let customerName = event.customerName;

          if (event.customerId) {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            email = customer?.email ?? undefined;
            if (customer?.name) customerName = customer.name;
          }

          if (email) {
            const timeFormatted = new Date(event.startAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const result = await emailService.sendBookingConfirmation({
              toEmail: email,
              customerName,
              serviceOrPackageName: event.serviceOrPackageName || 'Concourse Treatment',
              appointmentTimeFormatted: timeFormatted,
              bayName: event.resourceName ?? undefined,
              priceQuoted: event.priceQuoted ?? undefined,
            });

            if (result.success) {
              await db.orm.public.Communication.create({
                customerId: event.customerId,
                channel: 'EMAIL',
                direction: 'OUTBOUND',
                summary: `Automated Booking Confirmation Email sent to ${email} for ${timeFormatted}`,
              });
            }
          }
          break;
        }

        case 'booking.status_changed': {
          if (event.toStatus === 'CANCELLED') {
            const customer = await db.orm.public.Customer.where({ id: event.customerId }).first();
            if (customer?.email) {
              const result = await emailService.sendBookingCancelled({
                toEmail: customer.email,
                customerName: event.customerName,
                appointmentTimeFormatted: 'Scheduled Slot',
                reason: event.reason ?? undefined,
              });

              if (result.success) {
                await db.orm.public.Communication.create({
                  customerId: event.customerId,
                  channel: 'EMAIL',
                  direction: 'OUTBOUND',
                  summary: `Automated Booking Cancellation Email sent to ${customer.email}`,
                });
              }
            }
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[EmailHandler] Error executing email notification:', err);
    }
  }
}

// Register default handlers on startup
export const adminFeedHandler = new AdminFeedHandler();
export const whatsAppDeepLinkHandler = new WhatsAppDeepLinkHandler();
export const whatsAppApiHandler = new WhatsAppApiHandler();
export const emailHandler = new EmailHandler();

eventBus.register(adminFeedHandler);
eventBus.register(whatsAppDeepLinkHandler);
eventBus.register(whatsAppApiHandler);
eventBus.register(emailHandler);
