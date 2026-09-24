# SMOKE M CUSTOMS — Implementation Plan

> **Phase 0 deliverable.** No code has been written. This document summarizes my analysis of [PRD.md](file:///c:/PROJECTS/smokecustoms/docs/PRD.md), [ARCHITECTURE.md](file:///c:/PROJECTS/smokecustoms/docs/ARCHITECTURE.md), and [DESIGN.md](file:///c:/PROJECTS/smokecustoms/docs/DESIGN.md), identifies issues, and proposes the build plan.

---

## 1. Repository State

The repository is **empty** — only the `docs/` folder with the three specification files. Everything is greenfield.

---

## 2. Document Consistency Check

The three documents are **exceptionally well cross-referenced** (Architecture §26 even has a formal traceability matrix). I found the following issues, all minor:

### 2.1 Inconsistencies

| # | Issue | Documents | Recommendation |
|---|---|---|---|
| I-1 | `Offer` relation: PRD FR-37 says an offer links to "specific services/packages" (plural). Schema has `serviceId` / `packageId` (singular FK, nullable). | PRD ↔ ARCHITECTURE | **Keep singular FKs for MVP** — multiple services per offer is a many-to-many that adds complexity without clear MVP value. Note: if an offer applies to "all ceramic services", admin creates one offer per service. Sufficient for launch. |
| I-2 | `Review` FK to `Service`: DESIGN §11 `/reviews` says "filter by service", and schema has `serviceId` FK. But `Review` also has a free-text `vehicleText`. If a review spans a package (which bundles multiple services), which `serviceId` is stored? | ARCHITECTURE ↔ DESIGN | Store the **primary service** or leave null for package reviews. Filtering in the UI can fall back to text search. No schema change needed. |
| I-3 | Money type: Architecture §6.1 says "Int (minor units — paise) **or** Decimal(10,2) in rupees". Schema uses `Decimal(10,2)`. The "or" is ambiguous. | ARCHITECTURE internal | **Go with `Decimal(10,2)` as the schema shows** — it's the explicit definition. Remove ambiguity by treating schema as authoritative. |
| I-4 | `Lead.photos` relation: Schema line 386 shows `photos Media[]` (direct relation), but `LeadPhoto` join table also exists (line 646–653). These are two conflicting relation strategies. | ARCHITECTURE internal | **Use the `LeadPhoto` join table** (many-to-many) and remove the direct `photos Media[]` from Lead. A direct relation would require `leadId` on `Media`, but `Media` is shared across entities — the join table is the correct design. |
| I-5 | Architecture §10.2 shows buffer added after existing bookings' `endAt`, but `Booking.endAt` comment (line 595) says "buffer tracked separately, not in endAt". This is consistent but needs implementation clarity. | ARCHITECTURE internal | `endAt = startAt + durationMinutes`. Slot subtraction uses `endAt + bufferMinutes` for the "occupied" window. Clear — no change needed, just noting for implementation. |

### 2.2 Missing Technical Decisions (I'll resolve during implementation)

| # | Decision Needed | My Recommendation |
|---|---|---|
| D-1 | Auth.js v5 session strategy: "database session" is specified, but which session store? Prisma adapter creates a `Session` + `Account` table. | Use the **Prisma adapter** for Auth.js v5 with `strategy: "database"`. Add `Session`, `Account`, `VerificationToken` models to Prisma schema. |
| D-2 | Password hashing algorithm: "bcrypt/argon2" — which one? | **bcrypt** via `bcryptjs` — works everywhere (no native module compilation issues on Vercel/Windows), mature, sufficient for this threat model. |
| D-3 | Slot granularity step: Architecture says 30 min, but no decision on whether customers see the granularity or just the available windows. | Customers see **30-minute-aligned start times** as pill options (Design §6 `SlotPicker`). This is per spec. |
| D-4 | Vehicle brand/model list source: Design §12 says "searchable selects (not free type where avoidable)". Where does the list come from? | **Seed a static brand/model list** (top ~50 Indian-market brands + popular models). Admin can add more via a simple settings page later. For MVP, a JSON data file is fine. |
| D-5 | Contact form on `/contact` (Design §11): PRD doesn't define this — is it a Lead or separate? | Treat it as a **lightweight lead** with source `"contact_form"`. Same `Lead` pipeline, less data captured. |
| D-6 | The `EXCLUDE USING gist` constraint requires the `btree_gist` Postgres extension. | Enable `btree_gist` in the first migration. |
| D-7 | Rate limiting implementation: Architecture says in-memory token bucket. | Use `Map`-based sliding window. Simple, no dependencies. Wiped on restart (acceptable for single instance). |
| D-8 | `.ics` calendar download on booking confirmation page. | Pure client-side `.ics` file generation. Tiny, no library needed. |

### 2.3 Assumptions I'm Making

| # | Assumption |
|---|---|
| A-1 | Admin account is created via seed script only (no self-registration UI). Password: `admin@smokecustoms` / changeable post-login. |
| A-2 | MVP uses **local filesystem** as the storage provider for development (uploads go to `public/uploads/`). The `StorageProvider` interface is implemented, and an S3 provider can be swapped in for production via env config. |
| A-3 | No real WhatsApp API calls in MVP — `wa.me` deep links only, as specified. |
| A-4 | Timezone is hardcoded to `Asia/Kolkata` per PRD A4/EC-9. |
| A-5 | CSS approach: vanilla CSS with custom properties (design tokens from DESIGN.md), no Tailwind unless requested. |
| A-6 | The Review model FK on `Service` is nullable — a review can exist without being linked to a specific service. |

---

## 3. Technology Stack (Confirmed from ARCHITECTURE.md)

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth) v5, Credentials + Prisma adapter |
| Validation | Zod |
| Forms | React Hook Form |
| Styling | Vanilla CSS (custom properties / design tokens) |
| Media | `StorageProvider` interface, local dev provider |
| Deployment target | Vercel (architecture spec), any Node hosting |

