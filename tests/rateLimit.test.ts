import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkRateLimit } from '../src/lib/rate-limit.ts';

describe('In-Memory Sliding Token Bucket Rate Limiter (Architecture §19)', () => {
  it('permits initial requests up to token capacity', () => {
    const key = `test-ip-${Date.now()}`;
    const config = { maxTokens: 3, refillRatePerSecond: 0.1, windowMs: 10_000 };

    const first = checkRateLimit(key, config);
    assert.strictEqual(first.allowed, true);
    assert.strictEqual(first.remaining, 2);

    const second = checkRateLimit(key, config);
    assert.strictEqual(second.allowed, true);
    assert.strictEqual(second.remaining, 1);

    const third = checkRateLimit(key, config);
    assert.strictEqual(third.allowed, true);
    assert.strictEqual(third.remaining, 0);

    // 4th request must be throttled
    const fourth = checkRateLimit(key, config);
    assert.strictEqual(fourth.allowed, false);
    assert.strictEqual(fourth.remaining, 0);
    assert.ok(fourth.retryAfterMs && fourth.retryAfterMs > 0);
  });
});
