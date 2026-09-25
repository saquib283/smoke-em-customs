/**
 * SMTP Email Provider — Smoke M Customs
 * Connects to standard SMTP services using Nodemailer.
 * Compatible with Brevo (Sendinblue) free tier (300/day free), Gmail SMTP, Mailgun, or Amazon SES.
 */

import nodemailer from 'nodemailer';
import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types.ts';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  fromName?: string;
  fromEmail?: string;
}

export class SmtpEmailProvider implements EmailProvider {
  name = 'SMTP Email Provider';
  type = 'SMTP' as const;
  private config: SmtpConfig;
  private transporter: nodemailer.Transporter | null = null;

  constructor(config: SmtpConfig) {
    this.config = config;
    this.initTransporter();
  }

  private initTransporter(): void {
    if (!this.config.host || !this.config.user) {
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port || 587,
      secure: this.config.secure ?? (this.config.port === 465),
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'SMTP transporter is not configured. Please verify SMTP host and credentials in Admin Settings.',
      };
    }

    try {
      const fromName = options.fromName || this.config.fromName || 'Smoke M Customs Concierge';
      const fromEmail = options.fromEmail || this.config.fromEmail || this.config.user;

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        simulated: false,
      };
    } catch (err: any) {
      console.error('[SmtpEmailProvider] Send failure:', err);
      return {
        success: false,
        error: err.message || 'SMTP dispatch failed.',
      };
    }
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'SMTP host or credentials missing' };
    }
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'SMTP verification failed' };
    }
  }
}
