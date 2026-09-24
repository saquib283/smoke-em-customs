# PRD.md — Smoke M Customs
## Product Requirements Document

**Product:** Smoke M Customs — Premium Car Detailing & Customization Platform
**Doc owner:** Product/Architecture specification (for implementing engineering/AI agent)
**Status:** v1.0 — Ready for architecture & design handoff
**Related docs:** `ARCHITECTURE.md`, `DESIGN.md`

> **How to read the [ASSUMPTION] markers:** Wherever the source brief was silent or ambiguous, a reasonable, industry-standard decision was made and explicitly tagged `[ASSUMPTION]`. These are safe defaults for an Indian premium car-detailing business and can be revisited without changing the overall architecture.

---

## 1. Product Vision

Smoke M Customs will operate a single, production-grade web application that is simultaneously:

1. A **premium brand experience** that makes a visitor trust the shop with a ₹1–10 lakh vehicle before ever calling.
2. A **self-service quoting and booking engine** that converts an Instagram/Google visitor into a confirmed appointment without a phone call.
3. An **operational backbone** (CRM + calendar + resource management) that the owner/staff use every day to run the bay, follow up on leads, and never double-book a bay.

The long-term vision is a system that can later plug in AI-assisted recommendations and WhatsApp Business API automation without any structural rework — the MVP is deliberately built with those seams already in place, but does not depend on either to function.

## 2. Problem Statement

Premium car-detailing businesses in India (the reference business model) today typically rely on:

- Instagram DMs and phone calls for enquiries, which do not scale and lose leads.
- No structured way to capture vehicle condition/requirements before quoting, causing mismatched expectations and wasted site visits.
- Manual, calendar-less scheduling (a notebook or WhatsApp thread), which causes double-booking of bays and no-shows.
- No systematic way to nurture a lead that didn't convert immediately (follow-ups are ad hoc or forgotten).
- No searchable history of what was done to a specific car, complicating warranty/upsell conversations.

Smoke M Customs needs a system that removes these frictions for both the customer (fast, trustworthy, mobile-first self-service) and the business (structured CRM, booking calendar, resource protection, and a growing content asset in the form of before/after work).

## 3. Goals

**Business goals**
- G1. Increase qualified lead volume from digital channels (Instagram, Google, direct).
- G2. Reduce time-to-quote and time-to-booking for a new enquiry.
- G3. Eliminate double-booking and scheduling conflicts across bays/resources.
- G4. Build a reusable, searchable gallery/testimonial asset that compounds marketing value over time.
- G5. Give the owner a single dashboard for leads, bookings, and business health instead of scattered chats/notebooks.
- G6. Architect the system so WhatsApp automation and AI recommendations can be switched on later without a rebuild.

**User goals**
- G7. A visitor can understand services, see proof of quality work, and get a credible price range within minutes, on mobile.
- G8. A visitor can book an appointment slot without a phone call, and know exactly what to expect next.
- G9. Staff can see, at a glance, what's booked today/this week and act on new leads without missing follow-ups.

## 4. Non-Goals (MVP)

- NG1. Full payment gateway / online-payment capture (advance payment) — **[ASSUMPTION]** deferred to Phase 2; MVP supports "payment status" as a manually-updated admin field (cash/UPI/POS taken in person) only.
- NG2. Native mobile apps (iOS/Android) — web-only, responsive.
- NG3. Multi-location / multi-branch support — MVP is single-location. Architecture should not preclude it (see `ARCHITECTURE.md` §Scalability) but no multi-tenant UI is built now.
- NG4. Automated WhatsApp Business API messaging — MVP uses `wa.me` deep links and admin-triggered manual messaging; the automation *boundary* is architected but not implemented (see WhatsApp Requirements, §12).
- NG5. AI-generated recommendations in production traffic — the *interface* is built (see §13), but MVP recommendation logic is deterministic/rules-based, not ML/LLM-based.
- NG6. Inventory/parts management, staff payroll, accounting/invoicing beyond a basic quote/amount field.
- NG7. Public customer login/portal with self-service history in MVP — **[ASSUMPTION]** customers are identified by phone number captured per booking; a full authenticated customer account portal is Phase 2 (see §16).

