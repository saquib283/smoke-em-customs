/**
 * Email Module — Smoke M Customs
 * Pluggable email service dispatcher managing providers, transactional alerts,
 * and marketing email campaigns.
 */

import type {
  EmailProvider,
  EmailProviderType,
  SendEmailOptions,
  SendEmailResult,
  EmailConfigData,
} from './providers/types.ts';
import { SimulatedEmailProvider } from './providers/simulated.ts';
import { SmtpEmailProvider } from './providers/smtp.ts';
import { ResendEmailProvider } from './providers/resend.ts';
import {
  renderLeadWelcomeEmail,
  renderQuoteNotificationEmail,
  renderBookingConfirmationEmail,
  renderBookingCancelledEmail,
  renderCampaignEmail,
  interpolateEmailTokens,
  generateIcsCalendar,
  renderLuxuryEmailLayout,
} from './templates.ts';

export {
  renderLeadWelcomeEmail,
  renderQuoteNotificationEmail,
  renderBookingConfirmationEmail,
  renderBookingCancelledEmail,
  renderCampaignEmail,
  interpolateEmailTokens,
  generateIcsCalendar,
  renderLuxuryEmailLayout,
};

export interface EmailTemplateConfig {
  key: 'LEAD_WELCOME' | 'QUOTE_SENT' | 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLED';
  subject?: string;
  isEnabled: boolean;
  customBody?: string;
}

// In-memory runtime state with sensible defaults
let activeConfig: EmailConfigData = {
  providerType: (process.env['EMAIL_PROVIDER'] as EmailProviderType) || 'SIMULATED',
  smtpHost: process.env['SMTP_HOST'] || 'smtp-relay.brevo.com',
  smtpPort: Number(process.env['SMTP_PORT']) || 587,
  smtpSecure: process.env['SMTP_SECURE'] === 'true',
  smtpUser: process.env['SMTP_USER'] || '',
  smtpPassword: process.env['SMTP_PASSWORD'] || '',
  resendApiKey: process.env['RESEND_API_KEY'] || '',
  fromName: process.env['EMAIL_FROM_NAME'] || 'Smoke M Customs',
  fromEmail: process.env['EMAIL_FROM_ADDRESS'] || 'concierge@smokecustoms.com',
  replyToEmail: process.env['EMAIL_REPLY_TO'] || 'concierge@smokecustoms.com',
  isEnabled: process.env['EMAIL_NOTIFICATIONS_ENABLED'] !== 'false',
};

const activeTemplates: Record<string, EmailTemplateConfig> = {
  LEAD_WELCOME: { key: 'LEAD_WELCOME', isEnabled: true },
  QUOTE_SENT: { key: 'QUOTE_SENT', isEnabled: true },
  BOOKING_CONFIRMATION: { key: 'BOOKING_CONFIRMATION', isEnabled: true },
  BOOKING_CANCELLED: { key: 'BOOKING_CANCELLED', isEnabled: true },
};

export class EmailService {
  private activeProvider: EmailProvider;

  constructor() {
    this.activeProvider = this.createProvider(activeConfig);
  }

  private createProvider(config: EmailConfigData): EmailProvider {
    switch (config.providerType) {
      case 'SMTP': {
        return new SmtpEmailProvider({
          host: config.smtpHost || '',
          port: config.smtpPort || 587,
          secure: config.smtpSecure,
          user: config.smtpUser || '',
          pass: config.smtpPassword || '',
          fromName: config.fromName,
          fromEmail: config.fromEmail,
        });
      }
      case 'RESEND': {
        const from = `"${config.fromName}" <${config.fromEmail}>`;
        return new ResendEmailProvider(config.resendApiKey || '', from);
      }
      case 'SIMULATED':
      default:
        return new SimulatedEmailProvider();
    }
  }

  getConfig(): EmailConfigData {
    return { ...activeConfig };
  }

  updateConfig(newConfig: Partial<EmailConfigData>): EmailConfigData {
    activeConfig = { ...activeConfig, ...newConfig };
    this.activeProvider = this.createProvider(activeConfig);
    console.log(`[EmailService] Active provider updated to: ${activeConfig.providerType}`);
    return this.getConfig();
  }

  getTemplates(): Record<string, EmailTemplateConfig> {
    return { ...activeTemplates };
  }

