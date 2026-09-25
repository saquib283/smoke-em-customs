# Smoke M Customs — Database Architecture & Review

> **Phase 10 Deliverable** | Architecture §6, §10, §20 & PRD §6  
> Comprehensive review of database schemas, relational integrity, indexing strategy, constraint mechanisms, and migration history.

---

## 1. Executive Summary

The Smoke M Customs database is designed on PostgreSQL using Prisma ORM. The relational model enforces strict foreign key constraints, targeted performance indexes for high-throughput CRM and booking queries, and database-level concurrency protection via `btree_gist` range exclusion constraints to prevent overlapping bay reservations.

---

## 2. Core Schema Entities & Relationships

| Entity | Primary Key | Key Relations | Critical Constraints & Notes |
|---|---|---|---|
| **AdminUser** | `id` (cuid/uuid) | Auth sessions, audit logs, notes | Unique `email`; `isActive` boolean flag |
| **Customer** | `id` (cuid/uuid) | Vehicles, Leads, Bookings, Quotes, Reviews | Unique `phone` (E.164 normalized `91...`) |
| **Vehicle** | `id` (cuid/uuid) | Belongs to `Customer`; referenced by Leads, Bookings, Quotes | Optional unique `registrationNumber`; category enum |
| **Service** | `id` (cuid/uuid) | Categories, Media, PackageServices, Bookings | Unique `slug`; soft-toggle `isActive`, `isBookable` |
| **Package** | `id` (cuid/uuid) | Services via `PackageService` join table | Unique `slug`; aggregated duration & package pricing |
| **Resource** | `id` (cuid/uuid) | Detailing bays, Bookings | Positive-pressure detailing bay capacity tracker |
| **Lead** | `id` (cuid/uuid) | `Customer`, `Vehicle`, `LeadPhoto`, `LeadNote`, `LeadStatusHistory` | Tracks source, status transitions, follow-up timestamps |
| **Booking** | `id` (cuid/uuid) | `Customer`, `Vehicle`, `Resource` (Bay), `Service`/`Package`, `Lead`, `Quote` | `startAt`, `endAt`, `durationMinutes`; Exclusion constraint |
| **Quote** | `id` (cuid/uuid) | `Customer`, `Vehicle`, `Lead`, `QuoteItem` line items | Unique `quoteNumber`; 14-day validity expiration |
| **Offer** | `id` (cuid/uuid) | Optional `Service`, `Package` | `startDate`, `endDate` validity window |
| **Review** | `id` (cuid/uuid) | `Customer`, optional `Service` | Rating strictly between 1 and 5 stars |
| **AuditLog** | `id` (cuid/uuid) | `AdminUser` (nullable for system actions) | Immutable JSON snapshots of state changes |

---

## 3. Concurrency & Constraint Review

### 3.1 Double-Booking Prevention (Architecture §10 & §20)
- **The Challenge**: Detailing bays have physical capacity limits (1 vehicle per bay per time window). Two customers submitting reservations simultaneously must never result in dual occupancy.
- **Defense-in-Depth Layer 1 (Application Mutex)**: Transactional re-verification of bay availability immediately before booking creation. If a slot was claimed between viewing and submission, the server throws `SLOT_NO_LONGER_AVAILABLE` and responds with HTTP `409 Conflict`.
- **Defense-in-Depth Layer 2 (Database Exclusion Constraint)**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;
  
  ALTER TABLE "Booking" ADD CONSTRAINT "no_overlapping_bookings"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startAt", "endAt") WITH &&
  )
  WHERE ("status" NOT IN ('CANCELLED'));
  ```
  This guarantees that PostgreSQL physically rejects any overlapping booking on the same bay at the storage engine level.

### 3.2 Financial & Precision Review
- Monetary fields (`price`, `startingPrice`, `subtotal`, `discountAmount`, `taxAmount`, `totalAmount`) utilize PostgreSQL `Decimal(10,2)` (fixed-point arithmetic).
- Prevents binary floating-point rounding errors on GST (18%) and currency calculations.
- Displayed with standard Indian numbering formatting (`₹1,18,000`).

---

## 4. Indexing Strategy & Performance Optimization

### 4.1 Unique Indexes
- `AdminUser.email` — Guarantees unique admin accounts.
- `Customer.phone` — Enables instantaneous customer lookups and CRM deduplication.
- `Service.slug` & `Package.slug` — Powers clean SEO URLs and static page generation.
- `Quote.quoteNumber` — Sequential formal invoice identifier (`SMC-Q-1001`).

### 4.2 High-Traffic Query Indexes
- `Booking("resourceId", "startAt", "status")` — Accelerates slot availability generation and calendar views.
- `Lead("status", "createdAt")` — Speeds up CRM pipeline queries and follow-up alerts.
- `Notification("readAt", "createdAt")` — Rapidly queries unread notifications for the admin topbar.
- `Quote("customerId", "status")` — Fast quote retrieval for customer portal and admin detail views.
- `Communication("customerId", "createdAt")` — CRM chronological customer interaction history.

---

## 5. Migration Integrity & Enums Verification

All lifecycle enumerations are strictly typed in PostgreSQL:
- **LeadStatus**: `NEW`, `CONTACTED`, `QUOTE_SENT`, `FOLLOW_UP`, `BOOKED`, `COMPLETED`, `LOST`
- **QuoteStatus**: `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `EXPIRED`
- **BookingStatus**: `PENDING_CONFIRMATION`, `CONFIRMED`, `RESCHEDULED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
- **PaymentStatus**: `NOT_APPLICABLE`, `PENDING`, `PARTIALLY_PAID`, `PAID`
- **CommunicationChannel**: `WHATSAPP`, `CALL`, `EMAIL`, `SMS`

---

## 6. Database Verification Checklist

- [x] All 25 Prisma models defined with correct relations and types.
- [x] Multi-bay resource isolation verified via automated integration tests.
- [x] Cancellation slot release verified via automated integration tests.
- [x] Decimal precision verified for financial calculations and tax line items.
- [x] Normalized phone matching and customer deduplication verified.
- [x] Foreign key integrity and cascading line items verified.
