# Smoke M Customs — Security Review & Audit Checklist

> **Phase 10 Deliverable** | Architecture §14, §17, §19 & PRD §17  
> Comprehensive audit covering authentication, authorization, injection defense, cryptographic safeguards, storage security, and compliance.

---

## 1. Executive Summary

A multi-layered defense-in-depth architecture secures the Smoke M Customs platform across both administrative operations and customer self-service workflows. All database interactions utilize Prisma parameterized queries, administrative routes are protected by Auth.js v5 JWT middleware, customer sessions employ constant-time verified HMAC-SHA256 signatures, and public endpoints enforce sliding token-bucket rate limiting.

---

## 2. Security Review Matrix

| Domain | Control Mechanism | Specification Reference | Status |
|---|---|---|---|
| **Admin Authentication** | Auth.js v5 Credentials provider with `bcryptjs` hashing (10 salt rounds) | Architecture §14 | **VERIFIED** |
| **Admin Authorization** | Middleware route guard protecting all `/admin/*` routes; Role tracking (`SUPER_ADMIN`, `ADMIN`, `STAFF`) | Architecture §14 | **VERIFIED** |
| **Customer Authentication** | Passwordless phone + 6-digit OTP (10m TTL); HMAC-SHA256 signed session tokens (7d validity) | PRD §17 | **VERIFIED** |
| **Timing Attack Defense** | `crypto.timingSafeEqual` for cryptographic token signature comparison | PRD §17 & Architecture §14 | **VERIFIED** |
| **SQL Injection Prevention** | 100% Prisma typed ORM with parameterized queries; zero raw string SQL interpolation | Architecture §6 | **VERIFIED** |
| **Cross-Site Scripting (XSS)** | React JSX HTML entity escaping; strict Content-Type headers | Architecture §14 | **VERIFIED** |
| **Rate Limiting (DoS)** | In-memory sliding token bucket on `/api/quote`, `/api/bookings`, and `/api/portal/otp` | Architecture §19 | **VERIFIED** |
| **File Upload Security** | Strict MIME whitelist (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`); 50MB file size ceiling; UUID filenames | Architecture §14 | **VERIFIED** |
| **Audit Logging** | Immutable `AuditLog` records for all administrative mutations (before/after state diffs) | Architecture §17 | **VERIFIED** |
| **Data Protection** | Inactive admin accounts automatically blocked; customer records matched by normalized E.164 phone | Architecture §11 | **VERIFIED** |

---

## 3. Detailed Security Domain Audits

### 3.1 Authentication & Credential Management
- **Administrative Credentials**:
  - Admin passwords are never persisted in plaintext.
  - Hashed using `bcrypt` with salt rounds = 10 (`bcrypt.compare` validation).
  - Admin accounts feature an `isActive` boolean flag checked on every login attempt. Deactivated staff cannot authenticate regardless of credential validity.
  - Session strategy: JWT with an 8-hour strict expiration window (`maxAge: 8 * 60 * 60`).
- **Customer Self-Service Portal**:
  - Employs passwordless phone verification to eliminate credential stuffing risk.
  - 6-digit OTP codes expire after 10 minutes (`OTP_TTL_MS = 600,000`).
  - Upon successful verification, the single-use OTP is deleted immediately from memory.
  - Session tokens are constructed as `base64url(payload).base64url(hmac-sha256(payload, AUTH_SECRET))` with constant-time equality validation.

### 3.2 Access Control & Route Guarding
- **Next.js Middleware**:
  - Intercepts requests before reaching page components.
  - Redirects unauthenticated traffic attempting to access `/admin/*` (excluding `/admin/login`) back to the login portal with return URL preservation.
  - Client portal routes (`/portal`) enforce customer session header/cookie checks.

### 3.3 Rate Limiting & Abuse Prevention
In-memory sliding window rate limiters protect high-exposure public endpoints:
- `checkQuoteRequestLimit`: Max 5 requests per 15-minute window per IP.
- `checkPublicFormLimit`: Max 10 requests per 10-minute window per IP.
- `checkCustomerOtpLimit`: Max 3 OTP dispatch attempts per 10-minute window per IP.
- Rate limit headers returned: `429 Too Many Requests` on threshold breach.

### 3.4 Media Upload & Storage Security
- Media uploads via `/api/uploads/sign` enforce server-side validation:
  1. **MIME Verification**: Strictly permits `image/jpeg`, `image/png`, `image/webp`, and `video/mp4`. Rejects SVG (preventing embedded XML script execution) and HTML/executable types.
  2. **Size Enforcement**: Payload size checked against 50MB ceiling.
  3. **Path Traversal Prevention**: File keys are generated via `crypto.randomUUID()`, completely decoupling disk storage names from user-supplied filenames.

### 3.5 Database Integrity & Injection Safeguards
- All database queries are executed via Prisma's typed query engine, which uses parameterized queries across all database drivers.
- Input data types are strictly coerced via TypeScript interfaces and validated before database persistence.

### 3.6 Audit Trail & Tamper Evidence
- Administrative state mutations (service changes, quote generation, booking cancellations, lead status transitions) emit structured audit logs to the `AuditLog` table.
- Logs capture actor identity (`userId`), target entity (`entityType`, `entityId`), action type (`CREATE`, `UPDATE`, `DELETE`), and complete JSON before/after snapshots.

---

## 4. Security Verification Checklist

- [x] All 75 unit, integration, and security tests passing.
- [x] Bcrypt password hashing verified with negative test vectors.
- [x] Deactivated account login rejection verified.
- [x] Cryptographic HMAC session verification with timing attack defense verified.
- [x] Token tampering and expired token rejection verified.
- [x] In-memory rate limiting capacity enforcement verified.
- [x] Safe file upload MIME and size bounds verified.
- [x] Zero hardcoded secrets in production code; all keys sourced from environment variables.
