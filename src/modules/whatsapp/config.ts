/**
 * WhatsApp Cloud API Configuration Manager
 * Architecture §15 & PRD §14, §15
 * Manages dynamic WhatsApp credentials, workflow triggers, and sandbox/live toggle.
 */

export interface WhatsAppConfig {
  isEnabled: boolean;
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  webhookVerifyToken: string;
  studioBusinessPhone: string;
  autoSendLeadWelcome: boolean;
  autoSendQuoteNotification: boolean;
  autoSendBookingConfirmation: boolean;
  autoSendBookingCancellation: boolean;
}

// Initialize with environment defaults
let currentConfig: WhatsAppConfig = {
  isEnabled: process.env['WHATSAPP_API_ENABLED'] === 'true' || process.env['WHATSAPP_API_ENABLED'] === '1',
  phoneNumberId: process.env['WHATSAPP_PHONE_NUMBER_ID'] || '',
  accessToken: process.env['WHATSAPP_ACCESS_TOKEN'] || '',
  appSecret: process.env['WHATSAPP_APP_SECRET'] || '',
  webhookVerifyToken: process.env['WHATSAPP_WEBHOOK_VERIFY_TOKEN'] || 'smokecustoms_meta_token_secret',
  studioBusinessPhone: '+91 98765 43210',
  autoSendLeadWelcome: true,
  autoSendQuoteNotification: true,
  autoSendBookingConfirmation: true,
  autoSendBookingCancellation: true,
};

/**
 * Returns current active WhatsApp configuration
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  return { ...currentConfig };
}

/**
 * Updates WhatsApp configuration
 */
export function updateWhatsAppConfig(newConfig: Partial<WhatsAppConfig>): WhatsAppConfig {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
  };

  return { ...currentConfig };
}