  updateTemplate(key: string, updates: Partial<EmailTemplateConfig>): EmailTemplateConfig {
    if (activeTemplates[key]) {
      activeTemplates[key] = { ...activeTemplates[key], ...updates };
    }
    return activeTemplates[key];
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    return this.activeProvider.verifyConnection();
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!activeConfig.isEnabled) {
      console.log('[EmailService] Emails globally disabled in settings. Skipping dispatch.');
      return { success: true, simulated: true };
    }

    return this.activeProvider.send({
      ...options,
      fromName: options.fromName || activeConfig.fromName,
      fromEmail: options.fromEmail || activeConfig.fromEmail,
      replyTo: options.replyTo || activeConfig.replyToEmail || undefined,
    });
  }

  async sendLeadWelcome(params: {
    toEmail: string;
    customerName: string;
    vehicleText?: string;
    leadId: string;
    serviceInterest?: string;
    estimateText?: string;
  }): Promise<SendEmailResult> {
    const tplConfig = activeTemplates['LEAD_WELCOME'];
    if (tplConfig && !tplConfig.isEnabled) {
      return { success: true, simulated: true };
    }

    const rendered = renderLeadWelcomeEmail({
      customerName: params.customerName,
      vehicleText: params.vehicleText,
      leadId: params.leadId,
      serviceInterest: params.serviceInterest,
      estimateText: params.estimateText,
    });

    return this.sendEmail({
      to: params.toEmail,
      subject: tplConfig?.subject || rendered.subject,
      html: rendered.html,
    });
  }

  async sendQuoteReady(params: {
    toEmail: string;
    customerName: string;
    quoteNumber: string;
    totalAmount: string | number;
    items: Array<{ name: string; qty: number; total: number }>;
    quoteUrl: string;
    validUntilFormatted?: string;
  }): Promise<SendEmailResult> {
    const tplConfig = activeTemplates['QUOTE_SENT'];
    if (tplConfig && !tplConfig.isEnabled) {
      return { success: true, simulated: true };
    }

    const rendered = renderQuoteNotificationEmail({
      customerName: params.customerName,
      quoteNumber: params.quoteNumber,
      totalAmount: params.totalAmount,
      items: params.items,
      quoteUrl: params.quoteUrl,
      validUntilFormatted: params.validUntilFormatted,
    });

    return this.sendEmail({
      to: params.toEmail,
      subject: tplConfig?.subject || rendered.subject,
      html: rendered.html,
    });
  }

  async sendBookingConfirmation(params: {
    toEmail: string;
    customerName: string;
    serviceOrPackageName: string;
    appointmentTimeFormatted: string;
    bayName?: string;
    priceQuoted?: string | number;
    vehicleText?: string;
    studioAddress?: string;
    bookingUrl?: string;
    icsContent?: string;
  }): Promise<SendEmailResult> {
    const tplConfig = activeTemplates['BOOKING_CONFIRMATION'];
    if (tplConfig && !tplConfig.isEnabled) {
      return { success: true, simulated: true };
    }

    const rendered = renderBookingConfirmationEmail({
      customerName: params.customerName,
      serviceOrPackageName: params.serviceOrPackageName,
      appointmentTimeFormatted: params.appointmentTimeFormatted,
      bayName: params.bayName,
      priceQuoted: params.priceQuoted,
      vehicleText: params.vehicleText,
      studioAddress: params.studioAddress,
      bookingUrl: params.bookingUrl,
    });

    const attachments = params.icsContent
      ? [
          {
            filename: 'smoke_customs_appointment.ics',
            content: params.icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ]
      : undefined;

    return this.sendEmail({
      to: params.toEmail,
      subject: tplConfig?.subject || rendered.subject,
      html: rendered.html,
      attachments,
    });
  }

  async sendBookingCancelled(params: {
    toEmail: string;
    customerName: string;
    serviceOrPackageName?: string;
    appointmentTimeFormatted: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    const tplConfig = activeTemplates['BOOKING_CANCELLED'];
    if (tplConfig && !tplConfig.isEnabled) {
      return { success: true, simulated: true };
    }

    const rendered = renderBookingCancelledEmail({
      customerName: params.customerName,
      serviceOrPackageName: params.serviceOrPackageName,
      appointmentTimeFormatted: params.appointmentTimeFormatted,
      reason: params.reason,
    });

    return this.sendEmail({
      to: params.toEmail,
      subject: tplConfig?.subject || rendered.subject,
      html: rendered.html,
    });
  }
}

export const emailService = new EmailService();

export * from './providers/types.ts';
export * from './templates.ts';
