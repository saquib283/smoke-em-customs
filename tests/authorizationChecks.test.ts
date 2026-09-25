import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/* ─── Simulated Admin Auth Helpers (mirroring src/lib/auth.ts) ─── */

interface SimulatedAdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  isActive: boolean;
}

async function simulateAdminAuthorize(
  credentials: { email?: string; password?: string } | null,
  userDatabase: SimulatedAdminUser[]
) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = userDatabase.find((u) => u.email.toLowerCase() === credentials.email!.toLowerCase());
  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function simulateAdminRouteGuard(pathname: string, sessionUser: { id: string; role: string } | null): boolean {
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage && !sessionUser) {
    return false;
  }
  return true;
}

/* ─── Simulated Customer Token Auth Helpers (mirroring src/lib/customer-auth.ts) ─── */

const TEST_SECRET = 'smc_test_secret_for_auth_verification_key_32_bytes_len';

interface CustomerSessionPayload {
  customerId: string;
  phone: string;
  name: string;
  exp: number;
}

function createCustomerToken(payload: CustomerSessionPayload, secret = TEST_SECRET): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyCustomerToken(token: string, secret = TEST_SECRET): CustomerSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload: CustomerSessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

describe('Authorization & Security Checks (Architecture §14 & PRD §17)', () => {
  it('authenticates valid admin credentials with bcrypt hashing', async () => {
    const passwordHash = await bcrypt.hash('SmokeMCustoms2024!', 10);
    const users: SimulatedAdminUser[] = [
      {
        id: 'admin-1',
        email: 'admin@smokecustoms.com',
        name: 'Lead Detailer',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    ];

    // Correct password
    const result = await simulateAdminAuthorize(
      { email: 'admin@smokecustoms.com', password: 'SmokeMCustoms2024!' },
      users
    );
    assert.ok(result);
    assert.strictEqual(result.id, 'admin-1');
    assert.strictEqual(result.role, 'ADMIN');

    // Incorrect password
    const badPass = await simulateAdminAuthorize(
      { email: 'admin@smokecustoms.com', password: 'WrongPassword123' },
      users
    );
    assert.strictEqual(badPass, null);

    // Missing credentials
    const missing = await simulateAdminAuthorize({ email: '' }, users);
    assert.strictEqual(missing, null);
  });

  it('rejects deactivated/inactive admin accounts even with correct credentials', async () => {
    const passwordHash = await bcrypt.hash('ActivePass123', 10);
    const users: SimulatedAdminUser[] = [
      {
        id: 'admin-disabled',
        email: 'former_staff@smokecustoms.com',
        name: 'Former Staff',
        passwordHash,
        role: 'STAFF',
        isActive: false, // Inactive
      },
    ];

    const result = await simulateAdminAuthorize(
      { email: 'former_staff@smokecustoms.com', password: 'ActivePass123' },
      users
    );
    assert.strictEqual(result, null);
  });

  it('enforces route-level authorization for admin paths', () => {
    const loggedInAdmin = { id: 'admin-1', role: 'ADMIN' };

    // Public routes accessible to everyone
    assert.strictEqual(simulateAdminRouteGuard('/', null), true);
    assert.strictEqual(simulateAdminRouteGuard('/services', null), true);
    assert.strictEqual(simulateAdminRouteGuard('/book', null), true);
    assert.strictEqual(simulateAdminRouteGuard('/quotes/quote-123', null), true);

    // Admin login page accessible to unauthenticated users
    assert.strictEqual(simulateAdminRouteGuard('/admin/login', null), true);

    // Admin protected routes blocked without session
    assert.strictEqual(simulateAdminRouteGuard('/admin', null), false);
    assert.strictEqual(simulateAdminRouteGuard('/admin/leads', null), false);
    assert.strictEqual(simulateAdminRouteGuard('/admin/bookings', null), false);
    assert.strictEqual(simulateAdminRouteGuard('/admin/settings', null), false);

    // Admin protected routes permitted with session
    assert.strictEqual(simulateAdminRouteGuard('/admin', loggedInAdmin), true);
    assert.strictEqual(simulateAdminRouteGuard('/admin/leads', loggedInAdmin), true);
    assert.strictEqual(simulateAdminRouteGuard('/admin/bookings', loggedInAdmin), true);
  });

  it('issues and verifies cryptographic HMAC customer session tokens', () => {
    const now = Date.now();
    const payload: CustomerSessionPayload = {
      customerId: 'cust-888',
      phone: '919876543210',
      name: 'Rohan Sharma',
      exp: now + 60 * 60 * 1000, // 1 hour ahead
    };

    const token = createCustomerToken(payload);
    assert.ok(typeof token === 'string' && token.includes('.'));

    // Verified correctly
    const verified = verifyCustomerToken(token);
    assert.ok(verified);
    assert.strictEqual(verified.customerId, 'cust-888');
    assert.strictEqual(verified.phone, '919876543210');
    assert.strictEqual(verified.name, 'Rohan Sharma');
  });

  it('detects token tampering and invalid signatures', () => {
    const payload: CustomerSessionPayload = {
      customerId: 'cust-888',
      phone: '919876543210',
      name: 'Rohan Sharma',
      exp: Date.now() + 60 * 60 * 1000,
    };

    const token = createCustomerToken(payload);
    const [payloadB64, signature] = token.split('.');

    // Tampered payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, customerId: 'cust-hacked-999' })
    ).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${signature}`;

    assert.strictEqual(verifyCustomerToken(tamperedToken), null);

    // Signed with wrong secret
    const foreignToken = createCustomerToken(payload, 'different_attacker_secret_key');
    assert.strictEqual(verifyCustomerToken(foreignToken), null);

    // Malformed token structure
    assert.strictEqual(verifyCustomerToken('malformed_no_dot_string'), null);
    assert.strictEqual(verifyCustomerToken('part1.part2.part3'), null);
  });

  it('rejects expired customer tokens', () => {
    const expiredPayload: CustomerSessionPayload = {
      customerId: 'cust-888',
      phone: '919876543210',
      name: 'Rohan Sharma',
      exp: Date.now() - 5000, // Expired 5 seconds ago
    };

    const expiredToken = createCustomerToken(expiredPayload);
    assert.strictEqual(verifyCustomerToken(expiredToken), null);
  });
});
