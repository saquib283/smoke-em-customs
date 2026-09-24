# ARCHITECTURE.md — Smoke M Customs
## Technical Architecture Specification

**Related docs:** `PRD.md`, `DESIGN.md`
**Architectural style:** Modular monolith, Next.js App Router, PostgreSQL, server-first rendering with server actions for mutations.

---

## 1. System Architecture (Overview)

```
                         ┌────────────────────────────┐
                         │         Browser             │
                         │  (Customer / Admin, SSR +   │
                         │   client islands)            │
                         └───────────┬─────────────────┘
                                     │ HTTPS
                         ┌───────────▼─────────────────┐
                         │   Next.js App (single app)   │
                         │  ─────────────────────────   │
                         │  Route Groups:                │
                         │   (public)  (admin)  (api)    │
                         │  Server Components + Actions   │
                         │  Route Handlers (webhooks,     │
                         │  signed uploads)                │
                         └──────┬───────────┬────────────┘
                                │           │
                 ┌──────────────┘           └───────────────┐
                 ▼                                           ▼
      ┌─────────────────────┐                     ┌───────────────────────┐
      │   PostgreSQL (RDS/   │                     │  Object Storage        │
      │   managed Postgres)  │                     │  (S3-compatible)       │
      │   via Prisma ORM     │                     │  + CDN in front        │
      └─────────────────────┘                     └───────────────────────┘
                 │
                 │ (future/optional)
                 ▼
      ┌─────────────────────────────────────────────────────────┐
      │  External integration boundary (adapters, not core deps)   │
      │   - WhatsApp: deep-link (MVP) / Business API (Phase 2)     │
      │   - Recommendation: rules engine (MVP) / AI (Phase 3)      │
      │   - Payments: none (MVP) / gateway (Phase 2)                │
      └─────────────────────────────────────────────────────────┘
```

**Why a modular monolith:** The brief explicitly asks not to over-engineer. A single Next.js deployment with a well-factored internal module structure gives us one deployable unit, one database, simple transactional integrity for booking (critical — see §9), and low operational overhead, while the *internal* boundaries (booking engine, CRM, notifications, media, AI, WhatsApp) are still cleanly separated modules with explicit interfaces. This lets any individual concern (e.g., swap notification channel, swap storage provider, swap recommendation logic) change independently without a service-mesh rewrite. Microservices are explicitly rejected: this application has one primary write path (bookings) that benefits from being co-located with its data in a single ACID-transactional database, and the team/traffic scale does not justify distributed-systems overhead.

## 2. Application Architecture

- **Framework:** Next.js (latest stable), App Router, TypeScript throughout (strict mode).
- **Rendering strategy:**
  - Public marketing/catalogue pages: React Server Components, mostly static-at-build or ISR (revalidate on content change via on-demand revalidation triggered from admin mutations) for performance + SEO.
  - Transactional pages (`/quote`, `/book/*`, `/booking/[id]`): dynamic server-rendered, with client components for interactive slot pickers/multi-step forms.
  - Admin app: fully dynamic, server-rendered with client islands for calendar interactivity, protected by middleware.
- **Data mutations:** **Server Actions** are the default mutation mechanism (form submissions: quote, booking, admin CRUD) — colocated with the components that use them, reducing bespoke API surface. **Route Handlers** (`app/api/...`) are used only where a true HTTP endpoint is required: signed media upload URLs, future webhook receivers (payment gateway, WhatsApp Business API callbacks), and any endpoint intended for non-browser consumption. This dual approach is a deliberate architectural decision (see ADR-1, §20).
- **ORM:** **Prisma**. Chosen (over Drizzle) for: mature migration tooling (`prisma migrate`), generated types matching our TypeScript-first requirement, wide familiarity for a coding agent to safely extend the schema, and first-class support for the constraint patterns we need (composite unique constraints, cascading rules). Drizzle would be an equally valid choice; Prisma is selected for tooling maturity and lower onboarding risk for automated implementation.
- **Validation:** **Zod** schemas shared between client (form validation) and server (server action/route handler validation) — single source of truth per entity's input shape.
- **Package structure:** monorepo-free, single Next.js app; internal modules under `src/modules/*` (see Folder Structure).

## 3. Folder Structure

```
smoke-m-customs/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                      # /
│   │   │   ├── services/
│   │   │   │   ├── page.tsx                  # /services
│   │   │   │   └── [slug]/page.tsx           # /services/[slug]
│   │   │   ├── packages/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── gallery/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── offers/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── quote/page.tsx                # Car Requirement Form
│   │   │   ├── book/
│   │   │   │   ├── page.tsx                  # service/package picker
│   │   │   │   └── [service]/page.tsx        # date+slot+details
│   │   │   ├── booking/[id]/page.tsx         # confirmation/status (read-only)
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── layout.tsx                    # auth guard + shell
│   │   │   ├── page.tsx                      # dashboard
│   │   │   ├── leads/{page.tsx,[id]/page.tsx}
│   │   │   ├── customers/{page.tsx,[id]/page.tsx}
│   │   │   ├── vehicles/{page.tsx,[id]/page.tsx}
│   │   │   ├── quotes/{page.tsx,[id]/page.tsx}
│   │   │   ├── bookings/{page.tsx,[id]/page.tsx}
│   │   │   ├── calendar/page.tsx
│   │   │   ├── services/{page.tsx,[id]/page.tsx,new/page.tsx}
│   │   │   ├── packages/{page.tsx,[id]/page.tsx,new/page.tsx}
│   │   │   ├── gallery/{page.tsx,[id]/page.tsx,new/page.tsx}
│   │   │   ├── reviews/{page.tsx,[id]/page.tsx}
│   │   │   ├── offers/{page.tsx,[id]/page.tsx,new/page.tsx}
│   │   │   ├── resources/page.tsx             # bays, business hours, blocked dates
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── uploads/sign/route.ts          # signed upload URL issuance
│   │       ├── webhooks/whatsapp/route.ts     # Phase 2 stub
│   │       ├── webhooks/payments/route.ts     # Phase 2 stub
│   │       └── health/route.ts
│   ├── modules/
│   │   ├── booking/                           # slot generation, booking CRUD, conflict checks
│   │   ├── crm/                                # lead pipeline logic
│   │   ├── quote/                              # quote lifecycle + estimate rules engine
│   │   ├── catalogue/                          # services, packages
│   │   ├── gallery/
│   │   ├── reviews/
│   │   ├── offers/
│   │   ├── customers/                          # customer + vehicle matching/creation
│   │   ├── notifications/                      # event bus + channel adapters
│   │   ├── media/                              # storage abstraction
│   │   ├── whatsapp/                           # deep-link builder + API adapter boundary
│   │   ├── recommendation/                     # RecommendationEngine interface + rules impl
│   │   ├── audit/
│   │   └── auth/
│   ├── lib/
│   │   ├── db.ts                               # Prisma client singleton
│   │   ├── env.ts                              # typed/validated env access
│   │   ├── logger.ts
│   │   └── rate-limit.ts
│   ├── components/
│   │   ├── ui/                                 # design-system primitives (see DESIGN.md)
│   │   ├── public/
│   │   └── admin/
│   └── middleware.ts                           # admin route guard
├── public/
├── .env.example
└── package.json
```

