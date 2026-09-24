# DESIGN.md — Smoke M Customs
## Design & UX Specification

**Related docs:** `PRD.md`, `ARCHITECTURE.md`

> **Provisional brand tokens notice:** No verified, licensed brand color/typography source for "Smoke M Customs" was available to this specification (the Instagram handle and reference site were provided only for journey/IA understanding, per the brief's explicit instruction not to copy their design). All color values, exact typefaces, and imagery direction below are therefore **provisional, configurable design tokens** — intended to be swapped for verified brand assets (logo files, brand guideline, actual photography) during implementation without any structural rework, since every component consumes tokens, never hardcoded values.

---

## 1. Design Principles

1. **Trust before conversion.** Every screen a prospective customer sees before paying/booking must visually earn confidence with an expensive vehicle: clean photography, precise typography, no clutter, no stock-photo feel.
2. **Clarity over cleverness.** A visitor deciding whether to trust a shop with their car should never wonder "what happens if I tap this." Every primary action states its consequence (e.g., "Get My Free Quote," not "Submit").
3. **Minimum friction, maximum confidence.** Collect only what's needed at each step (per PRD FR-10); always show progress; always confirm what happens next.
4. **Dark, premium, automotive — not gimmicky.** Dark surfaces let vehicle photography and gloss/paint finishes read as the hero, the way a showroom uses lighting, not decoration, to sell the car.
5. **Fast and restrained motion.** Animation supports orientation (state changes, page transitions) and delight in small doses (hover, gallery reveal) — never blocks interaction, never repeats/loops attention-grabbing motion near forms or booking flows.
6. **One visual language, two audiences.** The admin panel shares the same design system (tokens, components) as the public site for engineering efficiency and brand consistency, but is laid out for density/efficiency (data tables, compact forms) rather than persuasion.

## 2. Brand Direction

- **Positioning:** premium, precise, technical-but-approachable — closer to a specialist workshop/atelier than a mass-market service center.
- **Tone of voice:** confident, specific, non-hype. Prefer "Ceramic coating with a 5-year warranty" over "The BEST coating in town!"
- **Photography direction [ASSUMPTION — pending real shop photography]:** dark/moody studio-lit vehicle shots, extreme close-ups on paint gloss/panel gaps/wrap edges to communicate craftsmanship, consistent before/after framing (same angle, same lighting) for gallery credibility.
- **Logo usage:** placeholder wordmark treatment (`SMOKE M CUSTOMS`, tracked-out uppercase) until a real logo file is supplied; component library reserves a header logo slot sized for an eventual mark + wordmark lockup.

## 3. Visual Language & Color Tokens

All colors defined as CSS custom properties / design tokens, dark-mode-first (matches "dark/luxury" direction in the brief), with a light surface reserved for print/quote-export contexts only.

```css
:root {
  /* Surfaces */
  --color-bg-base: #0B0C0E;        /* app background, near-black */
  --color-bg-elevated: #16181C;    /* cards, panels */
  --color-bg-elevated-2: #1F2227;  /* nested cards, modals */
  --color-border: #2A2D33;

  /* Text */
  --color-text-primary: #F4F5F6;
  --color-text-secondary: #A6ABB3;
  --color-text-muted: #6E7480;

  /* Brand accent — PROVISIONAL, swap for verified brand color */
  --color-accent: #C9A24B;         /* muted brushed-gold, "premium automotive" cue */
  --color-accent-hover: #D9B562;
  --color-accent-contrast: #14120A;

  /* Secondary accent (used sparingly — links, focus, info) */
  --color-accent-cool: #4B8FC9;    /* PROVISIONAL secondary — used for informational/secondary CTAs only */

  /* Semantic */
  --color-success: #3FAE6A;
  --color-warning: #D9A441;
  --color-danger: #E15B5B;
  --color-info: #4B8FC9;

  /* Status colors (booking/lead pipeline — mapped 1:1 to enums in ARCHITECTURE.md) */
  --status-new: #4B8FC9;
  --status-contacted: #C9A24B;
  --status-quote-sent: #9A7BD1;
  --status-follow-up: #D9A441;
  --status-booked: #3FAE6A;
  --status-completed: #6E7480;
  --status-lost: #E15B5B;
  --status-pending-confirmation: #D9A441;
  --status-confirmed: #3FAE6A;
  --status-rescheduled: #4B8FC9;
  --status-cancelled: #E15B5B;
  --status-no-show: #9A5B5B;
}
```

Rationale for the muted-gold accent over a louder color: it reads premium/automotive (brushed metal, trim) without competing with vehicle photography's own reds/blues/blacks, and holds up on a near-black background for AA contrast on text-on-accent use cases.

## 4. Typography

- **Display/headings [ASSUMPTION]:** a condensed, high-contrast grotesque (e.g., a self-hosted or Google-Fonts equivalent of *Archivo Expanded/Condensed* or *Oswald*) — evokes automotive signage/number-plate precision without being a novelty font.
- **Body/UI [ASSUMPTION]:** a neutral, highly legible grotesque (e.g., *Inter* or *Manrope*) for all body copy, forms, and admin UI — optimized for small-screen legibility over character.
- **Scale (fluid, `clamp()`-based for responsive headings):**

| Token | Usage | Size (desktop / mobile) |
|---|---|---|
| `--text-display` | Hero H1 | 56px / 34px |
| `--text-h1` | Page titles | 40px / 28px |
| `--text-h2` | Section titles | 28px / 22px |
| `--text-h3` | Card/subsection titles | 20px / 18px |
| `--text-body-lg` | Lead paragraph | 18px / 16px |
| `--text-body` | Default body/UI | 16px |
| `--text-body-sm` | Secondary/meta text | 14px |
| `--text-caption` | Labels, badges, timestamps | 12px |

- Line height: 1.15–1.2 for headings, 1.5–1.6 for body.
- Letter-spacing: slight positive tracking (0.02–0.04em) on all-caps labels/badges/nav for the "precision" cue; none on body copy.

## 5. Spacing, Radius, Shadow

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px; --space-9: 96px;

  --radius-sm: 6px;   /* inputs, badges, small buttons */
  --radius-md: 12px;  /* cards, buttons */
  --radius-lg: 20px;  /* large surfaces, modals, feature cards */
  --radius-pill: 999px; /* pills, status badges */

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.45);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
}
```

An 8px base grid governs all component internal spacing; page-level section spacing uses `--space-7`–`--space-9` to give photography room to breathe (premium brands under-crowd, not over-crowd).

## 6. Component Inventory

Shared library in `src/components/ui`, consumed by both public and admin surfaces:

| Component | Key states/variants |
|---|---|
| `Button` | primary (accent-filled), secondary (outline), ghost, destructive; sizes sm/md/lg; loading state (spinner replaces label, width preserved to avoid layout shift) |
| `Card` | default, interactive/hoverable (service/package/gallery cards), elevated (modals) |
| `Input` / `Textarea` / `Select` | default, focused, error (red border + inline message), disabled |
| `FormField` | label + control + helper text + error slot, consistent across public and admin forms |
| `StepIndicator` | horizontal steps for quote/booking multi-step flows, shows completed/current/upcoming |
| `DatePicker` | calendar-grid based, disables past dates and fully blocked dates (visually struck-through, not just disabled, so the customer understands *why*) |
| `SlotPicker` | pill grid of available times for a selected date; disabled/hidden once a slot is taken by another user (re-fetched on selection attempt per Architecture §10.3) |
| `CalendarGrid` (admin) | day/week/month views, color-coded booking status pills (mapped to status tokens §3) |
| `Modal` | confirmation dialogs (cancel booking, disable service), scroll-locked background |
| `Table` (admin) | sortable headers, row hover, compact/comfortable density toggle for leads/bookings/customers lists |
| `Badge` | status badges (color per §3 status tokens), category tags |
| `Toast` | success/error/info, auto-dismiss with manual close, used for admin action confirmations (non-blocking) |
| `EmptyState` | icon/illustration slot + message + primary action (e.g., "No leads yet") |
| `Skeleton` | shimmer placeholders for cards/tables during data fetch |
| `ImageCompare` (before/after) | slider or side-by-side toggle for gallery items |
| `StarRating` | display-only for reviews, 1–5 |
| `WhatsAppCTA` | consistent icon+label button wrapping `buildDeepLink()` output, used everywhere a WhatsApp touchpoint appears |

## 7. Customer UX — Navigation

- **Header (public):** logo (left) · primary nav (Services, Packages, Gallery, Reviews, About) (center/left-of-actions) · WhatsApp icon button + "Get a Quote" primary CTA (right). Sticky on scroll, condenses height after scroll past hero.
- **Mobile nav:** hamburger → full-screen overlay menu; "Get a Quote" and "Book Now" remain as a **persistent bottom sticky action bar** on mobile for all catalogue/content pages (not the homepage hero, to avoid competing with the hero CTA) — this is the single highest-leverage conversion pattern for a mobile-first, decision-fast audience (PRD G7/G8).
- **Footer:** service links, contact/location/hours, Instagram + WhatsApp, privacy/terms links.

## 8. Admin UX — Navigation

- **Left sidebar (desktop) / bottom tab + drawer (mobile, PRD notes admin also checks on-shop-floor mobile):** Dashboard, Leads, Customers, Vehicles, Quotes, Bookings, Calendar, Services, Packages, Gallery, Reviews, Offers, Resources, Notifications, Settings — grouped visually into **Operate** (Dashboard, Leads, Quotes, Bookings, Calendar), **Manage** (Customers, Vehicles, Services, Packages, Gallery, Reviews, Offers, Resources), **System** (Notifications, Settings).
- Top bar: search (global — leads/customers/bookings by name/phone), notification bell (badge count from `Notification.isRead=false`), admin account menu.
- Breadcrumbs on all detail pages (`Leads / Rohan Mehta`).

## 9. Responsive Behavior

- Breakpoints: `sm` 480px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.
- Public site is designed mobile-first (base styles = mobile), progressively enhanced up; admin tables collapse to stacked "card rows" below `md` (each row's cells become labeled stacked fields rather than horizontal scroll, except the calendar, which gets a dedicated compact mobile agenda-list view instead of a squeezed grid).
- Touch targets ≥ 44×44px throughout, especially the `SlotPicker` and admin calendar interactions.

## 10. Animation Principles

- Durations: micro-interactions (hover, button press) 120–150ms; content reveals (gallery image load, card entrance on scroll) 200–300ms; page-level transitions none beyond native browser navigation (no heavy route-transition choreography that would delay perceived load).
- Easing: standard ease-out for entrances, ease-in-out for toggles/expansions.
- Before/after gallery slider: direct-manipulation drag, no auto-play looping (auto-animating before/after images reads gimmicky and undermines the "trust" principle, §1).
- Respect `prefers-reduced-motion`: disable non-essential motion (parallax/entrance animations), keep functional motion (loading spinners, focus indication).

## 11. Page-by-Page Design Specification

### `/` — Home
1. **Hero:** full-bleed dark vehicle photography, headline (brand value prop), subhead, two CTAs ("Get a Free Quote" primary, "Explore Services" secondary), trust strip below fold-line (e.g., "★ 4.9 · 500+ vehicles detailed · 5-yr PPF warranty" — values pulled from actual review/gallery counts, not invented copy).
2. **Services overview:** 3–6 top-level service cards (icon/photo, name, one-line benefit, starting price, link).
3. **Featured gallery:** 4–6 before/after highlights (`GalleryItem.isFeatured`), link to `/gallery`.
4. **Packages teaser:** 2–3 package cards with price and top 3 benefits.
5. **Reviews strip:** 3 featured reviews (`Review.isFeatured`), star rating, short quote, vehicle.
6. **Offers banner** (conditional — only rendered if an active `Offer` exists).
7. **How it works:** 3–4 step strip (Quote → Confirm → Book → Drive away) setting expectations up front (PRD G8).
8. **Final CTA band + contact/location summary.**

### `/services` & `/services/[slug]`
- Listing: filterable grid (category, if used) of enabled services, each card = image, name, starting price, duration, "From ₹X."
- Detail: hero image/gallery for that service, full description, benefits list (checkmarks), warranty callout, duration, starting price, before/after items tagged to this service, related packages that include it, sticky "Get a Quote for this Service" CTA (pre-fills `serviceInterest` on the quote form).

### `/packages` & `/packages/[slug]`
- Same listing pattern as services; detail page emphasizes **included services** (checklist referencing each `Service`), price vs. starting price distinction, validity/terms, and a direct "Book This Package" CTA (routes to `/book/[package-slug]`, skipping the generic picker) alongside "Ask a Question" WhatsApp CTA.

### `/gallery` & `/gallery/[slug]`
- Filter bar: service, vehicle brand, tag.
- Grid of `ImageCompare` cards (before/after slider thumbnail); video items show a play-icon overlay.
- Detail page: full `ImageCompare`, vehicle brand/model, linked service, tags, related gallery items.

### `/reviews`
- Aggregate rating header (computed from published reviews), filter by service, list of review cards (`StarRating`, body, customer name, vehicle, date, optional photo).

### `/offers`
- List of active `Offer` cards with validity countdown/date range and linked service/package CTA.

### `/about`
- Brand story, workshop photography, certifications/warranty partners if any, team (optional).

### `/contact`
- Address + embedded map, hours (rendered from `BusinessHours`), phone (tel: link), WhatsApp CTA, Instagram link, simple contact form (name, phone, message — lighter-weight than the full quote form, for general enquiries).

### `/quote` — Car Requirement Form (see also §12 Quote UX)
- Multi-step form per `StepIndicator`; detailed in §12.

### `/book` and `/book/[service]` (see also §13 Booking UX)
- Detailed in §13.

### `/booking/[id]`
- Read-only confirmation/status view: service/package, date/time, status badge, vehicle, location/hours, "Add to Calendar" (.ics download — light client-side generation, no backend dependency), WhatsApp CTA to reach the shop, cancellation/reschedule instructions (directs to WhatsApp/call per PRD §6.4 — no self-service buttons in MVP).

### `/privacy`, `/terms`
- Standard long-form content pages using the shared content/typography styles.

## 12. Quote UX (Car Requirement Form)

**Steps (mapped 1:1 to PRD §8.2 field groups, each step optional to skip past the mandatory minimum):**

1. **What do you need?** — service interest (chips, multi-context aware if arrived from a service/package detail page — pre-filled and skippable), desired result (short text).
2. **Tell us about your vehicle** — brand, model, variant, year, vehicle type; brand/model as searchable selects (not free type where avoidable, to keep data clean for admin/CRM matching), all else optional.
3. **Current condition** (all optional, clearly labeled "helps us quote accurately, skip if unsure") — existing scratches (yes/no), paint condition (short select: good/fair/poor), existing coating/PPF (yes/no + text), budget range (a segmented range control, not a raw number field — lowers friction and anxiety of "wrong" answer), preferred date, additional notes, photo upload (drag/tap area, multi-file, progress per file, PRD EC-5 partial-failure tolerant).
4. **Your details** — name, mobile (with WhatsApp-style formatting help), email (optional), preferred contact method (chip select: Call/WhatsApp/Email).
5. **Review & submit** — summary of all entered info, edit-in-place links back to each step, submit button labeled "Get My Free Estimate."

**Result screen (same route, post-submit state, not a redirect — preserves scroll/context):**
- If enough info was given: an estimate range card ("Estimated ₹X – ₹Y") clearly labeled *"Estimate only — final price confirmed after inspection"* (PRD QR-1), plus the matched recommended package/service with a one-line rationale (from `RecommendationEngine`/rules engine, Architecture §16).
- Always: a confirmation message ("Our team will reach out within 2 hours") + a prominent WhatsApp CTA pre-filled with a summary of what was submitted, so the customer can immediately continue the conversation on their preferred channel if they don't want to wait.
- Secondary CTA: "Prefer to book directly?" → `/book` (for confident/returning customers who don't need to wait for a quote).

## 13. Booking UX

1. **Service/package selection** (`/book`, skipped if arriving via a "Book This Package/Service" deep link from a detail page): searchable/filterable list, same card style as catalogue listing.
2. **Date selection:** `DatePicker`, current month default, past dates and `BlockedDate` disabled+struck-through with tooltip reason where provided ("Closed — Diwali"), next available date auto-suggested if today has no slots.
3. **Time selection:** `SlotPicker` populated from the availability endpoint for the chosen date+service/package (Architecture §7); empty state ("No slots left this day — try another date") if none remain; slot grid groups by Morning/Afternoon/Evening for scannability.
4. **Your details:** name, mobile (returning customer lookup — if the phone number matches an existing `Customer`, offer "Is this you, Rohan?" with pre-filled saved vehicles to pick from, else fresh vehicle fields), vehicle brand/model/variant/year, notes (optional).
5. **Review:** service/package, price (starting price or quoted price if arriving from an accepted quote), date/time, duration, location, cancellation policy text, confirm button ("Confirm Booking").
6. **Confirmation:** redirect to `/booking/[id]`; status shown as "Pending Confirmation — we'll confirm shortly" (PRD FR-18) with clear explanation this is normal, not an error, plus WhatsApp CTA.

**Conflict handling (Architecture §10.3):** if the chosen slot is taken between selection and submit, the review/confirm step surfaces an inline, non-alarming message ("That time was just taken — here are the next available times") and re-renders the `SlotPicker` in place rather than a generic error page, preserving all other entered form data.

## 14. CRM UX (Admin)

- **Leads list (`/admin/leads`):** table/card-hybrid (cards on mobile per §9), columns: customer, vehicle, service interest, status badge, last activity, follow-up-needed flag (a small warning dot, computed per Architecture §11), filters (status, date range, service). Row click → detail.
- **Lead detail (`/admin/leads/[id]`):** header (customer/vehicle summary, status dropdown, WhatsApp/call quick actions), tabbed or stacked sections: Requirement details (from the quote form, including photos in a lightbox grid), Timeline (merged notes/status-history/communications/quotes/bookings, newest first), Add Note composer, "Create Quote" and "Create Booking" actions.
- **Customers (`/admin/customers`) & detail:** single customer view aggregating all vehicles, leads, quotes, bookings — the "single customer view" from PRD §11.
- **Quotes (`/admin/quotes`) & detail/edit:** line-item editor (`QuoteItem` add/remove/edit with live subtotal/discount/tax/total calculation), status control, "Mark as Sent" (generates WhatsApp-ready text + printable view), validity date picker.
- **Bookings (`/admin/bookings`) & detail:** status control with the full `BookingStatus` set as clearly labeled actions (Confirm, Reschedule, Cancel, Mark Complete, Mark No-Show), internal notes field (distinct from customer-visible notes), linked lead/quote/customer/vehicle quick-links.
- **Calendar (`/admin/calendar`):** day/week/month toggle, per-resource lanes (swimlanes) in day/week view so bay conflicts are visually obvious even before the system-level guarantee kicks in, click-to-create a booking or a `BlockedTimeRange` directly on the grid, drag-to-reschedule (with the same transactional re-validation as the public flow — a rejected drag snaps back with a toast explaining why).
- **Resources/Settings (`/admin/resources`, `/admin/settings`):** business hours editor (per-day, multiple windows for split shifts), blocked-date manager (calendar-click to add/remove), resource (bay) list, global buffer/lead-time config, admin account management.

## 15. Empty / Loading / Error / Confirmation States

- **Empty states:** every list view (leads, bookings, gallery, reviews with no results after filtering) uses the shared `EmptyState` component: short explanatory line + relevant primary action (e.g., leads empty → "No leads yet — once customers submit the quote form, they'll show up here").
- **Loading states:** `Skeleton` placeholders matching the eventual content's shape (card skeletons for catalogue/gallery grids, row skeletons for admin tables) rather than a generic spinner, to reduce perceived load time and layout shift.
- **Error states:** inline, field-level for validation errors (red border + message directly under the field, per `FormField`); page-level `EmptyState`-style block with a retry action for failed data loads (e.g., calendar failed to load availability); toast for transient action failures (e.g., "Couldn't save note — try again").
- **Confirmation states:** destructive/impactful admin actions (cancel booking, disable a service, delete a note) use the `Modal` confirm pattern with the consequence spelled out in plain language ("This will cancel Rohan's 3:00 PM booking today and free up the slot. This can't be undone.") rather than a generic "Are you sure?"

## 16. Accessibility

- Color contrast: all text/background token pairings verified ≥ 4.5:1 (body text) / ≥ 3:1 (large text/UI components) against the dark palette in §3; the accent gold on dark background meets AA for text use, and is never the *sole* indicator of state (paired with icon/label, especially for status badges — color-blind-safe redundancy).
- All form inputs have associated `<label>`s (via `FormField`); all images (especially gallery before/after and uploaded lead photos) require alt text — enforced as a required field in the admin media-upload UI, not an afterthought.
- Full keyboard navigability: `SlotPicker`, `DatePicker`, and admin `CalendarGrid` drag interactions all have keyboard-operable equivalents (arrow-key date/slot navigation, Enter to select).
- Focus states: visible focus ring (accent-colored outline) on all interactive elements, never suppressed.
- Semantic HTML/landmarks (`nav`, `main`, `header`, `footer`, heading hierarchy starting at one `h1` per page) throughout for screen-reader navigation.

## 17. Conversion Strategy

- **Reduce time-to-first-trust-signal:** review rating and gallery proof appear above the fold on home and on every service/package detail page — a visitor should see evidence of quality before being asked for any information.
- **Two parallel conversion paths, never forced into one:** "Get a Quote" (for undecided/price-sensitive visitors) and "Book Now" (for decided/returning visitors) are both always reachable, never gated behind each other — matches PRD Journeys A and B.
- **Progressive disclosure in forms:** multi-step quote/booking forms with visible progress reduce abandonment versus one long form; every step states why information is being asked when it's non-obvious (e.g., "helps us quote accurately").
- **Sticky mobile CTA bar (§7):** the single highest-impact placement given the primary audience browses on mobile in short sessions.
- **Honest urgency, not fake scarcity:** offers show real validity windows from `Offer.endAt`; no invented countdown timers or fabricated "X people viewing this" patterns — consistent with the brand's "trust over hype" principle (§1) and avoiding manipulative dark patterns.
- **Reduce post-submit anxiety:** every terminal state (quote submitted, booking pending) explicitly states what happens next and roughly when, and offers an immediate WhatsApp escape hatch to a human — uncertainty after submitting is a common silent drop-off point this design explicitly closes.

---
*End of DESIGN.md. Cross-referenced against `PRD.md` §7 features and `ARCHITECTURE.md` §26 traceability matrix — every customer-facing feature in the PRD has a corresponding page/flow specification above, and every admin feature has a corresponding CRM/admin UX specification in §14.*