---

## 4. Implementation Phases

### Phase 1 — Foundation
**Goal:** Bootable Next.js app with project structure, design system, database, auth.

- `npx create-next-app` with TypeScript + App Router
- Full folder structure per Architecture §3
- Design tokens CSS (colors, typography, spacing, radius, shadows from DESIGN.md §3–5)
- Core UI components: `Button`, `Card`, `Input`, `FormField`, `Badge`, `Modal`, `Toast`, `EmptyState`, `Skeleton`
- Prisma schema (full schema from Architecture §6.3, reconciled)
- Database migrations + seed (admin user, business hours, sample resources)
- Auth.js v5 setup with Credentials provider
- Middleware for admin route protection
- `lib/db.ts`, `lib/env.ts`, `lib/logger.ts`, `lib/rate-limit.ts`
- Module scaffolding (`src/modules/*` with index.ts interfaces)
- Error handling utilities (typed domain errors)
- `.env.example`

**Deliverables:** App boots, admin can log in, database is seeded, design system renders.

---

### Phase 2 — Admin Foundation + Catalogue Management [COMPLETED]
**Goal:** Admin can manage services, packages, and resources.

- [x] Admin layout shell (sidebar nav, topbar with live studio indicator, breadcrumbs, responsive mobile drawer)
- [x] Dashboard placeholder (structure & live KPI metrics, active pipeline leads, bay bookings queue)
- [x] Services CRUD (list, create, edit, enable/disable, bookable toggles) — full admin flow
- [x] Packages CRUD with service associations (many-to-many PackageService relations, auto-duration calculator, badges)
- [x] Resources management (bays: add bay, active/disabled toggling)
- [x] Business hours editor (interactive shift timing and closed day toggle)
- [x] Blocked dates manager (holiday blackouts with reason tags, unblocking)
- [x] Settings page (global buffer, lead time, slot granularity with live save)
- [x] Seed data for services + packages (realistic car detailing data with PackageService links)

**Deliverables:** Admin can fully manage the service catalogue and booking infrastructure.

---

### Phase 3 — Customer Website (Public Pages) [COMPLETED]
**Goal:** Premium public-facing website.