## 5. Target Users

### 5.1 Primary personas

**P1 — "Rohan," the prospective customer (Owner Persona)**
- 28–45, owns a mid-to-premium car (₹8L–₹60L range), found the brand via Instagram reels or Google search.
- Cares about: proof of quality (before/after), trust signals (reviews, warranty), a fast/no-friction way to get pricing, and not wasting a trip to the shop.
- Device: mobile, browsing in short bursts (commute, lunch break).

**P2 — "Admin/Owner" (Staff Persona)**
- Runs day-to-day operations: answers enquiries, quotes jobs, manages the bay calendar, follows up on leads, updates job status.
- Cares about: not double-booking, not losing a lead, seeing today's/this week's schedule instantly, minimal data entry.
- Device: mix of desktop (during quiet hours, for gallery/catalogue management) and mobile (on the shop floor, checking today's bookings).

### 5.2 Secondary personas

**P3 — Returning customer** — books a follow-up service (e.g., PPF maintenance), wants to reuse known vehicle details.
**P4 — Referral/high-intent lead** — arrives with a specific ask (e.g., "PPF for my new Creta") and wants to skip generic browsing and go straight to quote/booking.

## 6. User Journeys

### 6.1 Journey A — Browse → Quote → Book (primary conversion path)
1. Land on `/` via Instagram bio link or Google.
2. Scan hero, trust signals (reviews count/rating), and featured gallery.
3. Tap into `/services` or a specific service (e.g., PPF) → `/services/[slug]`.
4. Review description, benefits, starting price, before/after gallery, warranty.
5. Tap "Get a Quote" → `/quote` (Car Requirement Form).
6. Submit vehicle + requirement details (+ optional photos).
7. See an on-screen estimated price range / recommended package **[ASSUMPTION: rules-based estimate shown instantly]**, and a confirmation that the team will follow up on WhatsApp/call within a stated SLA (e.g., "within 2 hours").
8. Lead + Customer + Vehicle records are created server-side; admin sees it in `/admin/leads` as `NEW`.
9. Admin contacts customer, updates lead to `CONTACTED` → sends/records a `QUOTE_SENT`.
10. Customer either books directly online (if comfortable with the quoted package) via `/book`, or continues over WhatsApp/call and admin creates/confirms the booking on their behalf from the CRM.

### 6.2 Journey B — Direct booking (returning/decided customer)
1. Visitor already knows what they want → `/packages/[slug]` or `/services/[slug]` → "Book Now."
2. `/book/[service]`: select date → see available slots (respecting duration + buffer + bay capacity) → select slot.
3. Enter/confirm customer + vehicle details (minimal fields; returning customers matched by phone number **[ASSUMPTION]**).
4. Review booking summary (service, price estimate, date/time, duration, location, cancellation policy).
5. Confirm → `/booking/[id]` confirmation page + WhatsApp deep-link confirmation message pre-filled.
6. Booking appears in admin calendar as `PENDING_CONFIRMATION` or `CONFIRMED` depending on config **[ASSUMPTION: online bookings default to `PENDING_CONFIRMATION` until admin confirms, to protect against spam/fat-finger bookings]**.

### 6.3 Journey C — Admin daily operations
1. Admin logs into `/admin`.
2. Dashboard shows: today's bookings, new leads awaiting response, upcoming week at a glance, any no-shows/cancellations needing attention.
3. Admin triages `/admin/leads`: filters by `NEW`, opens a lead, sees vehicle + requirement, calls/WhatsApps customer (via deep link), logs a note, updates status.
4. Admin manages `/admin/calendar`: drags/reschedules a booking, blocks a date (holiday), or blocks specific time ranges (bay under maintenance).
5. Admin updates a completed job to `COMPLETED`, optionally triggers a review-request WhatsApp message.
6. Periodically, admin manages `/admin/gallery` (uploads before/after of completed jobs) and `/admin/reviews` (adds/publishes testimonials).

### 6.4 Journey D — Reschedule/cancel (customer-initiated)
1. Customer received a booking confirmation with a link/reference (`/booking/[id]` or a short reference code shared via WhatsApp).
2. **[ASSUMPTION]** MVP does not expose self-service cancel/reschedule UI to unauthenticated customers (risk of abuse without auth). Customer requests reschedule/cancellation via WhatsApp/call; admin performs the action in `/admin/bookings`. The `/booking/[id]` page is read-only status view. Self-service cancel/reschedule (with a signed link or OTP) is listed as Phase 2 (§16).

## 7. Features (Functional Scope Summary)

| # | Feature | MVP | Phase 2 | Phase 3 |
|---|---|---|---|---|
| F1 | Marketing site (home, about, contact) | ✅ | | |
| F2 | Service catalogue (admin-configurable) | ✅ | | |
| F3 | Package catalogue (admin-configurable) | ✅ | | |
| F4 | Car Requirement / Quote form | ✅ | | |
| F5 | Rules-based instant price estimate | ✅ | | |
| F6 | Manual/admin quotation workflow | ✅ | | |
| F7 | Booking with slot management | ✅ | | |
| F8 | Admin calendar (day/week/month) | ✅ | | |
| F9 | Lead/CRM pipeline | ✅ | | |
| F10 | Customer & vehicle records | ✅ | | |
| F11 | Gallery (before/after, video) | ✅ | | |
| F12 | Reviews/testimonials | ✅ | | |
| F13 | WhatsApp deep-link messaging | ✅ | | |
| F14 | In-app/admin notifications | ✅ | | |
| F15 | Offers/promotions module | ✅ (basic) | Enhanced targeting | |
| F16 | Admin auth (single role) | ✅ | Role/permission expansion | |
| F17 | Audit log | ✅ (core actions) | Full coverage | |
| F18 | WhatsApp Business API automation | | ✅ | |
| F19 | Online payment capture | | ✅ | |
| F20 | Customer self-service account/portal | | ✅ | |
| F21 | Self-service reschedule/cancel (signed link/OTP) | | ✅ | |
| F22 | AI-assisted recommendation engine | | | ✅ |
| F23 | Multi-location/branch support | | | ✅ |
| F24 | Staff roles beyond ADMIN (e.g., technician, front-desk) | | ✅ | |
| F25 | Loyalty/referral program | | | ✅ |

## 8. Functional Requirements

### 8.1 Public site
- FR-1: The system shall render a home page presenting brand value proposition, featured services/packages, featured gallery items, review highlights, and calls-to-action to Quote and Book.
- FR-2: The system shall list all **enabled** services at `/services`, each linking to a detail page `/services/[slug]` with description, starting price, duration, warranty, benefits, and gallery items tagged to that service.
- FR-3: The system shall list all **enabled, booking-eligible** packages at `/packages`, each linking to `/packages/[slug]` with included services, price, benefits, and terms.
- FR-4: The system shall render `/gallery` as a filterable (by service/brand/tag) grid of before/after items and videos, each with a detail view `/gallery/[slug]`.
- FR-5: The system shall render `/reviews` listing published reviews, filterable by service.
- FR-6: The system shall render `/offers` listing currently active, published offers.
- FR-7: `/about` and `/contact` shall present brand story, location/map, hours, and contact channels (phone, WhatsApp, Instagram).
- FR-8: All customer-facing pages must be indexable (SEO) except transactional pages containing personal data (`/booking/[id]`).

### 8.2 Car Requirement / Quote Form (`/quote`)
- FR-9: The system shall present a multi-step form collecting: customer info, vehicle info, requirement info, optional photo uploads (per §"Car Requirement Form" in the brief).
- FR-10: Every field's validation rules are defined in `ARCHITECTURE.md` §Backend Architecture; the mandatory minimum to submit is: customer name, mobile number, vehicle brand, vehicle model, service required, and preferred contact method. All else is optional but strongly encouraged via UI affordance (progress indicator, "why we ask this").
- FR-11: On submit, the system shall: (a) create or match a `Customer` by phone number, (b) create or match a `Vehicle` under that customer, (c) create a `Lead` in status `NEW` linked to both, (d) if photos are provided, store them via the media abstraction and link to the lead, (e) compute and display a rules-based estimated price range (see §13.2) if enough information is present, and (f) show a confirmation screen with next-step expectations and a WhatsApp deep link pre-filled with a summary.
- FR-12: Submission must succeed gracefully with partial data (e.g., no photos) — nothing beyond the mandatory minimum blocks submission.
- FR-13: Duplicate submissions (same phone number within a short window) shall not create duplicate `Customer` records; a new `Lead` may still be created and flagged as a possible duplicate for admin awareness **[ASSUMPTION: threshold = same phone + same vehicle within 24h → admin sees a "possible duplicate" badge rather than silent merge, to avoid losing information]**.

### 8.3 Booking
- FR-14: The system shall allow selection of a service or package, then a date, then present only valid, available time slots for that date given business hours, blocked dates/ranges, existing bookings, service duration, buffer time, and bay/resource capacity (full algorithm in `ARCHITECTURE.md` §Booking Engine).
- FR-15: The system shall never allow two confirmed/pending bookings to be created for overlapping time on the same bay/resource (enforced at the database layer via constraint/locking, not just UI).
- FR-16: A booking requires: service/package selection, date+slot, customer details (name, phone, optional email), vehicle details. Returning customers (matched by phone) shall have vehicle/customer fields pre-fillable.
- FR-17: On booking creation, the system shall generate a booking confirmation view (`/booking/[id]`) and a WhatsApp deep-link confirmation message.
- FR-18: Bookings created through the public site default to status `PENDING_CONFIRMATION` **[ASSUMPTION, configurable per service — e.g., a returning, known customer could theoretically auto-confirm, but MVP default is manual confirmation for all]**. Admin-created bookings (from CRM) default to `CONFIRMED`.
- FR-19: The system shall support booking statuses: `PENDING_CONFIRMATION`, `CONFIRMED`, `RESCHEDULED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.
- FR-20: The system shall support admin-initiated reschedule (choosing a new valid slot, old slot released) and cancellation (slot released, reason captured).
- FR-21: The system shall prevent booking into a past date/time slot.
- FR-22: The system shall respect a configurable minimum lead time for same-day bookings (e.g., no bookings within the next N hours) **[ASSUMPTION default N = 2 hours, admin-configurable]**.

### 8.4 CRM / Lead Management
- FR-23: The system shall maintain a lead pipeline with statuses `NEW → CONTACTED → QUOTE_SENT → FOLLOW_UP → BOOKED → COMPLETED`, plus a terminal `LOST` status reachable from any non-terminal state.
- FR-24: Admin shall be able to search/filter leads by status, date range, service interest, and assigned staff **[ASSUMPTION: "assignment" exists as a field for future multi-staff use even though MVP has one admin role]**.
- FR-25: Admin shall be able to add free-text notes (timestamped, author-tagged) to a lead, and see full history: quotations issued, appointments, and (where available) communications logged.
- FR-26: Converting a lead to a booking shall preserve lineage (the `Booking` references the originating `Lead`, where applicable) for reporting.
- FR-27: A lead not touched within a configurable period **[ASSUMPTION: 3 days]** shall be visually flagged in the admin UI as needing follow-up (computed at read-time; no background job required for MVP — see `ARCHITECTURE.md` for a note on optional future job scheduling).

### 8.5 Quotation
- FR-28: The system shall support two quote origins: (a) system-computed estimate range shown instantly on the quote form, and (b) admin-issued formal quote with line items, discount, tax, validity date, and notes.
- FR-29: A formal `Quote` shall have status `DRAFT → SENT → ACCEPTED / DECLINED / EXPIRED`.
- FR-30: A quote shall be linked to a `Lead` and optionally to specific `Service`/`Package` line items (`QuoteItem`).
- FR-31: Admin shall be able to mark a quote as sent (which also updates the linked lead to `QUOTE_SENT` where applicable) and generate a shareable summary (WhatsApp text and/or printable/PDF view) **[ASSUMPTION: PDF export of a quote is a nice-to-have; MVP requires only a clean printable web view + WhatsApp text summary; PDF generation flagged Phase 2 unless trivial to add via existing tooling]**.

### 8.6 Admin — Service & Package Management
- FR-32: Admin shall be able to create/edit/enable/disable a `Service` with: name, slug, description, category, starting price, duration, warranty text, benefits (list), images, videos, and booking-availability flag.
- FR-33: Admin shall be able to create/edit/enable/disable a `Package` with: name, slug, description, price/starting price, duration, included services (many-to-many), benefits, warranty, validity, images, terms, booking-eligibility flag.
- FR-34: Disabling a service/package hides it from public catalogue pages but preserves historical references (past leads/bookings/quotes keep their linkage — soft-disable, not delete).

### 8.7 Admin — Gallery & Reviews
- FR-35: Admin shall be able to upload/manage gallery items with before/after image pairs and/or video, tagged by service, vehicle brand/model, and free-form tags, with a "featured" flag controlling homepage prominence.
- FR-36: Admin shall be able to create/edit/publish/unpublish reviews with customer name, rating (1–5), text, linked service/vehicle, optional image, date, and "featured" flag.

### 8.8 Admin — Offers
- FR-37: Admin shall be able to create/edit/enable/disable an `Offer` with title, description, validity window (start/end), and optional linkage to specific services/packages. Expired offers auto-hide from public pages based on validity window at read-time.

### 8.9 Admin — Dashboard & Calendar
- FR-38: The dashboard shall summarize: today's bookings, this week's bookings, new/unattended leads count, upcoming follow-ups due, and (if available) recent reviews.
- FR-39: The calendar shall support day, week, and month views, showing bookings by bay/resource with color-coded status, and support click-through to booking detail, plus creation of a blocked date/time range.

### 8.10 Notifications
- FR-40: The system shall maintain an in-admin notification feed for events: new lead submitted, new booking (pending confirmation), booking cancelled by admin action, lead flagged for follow-up.
- FR-41: Customer-facing notifications for MVP are delivered via WhatsApp deep-link (customer-initiated send is not possible server-side without API access) or SMS/email **[ASSUMPTION: email is optional-channel since email field is optional; WhatsApp deep-link/manual is the primary MVP channel — see §12]**.

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Public pages (home, service/package listing) should achieve good Core Web Vitals (LCP < 2.5s on 4G mid-tier mobile); server-rendered/streamed where practical. |
| SEO | Public catalogue, gallery, and content pages must be server-rendered/statically generated with correct metadata, structured data (LocalBusiness, Service schema), sitemap, and robots.txt. |
| Accessibility | WCAG 2.1 AA target for public pages: color contrast, keyboard navigation, form labels, alt text fields mandatory on media uploads. |
| Responsiveness | Mobile-first; booking flow must be fully usable one-handed on a standard phone viewport. |
| Reliability | Booking creation must be atomic/consistent — no double-booked slots even under concurrent submissions (see Architecture, slot-locking strategy). |
| Scalability | Architecture must support single-location MVP scaling to moderate traffic without redesign; must not preclude later multi-location support. |
| Observability | Structured logging of key business events (lead created, booking created/changed status, quote sent) and application errors; admin-visible audit log for sensitive actions. |
| Security | See `ARCHITECTURE.md` §Security — admin auth, RBAC-ready authorization, input validation, file upload validation, rate limiting on public forms. |
| Data integrity | Soft-deletion for customer-facing catalogue/content entities that may be historically referenced; hard constraints for booking uniqueness. |
| Maintainability | Modular monolith; entities/services must not be hardcoded (per brief) — services, packages, and offers are fully admin-managed data, not code constants. |

## 10. Booking Requirements (Consolidated)

- BR-1: Business operates within configurable `BusinessHours` (per day of week, with possible split shifts — e.g., 10:00–14:00, 15:00–19:00 **[ASSUMPTION: split shifts supported for lunch break, common for Indian auto-service businesses]**).
- BR-2: `BlockedDate` (full-day, e.g., festival holiday) and `BlockedTimeRange` (partial-day, e.g., bay under maintenance 14:00–16:00) are both supported, admin-managed.
- BR-3: The business has one or more `Resource`/bay entities, each with independent availability; a slot is only offered if at least one compatible resource is free for the full service duration + buffer.
- BR-4: Each `Service`/`Package` has its own duration (minutes) used for slot-length and end-time calculation; buffer time (default **[ASSUMPTION: 15 minutes]**, admin-configurable globally and optionally per-service) is added after each booking before the next may start on that resource.
- BR-5: Same-day booking is allowed subject to a minimum lead-time (§8.3, FR-22).
- BR-6: Cancellation and rescheduling are admin-mediated in MVP (§6.4); the underlying slot is released back to availability immediately on cancel/reschedule.
- BR-7: A resource's daily capacity is `BusinessHours` window minus blocked ranges, discretized into bookable slots per service duration.

## 11. CRM Requirements (Consolidated)

- Full pipeline per §8.4; every `Lead` must be traceable to a `Customer` and (if vehicle info given) `Vehicle`.
- History view: for any `Customer`, admin can see all `Vehicle`s, `Lead`s, `Quote`s, `Booking`s across time — this is the "single customer view" required for good service and upsell.

## 12. Quote Requirements (Consolidated)

Per §8.5. Additionally:
- QR-1: An instant estimate (shown on `/quote` submit) must be clearly labeled as an **estimate, not a final price** ("Final price confirmed after inspection").
- QR-2: A formal admin `Quote` becomes the "source of truth" price once issued and may differ from the instant estimate.

## 13. Admin Requirements (Consolidated)

Covered across §8.6–§8.9. Additionally:
- AR-1: All admin routes require authentication; unauthenticated access redirects to `/admin/login`.
- AR-2: All state-changing admin actions (status changes, deletes/disables, reschedules, quote issuance) are recorded in an audit log with actor, timestamp, before/after where practical.

## 14. Notifications Requirements

Per §8.10. Notification *architecture* (event bus / triggers) must be generic enough to add channels (email, SMS, WhatsApp API) later by registering new handlers, without changing the event-producing code (see `ARCHITECTURE.md` §Notification Architecture).

## 15. Future AI Functionality (Non-binding for MVP)

The system shall define (not implement in production traffic) a `RecommendationEngine` interface that, given a vehicle + condition + requirement + budget, returns a ranked list of `{service/package, confidence, rationale}`. MVP implements this interface with a deterministic rules engine (e.g., "vehicle value + PPF requirement + budget ≥ X → recommend Premium PPF package"). Swapping the rules engine for an LLM-based implementation later must require no changes to callers (§13, `ARCHITECTURE.md` §AI Integration Boundary). Example output shape:

```json
{
  "vehicle": { "brand": "BMW", "model": "3 Series", "year": 2023 },
  "recommendation": {
    "packageSlug": "premium-ppf",
    "confidence": 0.82,
    "rationale": "Based on the selected condition and requirement, Premium PPF is recommended for a 2023 BMW 3 Series."
  },
  "alternatives": [{ "packageSlug": "ultimate-ppf", "confidence": 0.61 }]
}
```

## 16. MVP Scope

**In scope (MVP / Phase 1):**
All of F1–F17 from §7; full booking engine with slot generation and double-booking prevention; full CRM pipeline; manual quote workflow + instant rules-based estimate; gallery/reviews/offers admin management; WhatsApp deep-link integration; single ADMIN role auth; core audit logging; media storage abstraction (with one concrete provider implementation — see Architecture).

## 17. Phase 2

- WhatsApp Business API automation (auto-send confirmations, reminders, review requests).
- Online payment capture (advance/booking deposit) via a payment gateway (e.g., Razorpay — **[ASSUMPTION]** common for Indian businesses; to be confirmed).
- Customer self-service portal (view own bookings/history, reschedule/cancel via signed link or OTP).
- Multi-staff roles (technician, front-desk) with narrower permissions, and lead assignment routing.
- PDF quote generation and emailed quotes.
- Enhanced offer targeting (e.g., first-time customer, vehicle-brand-specific).
- Background job scheduler for proactive follow-up reminders (rather than read-time flagging).

## 18. Phase 3

- AI-assisted recommendation engine (LLM or ML-based), replacing/augmenting the rules engine behind the same interface.
- Multi-location/branch support (per-location resources, hours, catalogue overrides).
- Loyalty/referral program.
- Advanced analytics/BI dashboard (funnel conversion, LTV, channel attribution).

## 19. Acceptance Criteria (Representative, per major feature)

**Quote form**
- AC-1: Given a visitor fills only the mandatory fields and submits, a `Lead`, `Customer`, and (if vehicle brand/model given) `Vehicle` are created, and the visitor sees a confirmation screen within the same request cycle.
- AC-2: Given a visitor uploads 3 photos, all 3 are retrievable from the admin lead detail view.

**Booking**
- AC-3: Given a service with 90-minute duration and 15-minute buffer, and a single resource, the system shall not offer two slots less than 105 minutes apart on that resource for that day.
- AC-4: Given two customers attempt to book the same last remaining slot within the same second, exactly one booking succeeds and the other sees a "slot no longer available, please pick another" message with a refreshed slot list.
- AC-5: Given a date fully blocked by `BlockedDate`, no slots are offered for that date and the UI communicates why (e.g., "Closed on this date").

**CRM**
- AC-6: Given a lead has had no note/status change in 3+ days and is not `BOOKED`, `COMPLETED`, or `LOST`, it is visually flagged in `/admin/leads`.

**Admin auth**
- AC-7: Given an unauthenticated request to any `/admin/*` route (except `/admin/login`), the system redirects to login and the original destination is preserved for post-login redirect.

## 20. Edge Cases

- EC-1: Visitor submits the quote form with a phone number already associated with an existing `Customer` — system must match, not duplicate, the customer (see FR-13).
- EC-2: Admin disables a `Service` that has active future bookings — existing bookings must remain intact and viewable; only new bookings are blocked (see FR-34).
- EC-3: A booking's resource becomes unavailable after confirmation (e.g., emergency `BlockedTimeRange` added) — system must surface a conflict list to admin for manual resolution rather than silently failing (no automatic re-booking without human review, given trust/communication implications).
- EC-4: Vehicle year is outside a plausible range (e.g., "1800" or a future year) — must be client- and server-validated.
- EC-5: Photo upload fails mid-submission (network drop) — form submission must still succeed with whatever photos completed upload; failed ones are reported to the user, not silently dropped without notice.
- EC-6: Same customer books two different vehicles for overlapping times on the same day — allowed (different bookings, different vehicles), but flagged in admin view if it looks like a possible data-entry duplication of the same vehicle.
- EC-7: Package includes a service that has since been disabled — the package detail page must still render (showing included services as historically defined) but the disabled service's own standalone booking is blocked; package booking itself is governed only by the package's own `bookingEligible` flag.
- EC-8: Admin reschedules a booking to a slot that no longer fits (date is now blocked) — system must reject the reschedule with a clear error before persisting.
- EC-9: Timezone — all business hours, slots, and bookings are in a single fixed timezone **[ASSUMPTION: Asia/Kolkata, IST, no DST, single location, so no timezone-selection UI is needed]**.

## 21. Assumptions Log (Consolidated)

| # | Assumption | Rationale |
|---|---|---|
| A1 | Payment capture is manual/offline in MVP | No payment gateway specified in brief; avoids scope creep and compliance overhead pre-launch |
| A2 | Public bookings default to `PENDING_CONFIRMATION` | Protects bay capacity from spam/errors until human confirms |
| A3 | No customer login/portal in MVP | Reduces MVP surface area; customers identified by phone |
| A4 | Single timezone, single location | Matches described business; architecture doesn't preclude expansion |
| A5 | Default buffer time = 15 min, follow-up flag threshold = 3 days, min same-day lead time = 2h | Reasonable operational defaults, all admin-configurable |
| A6 | Brand colors are provisional/configurable design tokens | No verified brand color source was available; see `DESIGN.md` |
| A7 | WhatsApp integration = deep links in MVP, API automation in Phase 2 | Business API requires approval/cost; boundary is architected now, implemented later |
| A8 | AI recommendation = rules engine behind a stable interface in MVP | Brief explicitly asks AI not be mandatory for initial architecture |

---
*End of PRD.md — see `ARCHITECTURE.md` for system design and `DESIGN.md` for UX/visual specification. A cross-document traceability check is included at the end of `ARCHITECTURE.md`.*