Each `src/modules/<name>` exposes a small, explicit TypeScript interface (`index.ts`) consumed by `app/` route/server-action code — route/page code never reaches into another module's internals or the Prisma client directly for cross-cutting concerns (e.g., booking creation always goes through `modules/booking`, never ad hoc `prisma.booking.create` calls scattered in route files). This is the internal modular-monolith boundary discipline that keeps the single deployable maintainable and future-splittable if ever needed.

## 4. Frontend Architecture

- Server Components by default; `"use client"` only for interactive leaf components (multi-step form state, slot picker, calendar drag/drop, image upload preview, filters).
- Shared **design-system component library** (`src/components/ui`) implementing tokens defined in `DESIGN.md` — Button, Card, Input, Select, DatePicker, Modal, Table, Badge, Toast, EmptyState, Skeleton/Loading, FormField, StepIndicator, CalendarGrid.
- Public forms (`/quote`, `/book/[service]`) use **React Hook Form** + the shared Zod schemas for client-side validation mirroring server validation, with optimistic step transitions but server-validated final submission via Server Action.
- Client-global state is intentionally minimal — no global state manager required; server state via RSC + server actions + `revalidatePath`/`revalidateTag` is sufficient for this app's data-flow profile. Local/component state (multi-step form, calendar view state) uses React state/URL search params (so state like selected date/view is shareable/bookmarkable, e.g., `/admin/calendar?view=week&date=2026-09-28`).
- Image handling via `next/image` with the media module's abstraction providing final CDN URLs.

## 5. Backend Architecture

- **Server Actions** (in `modules/*/actions.ts`, re-exported and called from page/component code) handle all customer- and admin-initiated mutations: quote submission, booking creation/reschedule/cancel, lead status changes, catalogue CRUD, gallery/review/offer CRUD.
- Every server action: (1) validates input with the module's Zod schema, (2) checks authorization (admin session for admin actions; public actions are rate-limited, not session-gated), (3) executes business logic via the module's service function (not raw Prisma calls inline), (4) wraps multi-step writes in a Prisma `$transaction`, (5) triggers relevant notification events, (6) calls `revalidatePath`/`revalidateTag` for affected public pages, (7) returns a typed result (`{ ok: true, data }` or `{ ok: false, fieldErrors }`) consumed by the client form.
- **Route Handlers** are reserved for: signed upload URL issuance (`/api/uploads/sign`), inbound webhooks (Phase 2 WhatsApp/payment callbacks — stubbed now, returning 501/not-configured), and a `/api/health` liveness endpoint for deployment platform checks.
- Business logic (booking slot generation, lead pipeline transitions, quote estimate rules, notification dispatch) lives in `src/modules/*`, is framework-agnostic (plain TypeScript, testable in isolation), and is called by both server actions and (if ever needed) route handlers — no logic duplication between the two invocation styles.

## 6. Database Architecture

### 6.1 Design principles
- PostgreSQL, accessed via Prisma.
- Soft-deletion (`deletedAt` nullable timestamp) on entities that may be historically referenced after removal from public view: `Service`, `Package`, `GalleryItem`, `Review`, `Offer`. Hard delete is avoided for these to preserve referential history on past leads/bookings/quotes (see PRD EC-2, EC-7).
- `Customer`, `Vehicle`, `Lead`, `Quote`, `Booking` are never hard- or soft-deleted by normal operation (business records); only explicitly reversible status fields change.
- All tables carry `id` (UUID, default `gen_random_uuid()` via `pgcrypto`/`gen_random_uuid()`), `createdAt`, `updatedAt` (audit fields).
- Enums are modeled as Prisma/Postgres enums for statuses (type-safety + query performance over free-text).
- Money is stored as `Int` (minor units — paise) or `Decimal` with fixed precision — **[ASSUMPTION: `Decimal(10,2)` in rupees]** to avoid floating-point currency bugs while keeping the schema human-readable.

### 6.2 Entity list and rationale

Evaluated against the brief's suggested entity list — kept, merged, or deferred as noted:

