/**
 * Environment configuration with runtime validation.
 * Reads from process.env and provides typed access.
 * Architecture §21
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function optionalEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: ${value}`);
  }
  return parsed;
}

function optionalEnvBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value === 'true' || value === '1';
}

export const env = {
  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Auth
  AUTH_SECRET: requireEnv('AUTH_SECRET'),
  AUTH_URL: optionalEnv('AUTH_URL', 'http://localhost:3000'),

  // Storage
  STORAGE_PROVIDER: optionalEnv('STORAGE_PROVIDER', 'local') as 'local' | 's3',
  STORAGE_BUCKET: process.env['STORAGE_BUCKET'],
  STORAGE_REGION: process.env['STORAGE_REGION'],
  STORAGE_ACCESS_KEY_ID: process.env['STORAGE_ACCESS_KEY_ID'],
  STORAGE_SECRET_ACCESS_KEY: process.env['STORAGE_SECRET_ACCESS_KEY'],
  STORAGE_PUBLIC_CDN_URL: process.env['STORAGE_PUBLIC_CDN_URL'],

  // WhatsApp Cloud API
  WHATSAPP_BUSINESS_PHONE: optionalEnv('WHATSAPP_BUSINESS_PHONE', ''),
  WHATSAPP_API_ENABLED: optionalEnvBool('WHATSAPP_API_ENABLED', false),
  WHATSAPP_PHONE_NUMBER_ID: optionalEnv('WHATSAPP_PHONE_NUMBER_ID', ''),
  WHATSAPP_ACCESS_TOKEN: optionalEnv('WHATSAPP_ACCESS_TOKEN', ''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: optionalEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'smoke_customs_whatsapp_verify_token_2024'),
  WHATSAPP_APP_SECRET: optionalEnv('WHATSAPP_APP_SECRET', ''),

  // Booking
  BOOKING_DEFAULT_BUFFER_MINUTES: optionalEnvInt('BOOKING_DEFAULT_BUFFER_MINUTES', 15),
  BOOKING_MIN_LEAD_TIME_MINUTES: optionalEnvInt('BOOKING_MIN_LEAD_TIME_MINUTES', 120),
  BOOKING_SLOT_GRANULARITY_MINUTES: optionalEnvInt('BOOKING_SLOT_GRANULARITY_MINUTES', 30),

  // Rate Limiting
  RATE_LIMIT_STORE: optionalEnv('RATE_LIMIT_STORE', 'memory') as 'memory',

  // Logging
  LOG_LEVEL: optionalEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',

  // Recommendation
  RECOMMENDATION_ENGINE: optionalEnv('RECOMMENDATION_ENGINE', 'rules') as 'rules',

  // Node
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  IS_PRODUCTION: process.env['NODE_ENV'] === 'production',
} as const;