- [x] Home page (hero, services overview, featured gallery, packages teaser, reviews strip, offers banner, 4-stage how-it-works, CTA)
- [x] Navigation (header with sticky behavior, mobile hamburger + bottom CTA bar, footer, Client Portal links)
- [x] `/services` listing + `/services/[slug]` detail with JSON-LD schema
- [x] `/packages` listing + `/packages/[slug]` detail
- [x] `/gallery` listing + `/gallery/[slug]` detail (with interactive `ImageCompare` split slider component)
- [x] `/reviews` page (verified testimonials grid)
- [x] `/offers` page (limited time privileges & promotions)
- [x] `/about` page (studio philosophy, climate bay standards, concourse lighting)
- [x] `/contact` page (with interactive contact form → CRM lead creation + WhatsApp action)
- [x] `/privacy`, `/terms` legal compliance pages
- [x] SEO: metadata, Open Graph, structured data (AutoBodyShop LocalBusiness, Service schema), sitemap.xml, robots.txt
- [x] Responsive design verification at mobile, tablet, and desktop breakpoints

**Deliverables:** Fully functional, premium public website pulling real data from PostgreSQL.

---

### Phase 4 — Customer + Vehicle + Lead System (CRM) [COMPLETED]
**Goal:** Quote form and lead pipeline working end-to-end.

- [x] Customer module (create/match by phone with country code & prefix normalization)
- [x] Vehicle module (create/match, brand/model list, automatic segment detection)
- [x] Quote form (`/quote`) — multi-step per Design §12 with live dynamic estimate
- [x] Lead creation on form submit (with photo uploads via `StorageProvider` & `LeadPhoto` relation)
- [x] Instant estimate (rules-based `RecommendationEngine` with confidence score & rationale)
- [x] WhatsApp deep-link integration (confirmation screen with pre-filled enquiry parameters)
- [x] Admin leads list + detail page (timeline, notes, status transitions, photo gallery lightbox)
- [x] Admin customers list + detail (single customer view with garage, booking history, leads)
- [x] Admin vehicles list + detail (`/admin/vehicles` registry with garage specs, client links, bookings)
- [x] Lead status history tracking (`LeadStatusHistory` records on creation & every transition)
- [x] Follow-up flagging (read-time computation, 3-day inactivity threshold, warning badges & filter tab)
- [x] Notification events (new lead → admin notification feed bell & dropdown)
- [x] Duplicate lead detection (same phone + vehicle within 24h with duplicate pills & consolidated details)

**Deliverables:** Full CRM pipeline from customer submission through admin triage.

---

### Phase 5 — Booking Engine (COMPLETED)
**Goal:** Complete booking system with slot generation and double-booking prevention.

- [x] `modules/booking` — slot generation algorithm (Architecture §10.2: 30-min granularity, 15-min default buffer)
- [x] Availability API endpoint (`GET /api/booking/availability`)
- [x] Booking creation with transactional re-validation (§10.3) & `SLOT_NO_LONGER_AVAILABLE`
- [x] `EXCLUDE USING gist` constraint migration (`no_overlapping_bookings` on PostgreSQL)
- [x] `/book` page — service/package picker (`BookPickerClient.tsx`)
- [x] `/book/[service]` — date picker, slot picker, customer/vehicle details, review, confirm (`BookServiceWizard.tsx`)
- [x] `/booking/[id]` — confirmation/status page (read-only)
- [x] `.ics` calendar download (`/api/booking/[id]/ics`)
- [x] Conflict handling UX (slot taken between selection and submit: returns 409, shows alert, keeps inputs intact, refreshes available slots)
- [x] Admin bookings list + detail (status management)
- [x] Admin calendar (day/week/month views, per-resource lanes)
- [x] Admin-initiated reschedule and cancellation
- [x] Booking → Lead lineage (stores `leadId`, updates `Lead.status` to `BOOKED`, displays linked lead in admin modal)
- [x] `SlotPicker` and `DatePicker` components
- [x] Min lead-time enforcement (2 hours)
- [x] Same-day booking rules

**Deliverables:** Full booking engine, race-safe, server-validated, with admin calendar. (Verified with unit tests and live PostgreSQL integration).

---