| Entity | Decision | Rationale |
|---|---|---|
| `User` (admin login identity) | **Kept**, named `AdminUser` | Separates "person who can log in" from "customer" cleanly; avoids overloading one `User` table with two very different concerns (auth vs. CRM subject). |
| `Admin` | **Merged into `AdminUser`** | The brief's `User`/`Admin` split isn't needed while there is one role; `AdminUser.role` enum (`ADMIN` now, extensible) covers Phase 2 role expansion without a schema split. |
| `Customer` | **Kept** | Core CRM subject. |
| `Vehicle` | **Kept**, FK to `Customer` | A customer may have multiple vehicles (PRD EC-6). |
| `Service` | **Kept** | Admin-managed catalogue item, not hardcoded (PRD FR-32). |
| `Package` | **Kept** | Admin-managed bundle. |
| `PackageService` | **Kept** (join table) | Many-to-many `Package`↔`Service` with no extra attributes beyond the relation itself. |
| `Lead` | **Kept** | Pipeline entity distinct from `Customer` (a customer can generate multiple leads over time — e.g., PPF this year, ceramic coating next year). |
| `LeadStatus` | **Modeled as enum on `Lead`**, not a separate table | Fixed, small status set defined in PRD §8.4; a separate table would only be needed if statuses became admin-configurable, which is out of scope. `LeadStatusHistory` (see below) captures the audit trail instead. |
| `Quote` | **Kept** | Formal admin-issued pricing document. |
| `QuoteItem` | **Kept** (line items) | Supports itemized quotes (e.g., "Ceramic coating ₹18,000 + add-on ₹2,000"). |
| `Booking` | **Kept** | The confirmed/pending appointment. |
| `BookingItem` | **Not modeled separately** — folded into `Booking.serviceId` / `Booking.packageId` (nullable, exactly one set) | The brief's `BookingItem` implies multiple line items per booking; for a detailing appointment, one booking = one service **or** one package (a customer wanting two services books two appointments, or a package is created to bundle them). This significantly simplifies slot-duration math (duration is a single well-defined value per booking) without losing any required functionality. If multi-item bookings are needed later, `BookingItem` can be introduced as an additive schema change. |
| `Appointment` | **Not modeled separately from `Booking`** | The brief lists both; in this domain they are the same concept (a booking *is* the appointment). Merging avoids a redundant 1:1 table. |
| `Availability` | **Derived, not stored** | Availability is computed at request-time from `BusinessHours` − `BlockedDate`/`BlockedTimeRange` − existing `Booking`s, per resource. Storing precomputed availability would be a denormalized cache we don't need at this traffic scale (see §9 for the algorithm) and would risk drift from source data. |
| `BusinessHours` | **Kept** | Per-day-of-week (0–6) open/close windows, supports multiple rows per day for split shifts. |
| `BlockedDate` | **Kept** | Full-day closures (holidays). |
| `BlockedTimeRange` | **Kept** (new, not explicitly named in brief but required by BR-2) | Partial-day blocks, optionally scoped to a specific `Resource`. |
| `Resource`/`Bay` | **Kept**, named `Resource` | Generalizes "bay" so future resource types (e.g., a second detailing bay, a PPF-only bay) are just more rows. |
| `GalleryItem` | **Kept** | Before/after + video showcase. |
| `Review` | **Kept** | Testimonials. |
| `Offer` | **Kept** | Promotions. |
| `Notification` | **Kept**, admin-facing feed | Persisted so the admin notification feed survives across sessions/devices. |
| `Communication` | **Kept**, lightweight log | Records *that* a WhatsApp/call/email touchpoint happened (channel, direction, summary, timestamp) — not a full inbox (MVP has no WhatsApp API to capture inbound message content automatically; entries are admin-logged or system-logged on deep-link generation). |
| `AuditLog` | **Kept** | Generic `(actorId, action, entityType, entityId, before, after, createdAt)` row for admin state-changing actions. |
| `LeadStatusHistory` | **Added** (not in brief's list) | Needed to support FR-27 (follow-up staleness) and general pipeline reporting without overloading `AuditLog`'s generic shape for this high-frequency, domain-specific transition. |
| `Media` | **Added** | Generic media asset table (url, type, alt text, width/height, provider metadata) referenced by `GalleryItem`, `Lead` (uploaded photos), `Review`, `Service`, `Package` — avoids duplicating storage metadata columns across five tables. |

### 6.3 Prisma schema (representative — full field-level detail)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────────────────── Enums ─────────────────────────

enum AdminRole {
  ADMIN
  // Phase 2: TECHNICIAN, FRONT_DESK
}

enum VehicleType {
  HATCHBACK
  SEDAN
  SUV
  MUV
  LUXURY
  TWO_WHEELER
  OTHER
}

enum ContactMethod {
  CALL
  WHATSAPP
  EMAIL
}

enum LeadStatus {
  NEW
  CONTACTED
  QUOTE_SENT
  FOLLOW_UP
  BOOKED
  COMPLETED
  LOST
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
}

enum BookingStatus {
  PENDING_CONFIRMATION
  CONFIRMED
  RESCHEDULED
  CANCELLED
  COMPLETED
  NO_SHOW
}

enum PaymentStatus {
  NOT_APPLICABLE
  PENDING
  PARTIALLY_PAID
  PAID
}

enum MediaType {
  IMAGE
  VIDEO
}

enum CommunicationChannel {
  WHATSAPP
  CALL
  EMAIL
  SMS
}

enum CommunicationDirection {
  OUTBOUND
  INBOUND
}

enum NotificationType {
  NEW_LEAD
  NEW_BOOKING_PENDING
  BOOKING_CANCELLED
  LEAD_NEEDS_FOLLOWUP
  QUOTE_EXPIRING
}

// ───────────────────────── Core auth ─────────────────────────

model AdminUser {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         AdminRole @default(ADMIN)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  auditLogs       AuditLog[]
  leadNotes       LeadNote[]
  assignedLeads   Lead[]            @relation("LeadAssignee")
  quotesIssued    Quote[]
  bookingsCreated Booking[]         @relation("BookingCreatedBy")
}

// ───────────────────────── CRM core ─────────────────────────

model Customer {
  id            String   @id @default(uuid())
  name          String
  phone         String   @unique   // E.164 or normalized local format
  email         String?
  preferredContactMethod ContactMethod @default(WHATSAPP)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  vehicles      Vehicle[]
  leads         Lead[]
  quotes        Quote[]
  bookings      Booking[]
  communications Communication[]

  @@index([phone])
}

model Vehicle {
  id              String   @id @default(uuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  brand           String
  model           String
  variant         String?
  manufactureYear Int?
  vehicleType     VehicleType?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  leads    Lead[]
  quotes   Quote[]
  bookings Booking[]

  @@index([customerId])
}

model Lead {
  id                String     @id @default(uuid())
  customerId        String
  customer          Customer   @relation(fields: [customerId], references: [id])
  vehicleId         String?
  vehicle           Vehicle?   @relation(fields: [vehicleId], references: [id])
  status            LeadStatus @default(NEW)
  assignedToId      String?
  assignedTo        AdminUser? @relation("LeadAssignee", fields: [assignedToId], references: [id])

  serviceInterestId String?
  serviceInterest   Service?   @relation(fields: [serviceInterestId], references: [id])
  vehicleCondition  String?    // free text summary
  existingScratches Boolean?
  paintCondition    String?
  existingCoatingOrPpf String?
  desiredResult     String?
  budgetRangeMin    Decimal?   @db.Decimal(10, 2)
  budgetRangeMax    Decimal?   @db.Decimal(10, 2)
  preferredDate     DateTime?
  additionalNotes   String?
  possibleDuplicateOf String?  // self-referencing lead id, nullable

  source            String?    // e.g. "quote_form", "admin_manual", "instagram"
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  photos            Media[]
  notes             LeadNote[]
  statusHistory     LeadStatusHistory[]
  quotes            Quote[]
  bookings          Booking[]
  communications    Communication[]

  @@index([status])
  @@index([customerId])
}

model LeadNote {
  id        String   @id @default(uuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id])
  authorId  String
  author    AdminUser @relation(fields: [authorId], references: [id])
  body      String
  createdAt DateTime @default(now())

  @@index([leadId])
}

model LeadStatusHistory {
  id        String     @id @default(uuid())
  leadId    String
  lead      Lead       @relation(fields: [leadId], references: [id])
  fromStatus LeadStatus?
  toStatus  LeadStatus
  changedAt DateTime   @default(now())

  @@index([leadId])
}

// ───────────────────────── Catalogue ─────────────────────────

model Service {
  id              String   @id @default(uuid())
  slug            String   @unique
  name            String
  description     String
  category        String?
  startingPrice   Decimal  @db.Decimal(10, 2)
  durationMinutes Int
  warrantyText    String?
  benefits        String[]
  isEnabled       Boolean  @default(true)
  isBookable      Boolean  @default(true)
  bufferMinutesOverride Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  media           Media[]
  packages        PackageService[]
  leads           Lead[]
  quoteItems      QuoteItem[]
  bookings        Booking[]
  galleryItems    GalleryItem[]

  @@index([isEnabled])
}

model Package {
  id              String   @id @default(uuid())
  slug            String   @unique
  name            String
  description     String
  price           Decimal? @db.Decimal(10, 2)
  startingPrice   Decimal? @db.Decimal(10, 2)
  durationMinutes Int
  benefits        String[]
  warrantyText    String?
  validityText    String?
  terms           String?
  isEnabled       Boolean  @default(true)
  isBookable      Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  media           Media[]
  services        PackageService[]
  quoteItems      QuoteItem[]
  bookings        Booking[]

  @@index([isEnabled])
}

model PackageService {
  packageId String
  package   Package @relation(fields: [packageId], references: [id])
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id])

  @@id([packageId, serviceId])
}

// ───────────────────────── Quoting ─────────────────────────

model Quote {
  id          String      @id @default(uuid())
  leadId      String
  lead        Lead        @relation(fields: [leadId], references: [id])
  customerId  String
  customer    Customer    @relation(fields: [customerId], references: [id])
  vehicleId   String?
  vehicle     Vehicle?    @relation(fields: [vehicleId], references: [id])
  status      QuoteStatus @default(DRAFT)
  issuedById  String?
  issuedBy    AdminUser?  @relation(fields: [issuedById], references: [id])
  subtotal    Decimal     @db.Decimal(10, 2)
  discount    Decimal     @default(0) @db.Decimal(10, 2)
  tax         Decimal     @default(0) @db.Decimal(10, 2)
  total       Decimal     @db.Decimal(10, 2)
  validUntil  DateTime?
  notes       String?
  terms       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  items       QuoteItem[]
  bookings    Booking[]

  @@index([leadId])
  @@index([status])
}

