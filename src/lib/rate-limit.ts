/**
 * In-memory rate limiter.
 * Uses a sliding-window token bucket approach.
 * Architecture §19
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number;
  refillRatePerSecond: number;
  windowMs?: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries
const CLEANUP_INTERVAL = 60_000; // 1 minute
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(windowMs: number) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.lastRefill > windowMs * 2) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Don't block process exit
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check if a request should be rate-limited.
 * @returns Object with allowed status and remaining tokens
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const { maxTokens, refillRatePerSecond, windowMs = 60_000 } = config;
  const now = Date.now();

  startCleanup(windowMs);

  let entry = store.get(key);

  if (!entry) {
    entry = { tokens: maxTokens - 1, lastRefill: now };
    store.set(key, entry);
    return { allowed: true, remaining: entry.tokens };
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - entry.lastRefill) / 1000;
  const refill = Math.floor(elapsed * refillRatePerSecond);

  if (refill > 0) {
    entry.tokens = Math.min(maxTokens, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return { allowed: true, remaining: entry.tokens };
  }

  // Calculate when next token is available
  const retryAfterMs = Math.ceil((1 / refillRatePerSecond) * 1000);
  return { allowed: false, remaining: 0, retryAfterMs };
}

// ─── Preconfigured Limiters ───

/** Public form submissions: 5 per minute per IP */
export function checkPublicFormLimit(ip: string) {
  return checkRateLimit(`form:${ip}`, {
    maxTokens: 5,
    refillRatePerSecond: 5 / 60,
  });
}

/** Public quote requests: 3 per minute per IP */
export function checkQuoteRequestLimit(ip: string) {
  return checkRateLimit(`quote:${ip}`, {
    maxTokens: 3,
    refillRatePerSecond: 3 / 60,
  });
}

/** Admin API: 60 per minute per session */
export function checkAdminApiLimit(sessionId: string) {
  return checkRateLimit(`admin:${sessionId}`, {
    maxTokens: 60,
    refillRatePerSecond: 1,
  });
}
