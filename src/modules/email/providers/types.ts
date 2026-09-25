/**
 * Email Provider Types & Abstractions — Smoke M Customs
 * Pluggable architecture allowing seamless transitions between
 * Simulated testing, Brevo/Gmail SMTP, and Cloud API providers.
 */

export type EmailProviderType = 'SIMULATED' | 'SMTP' | 'RESEND';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string; // For Ethereal preview links
  simulated?: boolean;
  error?: string;
}

export interface EmailConfigData {
  providerType: EmailProviderType;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  resendApiKey?: string | null;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  isEnabled: boolean;
}

export interface EmailProvider {
  name: string;
  type: EmailProviderType;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  verifyConnection(): Promise<{ success: boolean; error?: string }>;
}