model QuoteItem {
  id          String   @id @default(uuid())
  quoteId     String
  quote       Quote    @relation(fields: [quoteId], references: [id])
  serviceId   String?
  service     Service? @relation(fields: [serviceId], references: [id])
  packageId   String?
  package     Package? @relation(fields: [packageId], references: [id])
  description String
  quantity    Int      @default(1)
  unitPrice   Decimal  @db.Decimal(10, 2)
  lineTotal   Decimal  @db.Decimal(10, 2)

  @@index([quoteId])
}

// ───────────────────────── Booking engine ─────────────────────────

model Resource {
  id        String   @id @default(uuid())
  name      String   // e.g. "Bay 1", "PPF Bay"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bookings         Booking[]
  blockedRanges    BlockedTimeRange[]
}

model BusinessHours {
  id        String   @id @default(uuid())
  dayOfWeek Int      // 0 = Sunday ... 6 = Saturday
  startTime String   // "10:00" (24h, local business timezone)
  endTime   String   // "14:00"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([dayOfWeek])
}

model BlockedDate {
  id        String   @id @default(uuid())
  date      DateTime @db.Date
  reason    String?
  createdAt DateTime @default(now())

  @@unique([date])
}

model BlockedTimeRange {
  id         String    @id @default(uuid())
  resourceId String?   // null = applies to all resources
  resource   Resource? @relation(fields: [resourceId], references: [id])
  startAt    DateTime
  endAt      DateTime
  reason     String?
  createdAt  DateTime  @default(now())

  @@index([resourceId, startAt, endAt])
}

model Booking {
  id              String        @id @default(uuid())
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  vehicleId       String?
  vehicle         Vehicle?      @relation(fields: [vehicleId], references: [id])
  leadId          String?
  lead            Lead?         @relation(fields: [leadId], references: [id])
  quoteId         String?
  quote           Quote?        @relation(fields: [quoteId], references: [id])

  serviceId       String?
  service         Service?      @relation(fields: [serviceId], references: [id])
  packageId       String?
  package         Package?      @relation(fields: [packageId], references: [id])

  resourceId      String
  resource        Resource      @relation(fields: [resourceId], references: [id])

  startAt         DateTime
  endAt           DateTime      // startAt + duration (buffer tracked separately, not in endAt)
  status          BookingStatus @default(PENDING_CONFIRMATION)
  paymentStatus   PaymentStatus @default(NOT_APPLICABLE)
  priceQuoted     Decimal?      @db.Decimal(10, 2)

  createdById     String?
  createdBy       AdminUser?    @relation("BookingCreatedBy", fields: [createdById], references: [id])
  source          String        // "public_web" | "admin"
  customerNotes   String?
  internalNotes   String?
  cancellationReason String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([resourceId, startAt, endAt])
  @@index([status])
  @@index([customerId])
}
```
```prisma
// (continued)

// ───────────────────────── Content ─────────────────────────

model Media {
  id        String    @id @default(uuid())
  url       String
  type      MediaType
  altText   String?
  width     Int?
  height    Int?
  provider  String    // e.g. "s3", "cloudinary"
  providerKey String? // storage key/path for deletion
  createdAt DateTime  @default(now())

  // Optional back-references (nullable FKs on the "owning" side instead
  // avoids one giant polymorphic table — Media rows are linked FROM the
  // owner, e.g. GalleryItem.beforeMediaId, Lead has a join table below.
  leadPhotos     LeadPhoto[]
  galleryBefore  GalleryItem[] @relation("GalleryBefore")
  galleryAfter   GalleryItem[] @relation("GalleryAfter")
  galleryVideo   GalleryItem[] @relation("GalleryVideo")
  serviceId      String?
  service        Service?  @relation(fields: [serviceId], references: [id])
  packageId      String?
  package        Package?  @relation(fields: [packageId], references: [id])
  reviewId       String?
  review         Review?   @relation(fields: [reviewId], references: [id])
}

model LeadPhoto {
  leadId  String
  lead    Lead   @relation(fields: [leadId], references: [id])
  mediaId String
  media   Media  @relation(fields: [mediaId], references: [id])

  @@id([leadId, mediaId])
}