### Phase 6 — Quotes (Formal)
**Goal:** Admin can issue, send, and track formal quotes.

- Admin quote creation with line items (`QuoteItem`)
- Quote lifecycle (DRAFT → SENT → ACCEPTED/DECLINED/EXPIRED)
- Printable/shareable quote view
- WhatsApp text summary generation
- Quote → Booking linkage
- Admin quotes list + detail/edit
- Live subtotal/discount/tax/total calculation

**Deliverables:** Complete quotation workflow.

---

### Phase 7 — Communication + Notifications
**Goal:** Event-driven notification system, WhatsApp deep links, communication logging.

- Notification event bus (`modules/notifications`)
- Admin notification feed (persistent, `Notification` table)
- Handler registry pattern (AdminFeedHandler, WhatsAppDeepLinkHandler stub)
- Communication logging (`Communication` table)
- WhatsApp CTA component (consistent across all touchpoints)
- Audit logging (`AuditLog` table, shared helper)

**Deliverables:** Every business action emits events, admin has a notification feed.

---

### Phase 8 — Gallery, Reviews, Offers (Content Management)
**Goal:** Admin can manage all content entities.

- Gallery CRUD (before/after pairs, video, tags, featured flag)
- Reviews CRUD (rating, publish/unpublish, featured flag)
- Offers CRUD (validity window, service/package linkage)
- Media upload flow (signed URLs via `/api/uploads/sign`)
- Admin gallery, reviews, offers pages

**Deliverables:** Full content management.

---

### Phase 9 — Polish
**Goal:** Production readiness.

- Loading states (Skeleton components on all list/detail pages)
- Empty states on all admin lists
- Error states (inline field errors, page-level retry, toasts)
- Confirmation modals for destructive actions
- Animations (per Design §10 — hover, entrance, `prefers-reduced-motion`)
- Mobile optimization pass (all breakpoints)
- Accessibility pass (contrast, keyboard nav, labels, landmarks, focus rings)
- Performance optimization (ISR/on-demand revalidation, image optimization, N+1 prevention)
- Complete SEO audit

**Deliverables:** Production-quality app.

---

### Phase 10 — Testing
**Goal:** Confidence in critical business logic.

- **Unit tests:** Booking slot generation, double-booking prevention, quote estimate rules, lead status transitions, authorization checks, validation schemas
- **Integration tests:** Booking creation with concurrent requests, lead creation with customer matching, quote lifecycle
- **E2E tests (Playwright):** Customer browse → quote submission, customer booking flow, admin login → manage lead → create booking
- Security review checklist
- Database review (indexes, constraints, migration integrity)

**Deliverables:** Test suite covering critical paths.

---

## 5. Risk Register

| Risk | Mitigation |
|---|---|
| `EXCLUDE USING gist` requires `btree_gist` extension — may not be available on all Postgres hosts | Check extension availability early; if unavailable, rely on application-level transactional locking (the belt without the suspenders — still safe, just less defense-in-depth) |
| Auth.js v5 + Prisma adapter: Auth.js v5 is relatively new, Prisma adapter may have edge cases | Pin versions, test auth flow thoroughly early |
| No real media storage in dev (local filesystem) | Acceptable for development; document S3 setup for production |
| Large schema (~25 models) — migration management | One initial migration with the full schema, then incremental changes only |

---

## 6. Immediate Next Step

**Awaiting your approval on this plan.**

Once approved, I will begin **Phase 1 (Foundation)** — setting up the Next.js project, design system, database schema, auth, and project structure. I'll report back with a full Phase 1 summary before moving to Phase 2.

> [!IMPORTANT]
> Key decision points where I need your input:
> 1. **Vehicle brand/model list**: Should I curate a list of ~50 Indian-market car brands + models, or do you have a specific list?
> 2. **Admin seed credentials**: Default `admin@smokecustoms.com` / `SmokeMCustoms2024!` — acceptable for dev?
> 3. **Local media storage for dev**: OK to use `public/uploads/` for development, with the S3 interface ready for production?
> 4. **Any brand assets** (logo, colors, fonts) to use instead of the provisional tokens in DESIGN.md?
