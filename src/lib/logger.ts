/**
 * Structured logger.
 * In production, outputs JSON lines for machine parsing.
 * In development, outputs human-readable formatted logs.
 * Architecture §18
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env['LOG_LEVEL'] as LogLevel) || 'info';
const isProduction = process.env['NODE_ENV'] === 'production';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: Error;
  timestamp: string;
}

function formatEntry(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify({
      level: entry.level,
      msg: entry.message,
      ctx: entry.context,
      ...entry.data,
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        },
      }),
      ts: entry.timestamp,
    });
  }

  const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase().padEnd(5)}`;
  const ctx = entry.context ? ` [${entry.context}]` : '';
  const dataStr =
    entry.data && Object.keys(entry.data).length > 0
      ? ` ${JSON.stringify(entry.data)}`
      : '';
  const errorStr = entry.error ? `\n  Error: ${entry.error.message}\n  ${entry.error.stack}` : '';

  return `${prefix}${ctx} ${entry.message}${dataStr}${errorStr}`;
}

function log(
  level: LogLevel,
  message: string,
  contextOrData?: string | Record<string, unknown>,
  data?: Record<string, unknown>,
) {
  if (!shouldLog(level)) return;

  const context = typeof contextOrData === 'string' ? contextOrData : undefined;
  const logData = typeof contextOrData === 'object' ? contextOrData : data;

  const entry: LogEntry = {
    level,
    message,
    context,
    data: logData,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Create a logger scoped to a module/context.
 */
export function createLogger(context: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, context, data),
    info: (msg: string, data?: Record<string, unknown>) => log('info', msg, context, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, context, data),
    error: (msg: string, error?: Error | Record<string, unknown>, data?: Record<string, unknown>) => {
      if (error instanceof Error) {
        const entry: LogEntry = {
          level: 'error',
          message: msg,
          context,
          data,
          error,
          timestamp: new Date().toISOString(),
        };
        console.error(formatEntry(entry));
      } else {
        log('error', msg, context, error);
      }
    },
  };
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, error?: Error | Record<string, unknown>) => {
    if (error instanceof Error) {
      const entry: LogEntry = {
        level: 'error',
        message: msg,
        error,
        timestamp: new Date().toISOString(),
      };
      console.error(formatEntry(entry));
    } else {
      log('error', msg, error);
    }
  },
};