model GalleryItem {
  id              String   @id @default(uuid())
  title           String
  slug            String   @unique
  description     String?
  serviceCategory String?  // free text or Service.category mirror
  vehicleBrand    String?
  vehicleModel    String?
  tags            String[]
  isFeatured      Boolean  @default(false)
  isPublished     Boolean  @default(true)
  beforeMediaId   String?
  beforeMedia     Media?   @relation("GalleryBefore", fields: [beforeMediaId], references: [id])
  afterMediaId    String?
  afterMedia      Media?   @relation("GalleryAfter", fields: [afterMediaId], references: [id])
  videoMediaId    String?
  videoMedia      Media?   @relation("GalleryVideo", fields: [videoMediaId], references: [id])
  serviceId       String?
  service         Service? @relation(fields: [serviceId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  @@index([isPublished, isFeatured])
}

model Review {
  id          String   @id @default(uuid())
  customerName String
  rating      Int      // 1-5
  body        String
  vehicleText String?  // e.g. "BMW 3 Series" (free text, not FK — reviews may be manually entered for customers pre-dating digital records)
  serviceId   String?
  service     Service? @relation(fields: [serviceId], references: [id])
  reviewDate  DateTime?
  isFeatured  Boolean  @default(false)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  media       Media[]

  @@index([isPublished, isFeatured])
}

model Offer {
  id          String   @id @default(uuid())
  title       String
  description String
  startAt     DateTime
  endAt       DateTime
  isEnabled   Boolean  @default(true)
  serviceId   String?
  service     Service? @relation(fields: [serviceId], references: [id])
  packageId   String?
  package     Package? @relation(fields: [packageId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@index([isEnabled, startAt, endAt])
}

// ───────────────────────── Comms / Notifications / Audit ─────────────────────────

model Communication {
  id          String                  @id @default(uuid())
  customerId  String
  customer    Customer                @relation(fields: [customerId], references: [id])
  leadId      String?
  lead        Lead?                   @relation(fields: [leadId], references: [id])
  channel     CommunicationChannel
  direction   CommunicationDirection
  summary     String
  createdAt   DateTime                @default(now())

  @@index([customerId])
  @@index([leadId])
}

model Notification {
  id        String            @id @default(uuid())
  type      NotificationType
  title     String
  body      String
  entityType String?
  entityId  String?
  isRead    Boolean           @default(false)
  createdAt DateTime          @default(now())

  @@index([isRead, createdAt])
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?
  actor      AdminUser? @relation(fields: [actorId], references: [id])
  action     String     // e.g. "booking.status_changed"
  entityType String
  entityId   String
  before     Json?
  after      Json?
  createdAt  DateTime  @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
}
```

> **Note for the implementing agent:** the two ` ```prisma ` blocks above are one logical `schema.prisma` file, split for readability. `Vehicle`, `QuoteItem`, `Booking`, `GalleryItem`, `Review`, `Offer` back-relations to `Media`/`Service`/`Package` shown above must be reconciled into a single consistent file (Prisma requires both sides of a relation declared); treat the field lists as authoritative and let `prisma format`/`prisma validate` catch any relation-naming conflicts during implementation.

### 6.4 Key constraints & indexes
- `Customer.phone` unique — the join key for lead/vehicle/booking matching (PRD FR-13).
- `Booking(resourceId, startAt, endAt)` indexed for fast overlap queries; **the actual no-double-booking guarantee is enforced at the transaction level (see §9.3), not by a simple unique index**, because overlap-prevention is a range condition, not an equality condition. Postgres `EXCLUDE USING gist` with a `tstzrange` column is the recommended hardening (see ADR-2, §20) — modeled as a raw SQL migration addition on top of the Prisma-managed columns (`startAt`, `endAt`, `resourceId`), since Prisma does not natively express `EXCLUDE` constraints.
- `BlockedDate.date` unique.
- `Service.slug`, `Package.slug`, `GalleryItem.slug` unique — used for public route params.

## 7. API / Server-Action Strategy

| Concern | Mechanism | Why |
|---|---|---|
| Public form submissions (quote, booking) | Server Action | Progressive enhancement, no bespoke API needed, colocated validation |
| Admin CRUD (services, packages, gallery, reviews, offers, leads, bookings) | Server Action | Same as above; admin UI is server-rendered with client islands, not a separate SPA |
| Slot availability query (used by client-side date/slot picker as user interacts) | Route Handler (`GET /api/booking/availability?...`) — **exception to "server actions by default"** | Needs to be called repeatedly/reactively from a client component as the user changes date, ideal as a cacheable/fetchable GET endpoint rather than a server action (which are POST-oriented) |
| Signed media upload URL issuance | Route Handler | Must be callable independently of a full page form submission (upload progress UX), and needs to return a URL to a client-side uploader |
| Health check | Route Handler | Infra requirement, not app logic |
| Future webhooks (WhatsApp API, payments) | Route Handler | External systems can only call HTTP endpoints, not server actions |

All Route Handlers and Server Actions share the same underlying `src/modules/*` service functions — no business logic is duplicated between the two invocation mechanisms (ADR-1, §20).

## 8. Authentication Architecture

- Admin authentication only (no customer accounts in MVP, per PRD NG7/A3).
- **[ASSUMPTION]** Library: **Auth.js (NextAuth) v5** with the **Credentials provider** backed by `AdminUser.passwordHash` (bcrypt/argon2 hashed), and a database session strategy (sessions table) rather than pure JWT, so sessions can be server-side revoked (important for an admin panel controlling business operations).
- Login flow: `/admin/login` → Server Action validates credentials → creates session → redirects to originally-requested `/admin/*` path (or dashboard).
- `middleware.ts` protects all `/admin/*` routes except `/admin/login`; unauthenticated requests are redirected with a `callbackUrl`.
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Password requirements: minimum length + complexity enforced server-side on account creation (admin accounts are provisioned by seed/another admin, not self-registration — no public sign-up surface exists).
- Rate limiting on `/admin/login` (see §16) to blunt credential-stuffing.

## 9. Authorization

- MVP: single `AdminRole.ADMIN` — any authenticated admin has full access.
- **Forward-compatible design:** every admin server action checks authorization through a single `assertAuthorized(session, action, resource?)` helper in `modules/auth`, even though MVP always returns true for an authenticated `ADMIN`. This is the seam Phase 2 uses to introduce `TECHNICIAN`/`FRONT_DESK` roles with narrower permissions (e.g., technician can update booking status but not edit pricing) without touching call sites.
- Lead "assignment" (`Lead.assignedToId`) exists in the schema now so Phase 2 role-based routing doesn't require a migration.

## 10. Booking Engine Architecture & Slot-Generation Logic

### 10.1 Inputs
For a given `(serviceId | packageId, date)`:
1. `durationMinutes` = service's or package's `durationMinutes`.
2. `bufferMinutes` = `service.bufferMinutesOverride ?? GLOBAL_DEFAULT_BUFFER_MINUTES` (config, default 15 — PRD A5).
3. Active `Resource`s (`isActive = true`).
4. `BusinessHours` rows for that date's `dayOfWeek` (may be 0 or multiple rows = split shifts).
5. `BlockedDate` for that exact date → if present, **no slots at all** for any resource.
6. `BlockedTimeRange` rows overlapping that date, scoped to a specific resource or `resourceId = null` (all resources).
7. Existing `Booking`s on that date with status in `{PENDING_CONFIRMATION, CONFIRMED, RESCHEDULED}` (i.e., not `CANCELLED`), per resource.
8. Current server time + `MIN_LEAD_TIME_MINUTES` (config, default 120 — PRD A5) for same-day cutoff.

### 10.2 Algorithm (per resource, then unioned)

```
function getAvailableSlots(date, durationMinutes, bufferMinutes):
  if BlockedDate exists for date: return []

  slots = []
  for resource in activeResources:
    windows = businessHoursWindowsFor(date)          # e.g. [10:00-14:00, 15:00-19:00]
    windows = subtractRanges(windows, blockedTimeRangesFor(date, resource))
    windows = subtractRanges(windows, existingBookingsFor(date, resource)
                              .map(b => [b.startAt, b.endAt + bufferMinutes]))
                              # buffer applied AFTER each existing booking

    for window in windows:
      cursor = window.start
      while cursor + durationMinutes <= window.end:
        slotStart = cursor
        slotEnd   = cursor + durationMinutes
        if slotStart >= now + MIN_LEAD_TIME_MINUTES:
          slots.add({ start: slotStart, end: slotEnd, resourceId: resource.id })
        cursor = cursor + SLOT_GRANULARITY_MINUTES   # e.g. 30-min grid, config

  # De-duplicate by (start,end) across resources for customer-facing display —
  # customer picks a TIME, not a specific bay; resource is assigned by the
  # system (first available) at booking-confirmation time (see 10.3).
  return dedupeByStartEnd(slots).sortByStart()
```

- `SLOT_GRANULARITY_MINUTES` **[ASSUMPTION: 30 minutes]** — the grid on which slot start times are offered, independent of service duration, so a 90-minute service can still start on a clean :00/:30 boundary.
- The customer-facing slot list shows only distinct time ranges; resource assignment is an internal concern (a shop bay isn't a customer decision), unless later a resource has customer-relevant meaning (e.g., "PPF-only bay" — in that case, the service-to-resource-eligibility mapping, not customer choice, would filter which resources are considered in `activeResources` for that service).

### 10.3 Booking creation (race-safe)

Because two customers could both request the same last slot concurrently, slot availability is **re-validated inside the same database transaction that creates the booking**, not trusted from the earlier read the client used to render the picker:

```
transaction:
  1. Re-run getAvailableSlots-equivalent overlap check for the chosen
     (resourceId candidate list, startAt, endAt) using a row-level lock:
       SELECT ... FROM "Booking"
       WHERE resourceId = ANY(candidateResourceIds)
         AND status != 'CANCELLED'
         AND (startAt, endAt) OVERLAPS (:newStart, :newEnd + buffer)
       FOR UPDATE
  2. If any candidate resource is free (no overlapping row survives the lock
     check), INSERT the Booking against that resource.
  3. If none are free, ROLLBACK and return a domain error
     SLOT_NO_LONGER_AVAILABLE to the caller (PRD AC-4).
```

- This is implemented via Prisma's `$transaction` with an explicit `SELECT ... FOR UPDATE` raw query (Prisma doesn't expose row locking natively), OR by relying on the Postgres `EXCLUDE USING gist` constraint (ADR-2) as a belt-and-suspenders guarantee even if application logic has a bug — **recommended: implement both**, since the DB constraint is the true source of truth for "never double book," and the transactional pre-check is what turns a constraint violation into a friendly UX message instead of a raw 500 error.
- Reschedule uses the same transactional re-validation against the new slot before releasing the old one.

## 11. CRM Architecture

- `modules/crm` exposes `createLeadFromQuoteForm(input)`, `transitionLeadStatus(leadId, toStatus, actor)`, `addLeadNote(...)`, `getLeadTimeline(leadId)` (merges `LeadStatusHistory`, `LeadNote`, `Communication`, `Quote`s, `Booking`s into one chronological view for the admin lead-detail page).
- `transitionLeadStatus` always writes a `LeadStatusHistory` row and (per FR-27) the "needs follow-up" flag is computed at **read time** in the leads list query: `status NOT IN (BOOKED, COMPLETED, LOST) AND updatedAt < now() - interval '3 days'` — no background job required for MVP, keeping infra minimal per the brief's "don't over-engineer" directive. A note in §17 covers when a real scheduler becomes worth introducing.

## 12. Quote Architecture

- `modules/quote` contains two independent concerns:
  1. **Instant estimate** (`estimateFromRequirement(input): EstimateResult`) — a pure function implementing a small deterministic rules table (e.g., service base price × vehicle-type multiplier × condition adjustment), returning a range `{ min, max }` and the matched package/service suggestion. This is intentionally simple and inspectable, not a black box, so the business can trust and tune it (it is, in effect, a restricted preview of the same interface the future `RecommendationEngine` implements — see §13).
  2. **Formal quote lifecycle** (`createDraftQuote`, `sendQuote`, `markAccepted/Declined/Expired`) — standard CRUD + status transition over `Quote`/`QuoteItem`, always linked to a `Lead`.
- Quote → Booking linkage: when a booking is created from an accepted quote, `Booking.quoteId` is set and `Booking.priceQuoted` is copied from `Quote.total`, so the booking retains its price even if the quote record is later edited.

## 13. Notification Architecture

- Internal **event bus** pattern: business actions (`lead.created`, `booking.created`, `booking.status_changed`, `lead.needs_followup` [computed, emitted on read of the flagged list — see note below], `quote.sent`) are emitted via a small typed `emit(event)` call from within `modules/*` service functions, immediately after the triggering DB write commits.
- Each event has zero or more **handlers** registered in `modules/notifications/handlers.ts`:
  - `AdminFeedHandler` — writes a `Notification` row (always active, MVP's primary channel).
  - `WhatsAppDeepLinkHandler` — MVP: does nothing automatically (no server-initiated send is possible without API access); it exists as a named no-op/logging handler so the *event → channel* wiring is already in place for Phase 2.
  - `WhatsAppApiHandler` — Phase 2, stubbed/disabled by config flag (`WHATSAPP_API_ENABLED=false`), implementing the same handler interface, so enabling Phase 2 automation is a config flip + credential setup, not a code restructure.
  - `EmailHandler` — Phase 2, same pattern.
- This registry pattern (ADR-3, §20) is the concrete mechanism satisfying PRD §14's "add channels later without changing event-producing code."

## 14. Media Architecture

- `modules/media` defines a `StorageProvider` interface:
  ```ts
  interface StorageProvider {
    getSignedUploadUrl(params: { contentType: string; sizeBytes: number; folder: string }): Promise<{ uploadUrl: string; publicUrl: string; providerKey: string }>;
    deleteObject(providerKey: string): Promise<void>;
    getPublicUrl(providerKey: string): string;
  }
  ```
- **[ASSUMPTION]** MVP concrete implementation: an **S3-compatible object storage** provider (e.g., AWS S3 or Cloudflare R2 — either satisfies the interface identically; final choice is a deployment-time decision, not an architectural one) with a CDN (CloudFront or the storage provider's built-in CDN) in front for public delivery.
- Upload flow: client requests a signed upload URL from `/api/uploads/sign` (validates content-type is image/video, size ≤ configured max, and — for public-facing uploads like quote-form photos — is rate-limited), uploads directly to storage from the browser (bypassing the Next.js server for the binary payload), then submits the resulting `providerKey`/`publicUrl` as part of the form's server action payload, which creates the `Media` row.
- Image optimization/transformation (responsive sizes, thumbnails) is handled by `next/image` at request time for images served through Next.js, plus (optionally) the storage/CDN provider's on-the-fly transformation feature if using Cloudflare Images/Images-capable R2 — **[ASSUMPTION]** not mandatory for MVP; `next/image` alone is sufficient.
- Video storage: same `StorageProvider`, `MediaType.VIDEO`; playback via native `<video>` tag with a poster image; no video transcoding pipeline in MVP (uploaded files are expected to already be web-suitable — validated by file-size cap and a recommended-format note in the admin upload UI).
- Swapping providers (e.g., S3 → Cloudinary) means writing one new class implementing `StorageProvider` and changing one factory/config binding — no changes to `modules/gallery`, `modules/crm`, etc., which only depend on the interface.

## 15. WhatsApp Integration Boundary

- `modules/whatsapp` exposes:
  ```ts
  interface WhatsAppAdapter {
    buildDeepLink(phone: string, message: string): string;         // MVP: wa.me link builder, always available
    sendMessage?(phone: string, template: string, vars: Record<string,string>): Promise<void>; // Phase 2 only
  }
  ```
- **MVP implementation:** `buildDeepLink` only — pure string construction of `https://wa.me/<phone>?text=<url-encoded message>`, used for: booking confirmation ("here's your booking, message us to confirm"), quote summary, and admin-side "message this lead" buttons throughout the CRM. No server-side send capability exists; every WhatsApp touchpoint in MVP is a link the admin or customer clicks to open WhatsApp with a pre-filled message — genuinely manual, explicitly not automated (PRD NG4).
- **Phase 2 implementation:** a second class implementing `sendMessage` via the official WhatsApp Business API (Cloud API), gated by `WHATSAPP_API_ENABLED` config and used by the `WhatsAppApiHandler` notification handler (§13). Requires: Meta Business verification, approved message templates, a webhook route (`/api/webhooks/whatsapp`, already stubbed in the folder structure) for delivery status/inbound replies.
- This boundary is the direct implementation of PRD §12's requirement to "clearly separate deep-link/manual messaging from Business API automation."

## 16. AI Integration Boundary

- `modules/recommendation` exposes:
  ```ts
  interface RecommendationEngine {
    recommend(input: {
      vehicle: { brand: string; model: string; year?: number; type?: VehicleType };
      condition?: { existingScratches?: boolean; paintCondition?: string; existingCoatingOrPpf?: string };
      desiredResult?: string;
      budgetRange?: { min?: number; max?: number };
    }): Promise<{
      recommendation: { packageSlug?: string; serviceSlug?: string; confidence: number; rationale: string };
      alternatives: Array<{ packageSlug?: string; serviceSlug?: string; confidence: number }>;
    }>;
  }
  ```
- **MVP implementation (`RulesBasedRecommendationEngine`):** a deterministic decision table/rule set (vehicle segment × condition keywords × budget band → package suggestion), synchronous, no external calls, fully unit-testable, and used both by the `/quote` instant-estimate UI and internally by admin quote drafting as a starting suggestion.
- **Phase 3 implementation (`AiRecommendationEngine`):** would call an LLM (e.g., via the Anthropic API) with the same input shape, returning the same output shape — swapped in via the same factory/config binding pattern as the storage provider (§14), so `/quote` page code and admin quote-drafting code require **zero changes** when this swap happens. This is the concrete mechanism satisfying PRD §15/§18.
- No AI calls occur in MVP production traffic (PRD NG5) — the interface exists purely to guarantee the later swap is additive.

## 17. Security

- **Admin auth:** §8 (Auth.js, hashed passwords, HttpOnly/Secure session cookies, revocable server-side sessions).
- **Authorization:** §9 (centralized `assertAuthorized` check on every admin mutation).
- **CSRF:** Server Actions have built-in CSRF protection (Next.js verifies the request origin for action invocations); Route Handlers that mutate state (currently none are public-mutating besides signed-upload issuance, which is itself capability-scoped and short-lived) additionally validate `Origin`/`Referer` where applicable.
- **Input validation:** every server action/route handler validates with a Zod schema before touching the database; Prisma's parameterized queries eliminate classic SQL injection risk (raw SQL is used only for the `FOR UPDATE` lock query and the `EXCLUDE` constraint migration, both fully parameterized, never string-concatenated).
- **Rate limiting:** a token-bucket/sliding-window limiter (`lib/rate-limit.ts`, backed by an in-memory store for MVP single-instance deployment, upgradeable to Redis if horizontally scaled — see §19) applied to: `/quote` submission, `/book/*` submission, `/admin/login`, `/api/uploads/sign`.
- **File upload security:** content-type allow-list (images: jpg/png/webp; video: mp4/webm), size caps (**[ASSUMPTION]** 10MB/image, 100MB/video, admin-configurable), signed short-lived upload URLs scoped to a specific folder/content-type (§14), server-side re-validation of the resulting object's content-type/size before creating the `Media` row (never trust the client-reported type alone).
- **XSS:** React's default escaping covers rendered content; any rich-text fields (service/package descriptions) are stored as plain text/Markdown (rendered through a sanitized Markdown renderer), never raw HTML from admin input rendered via `dangerouslySetInnerHTML`.
- **Admin route protection:** `middleware.ts`, §8.
- **Audit logging:** `AuditLog` row written by a shared helper called from every admin mutation that changes status, price, or catalogue visibility (§6.2, §13 AR-2 in PRD).
- **Secrets/env vars:** all secrets loaded via `lib/env.ts`, which validates presence/shape at boot (fail-fast) using Zod against `process.env`; `.env.example` documents every required variable (see §21) with no real secrets committed.

## 18. Performance

- Public catalogue/content pages: RSC + ISR/on-demand revalidation (admin mutation triggers `revalidateTag('services')` etc.) rather than fully dynamic re-render on every request.
- Images via `next/image` (responsive `srcset`, lazy loading below the fold, CDN-backed).
- Database: indexes as specified in §6.4; N+1 avoidance via Prisma `include`/`select` scoping tuned per query, not over-fetching relations on list views (e.g., leads list doesn't eager-load full `LeadStatusHistory`, only latest status + `updatedAt`).
- Booking slot computation (§10) is a lightweight in-memory computation over a single day's rows (small result set — one resource's bookings for one day), not a heavy query; no caching required at MVP scale, but the function boundary (`getAvailableSlots`) is isolated enough to add caching later if traffic warrants.

## 19. Scalability

- MVP runs as a single deployed instance (or a small horizontally-scaled pool behind a load balancer) against a single managed Postgres instance — sufficient for a single-location business's traffic profile.
- Horizontal scaling readiness: no in-process state beyond the rate-limiter (§17), which is called out as the one component to move to a shared store (Redis) if/when more than one app instance runs concurrently — flagged explicitly so it isn't missed during a future scale-up.
- Multi-location readiness (Phase 3, PRD F23): `Resource` already models "a bookable unit," so a `Location` entity could be introduced as a parent of `Resource`/`BusinessHours`/`BlockedDate` with an additive migration, without restructuring the booking engine's core overlap logic.
- Database connection pooling via Prisma's connection pool / an external pooler (e.g., PgBouncer) recommended once concurrent admin+public load justifies it; not required at MVP launch traffic.

## 20. Architectural Decisions & Tradeoffs (ADRs)

**ADR-1: Server Actions as default mutation mechanism, Route Handlers only where a true HTTP contract is needed.**
*Tradeoff:* Server Actions are Next.js/React-coupled (not directly callable by external systems), which is acceptable since this app has no third-party API consumers in MVP. If a future partner integration needs a stable HTTP API, the relevant `modules/*` service function can be wrapped in a new Route Handler without touching its internals — the logic/interface split (§7) is what makes this cheap later.

**ADR-2: Postgres `EXCLUDE USING gist` constraint as the ultimate double-booking guard, layered under application-level transactional re-validation.**
*Tradeoff:* Adds one hand-written SQL migration outside Prisma's declarative schema (Prisma cannot express exclusion constraints natively), which slightly complicates the "everything is in `schema.prisma`" mental model. Accepted because correctness of "never double-book a bay" is the single most business-critical invariant in this system (PRD FR-15) and must not depend solely on application code being bug-free.

**ADR-3: Event-bus/handler-registry pattern for notifications instead of direct function calls to a WhatsApp/email sender inline in booking/lead code.**
*Tradeoff:* One layer of indirection (register a handler, emit an event) versus just calling `sendWhatsApp(...)` directly. Accepted because it's the concrete mechanism that lets Phase 2 (WhatsApp API, email) be added by registering new handlers, satisfying PRD §14's explicit forward-compatibility requirement, at negligible complexity cost.

**ADR-4: `Booking` = one service OR one package, no separate `BookingItem` line-item table in MVP.**
*Tradeoff:* A customer wanting two unrelated services in one visit must either book two appointments or the business creates an ad hoc `Package` bundling them. Accepted because it keeps slot-duration math (§10) unambiguous (one booking = one duration) and matches how detailing shops actually schedule bay time; `BookingItem` can be added additively if a real multi-item-per-visit need emerges.

**ADR-5: No background job scheduler in MVP; follow-up staleness and offer-expiry are computed at read-time from timestamps/date ranges.**
*Tradeoff:* Slightly more query complexity on list views (a `WHERE updatedAt < now() - interval` clause) versus a cron-maintained flag column. Accepted per the brief's explicit "don't over-engineer" instruction — a scheduler becomes worth its operational cost only once *proactive* (push) reminders (e.g., "text the customer a reminder 24h before appointment," Phase 2) are needed, at which point a job runner (e.g., a scheduled Vercel Cron hitting a Route Handler, or a small worker process) is introduced purely additively.

**ADR-6: Prisma over Drizzle.**
*Tradeoff:* Drizzle's SQL-closer API and lighter runtime are arguably a better long-term fit for a booking-heavy app with custom locking queries. Prisma is chosen for MVP for migration tooling maturity and to minimize implementation risk for an automated coding agent building this from spec; the `modules/*` service-layer boundary means the ORM could be swapped later without touching route/action code, if ever justified.

## 21. Environment Variables

```
DATABASE_URL=                    # postgresql://...
NEXTAUTH_SECRET=                 # session encryption secret
NEXTAUTH_URL=                    # canonical app URL
STORAGE_PROVIDER=s3              # s3 | r2 | cloudinary (factory binding)
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_CDN_URL=
WHATSAPP_BUSINESS_PHONE=         # for wa.me deep links (display/dial number)
WHATSAPP_API_ENABLED=false       # Phase 2 flag
WHATSAPP_API_TOKEN=              # Phase 2, unset in MVP
RECOMMENDATION_ENGINE=rules      # rules | ai (factory binding, Phase 3)
BOOKING_DEFAULT_BUFFER_MINUTES=15
BOOKING_MIN_LEAD_TIME_MINUTES=120
BOOKING_SLOT_GRANULARITY_MINUTES=30
RATE_LIMIT_STORE=memory          # memory | redis
LOG_LEVEL=info
```

## 22. Logging & Error Handling

- Structured JSON logging (`lib/logger.ts`) for: every server action entry/exit (action name, actor if admin, success/failure), booking conflicts (`SLOT_NO_LONGER_AVAILABLE` occurrences — useful signal for whether `SLOT_GRANULARITY`/buffer tuning is needed), and all caught exceptions with stack traces.
- User-facing errors are mapped from typed domain errors (e.g., `SlotNoLongerAvailableError`, `ValidationError`, `NotFoundError`) to friendly messages; unexpected exceptions are caught at the action/route boundary, logged with full detail server-side, and surfaced to the user as a generic "something went wrong, please try again" — never leaking stack traces or internal identifiers to the client.
- Admin UI surfaces recent errors relevant to their own actions inline (form field errors) — no separate "error log viewer" in MVP; server logs are the source of truth for operational debugging (Phase 2: consider a hosted log aggregator if the deployment platform doesn't already provide one).

## 23. Backup Strategy

- Managed Postgres provider's automated daily backups + point-in-time recovery (PITR), retention **[ASSUMPTION: 7–14 days]**, is the primary backup mechanism — no custom backup scripting needed at this scale.
- Object storage (media) relies on the provider's built-in durability (S3-class storage is already redundant); optional periodic bucket-level backup/replication is a Phase 2 hardening item, not MVP-critical.
- Before any destructive manual database operation (e.g., a manual data-fix in production), a manual snapshot is taken — an operational runbook note, not an application feature.

## 24. Database Migration Strategy

- `prisma migrate dev` for local development, `prisma migrate deploy` in CI/CD for production — migrations are version-controlled files in `prisma/migrations/`, applied in order, never edited after being merged.
- The one non-Prisma-native migration (the `EXCLUDE USING gist` constraint, ADR-2) is added as a Prisma "migration with custom SQL" (`prisma migrate dev --create-only` then hand-edit the generated `.sql` file) so it still participates in the same ordered migration history.
- Seed data (`prisma/seed.ts`) provisions: one `AdminUser`, default `BusinessHours`, one or two `Resource` rows, and a handful of example `Service`/`Package` rows — enough for the app to be immediately demonstrable post-deploy, clearly marked as example/placeholder content for the business to replace via the admin panel.

## 25. Deployment

- **[ASSUMPTION]** Target platform: **Vercel** (first-class Next.js support, zero-config for the App Router/Server Actions/ISR features this architecture relies on) with a managed Postgres provider (e.g., Neon, Supabase, or RDS) — any Postgres-compatible managed service satisfies the architecture; the specific provider is a deployment-time, not architectural, decision.
- Environments: `development` (local), `preview` (per-PR, Vercel preview deployments against a branch/preview database), `production`.
- CI: on PR — type-check, lint, run migrations against a disposable test database, run module-level unit tests (booking slot logic, quote estimate rules, lead status transitions — the pure-function-heavy parts of `modules/*` are deliberately structured to be unit-testable without spinning up the full app).
- CD: merge to `main` → `prisma migrate deploy` → build → deploy.

---

## 26. Cross-Document Traceability (Consistency Check)

This section confirms every PRD feature has an architectural home and a corresponding design surface (`DESIGN.md`).

| PRD Feature (§7) | Architecture support | Design surface |
|---|---|---|
| F1 Marketing site | `app/(public)` RSC pages, ISR | Home, About, Contact page specs |
| F2/F3 Service & Package catalogue | `modules/catalogue`, `Service`/`Package`/`PackageService` schema | Service/Package listing & detail templates |
| F4 Quote form | `modules/crm` + `modules/customers` + `modules/quote` (estimate), `Lead`/`Customer`/`Vehicle`/`Media` schema | Quote UX (multi-step form) |
| F5 Instant estimate | `modules/quote.estimateFromRequirement`, `modules/recommendation` interface | Estimate result state in Quote UX |
| F6 Manual quotation | `modules/quote` formal lifecycle, `Quote`/`QuoteItem` schema | Admin Quote detail/edit UX |
| F7 Booking + slots | `modules/booking`, §10 algorithm, `Booking`/`Resource`/`BusinessHours`/`BlockedDate`/`BlockedTimeRange` schema, ADR-2 | Booking UX flow, slot picker component |
| F8 Admin calendar | `/admin/calendar`, `modules/booking` read APIs | Admin Calendar UX (day/week/month) |
| F9 Lead/CRM pipeline | `modules/crm`, `Lead`/`LeadStatusHistory`/`LeadNote` schema | Admin Leads list/detail UX |
| F10 Customer & vehicle records | `modules/customers`, `Customer`/`Vehicle` schema | Admin Customers/Vehicles UX |
| F11 Gallery | `modules/gallery`, `modules/media`, `GalleryItem`/`Media` schema | Gallery grid/detail templates |
| F12 Reviews | `modules/reviews`, `Review` schema | Reviews page/component |
| F13 WhatsApp deep-link | `modules/whatsapp.buildDeepLink` | WhatsApp CTA components throughout |
| F14 Notifications | `modules/notifications` event bus, `Notification` schema | Admin notification feed UX |
| F15 Offers | `modules/offers`, `Offer` schema | Offers page/component |
| F16 Admin auth | Auth.js, `AdminUser` schema, `middleware.ts` | Admin login UX |
| F17 Audit log | `AuditLog` schema, shared audit helper | (Internal — no dedicated UI in MVP beyond implicit trust signal) |
| WhatsApp API boundary (Phase 2) | `WhatsAppAdapter.sendMessage`, `WhatsAppApiHandler` | Same components, no UX change needed |
| AI boundary (Phase 3) | `RecommendationEngine` interface, config-swap factory | Same Quote UX, richer rationale text only |

No PRD feature was found without a corresponding module/schema element; no schema element exists without a PRD-traceable purpose (the two additions beyond the brief's suggested list — `Media`, `LeadStatusHistory` — are each justified in §6.2 against specific PRD requirements FR-11/FR-27).

---
*End of ARCHITECTURE.md. See `DESIGN.md` for the corresponding UX/visual specification referenced throughout this document.*
