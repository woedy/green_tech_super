# Green Frontend Checklist (Placeholders First)

Goal: build all core frontend surfaces with static dummy data so we can validate UX and derive backend/data contracts. Customer comes first, then agent/builder and admin.

Conventions
- Status: [ ] not started, [~] scaffolded/in progress, [x] done.
- Routes use React Router 6.
- Dummy data via inline constants and `src/mocks/*`; localStorage for demo state.

## Customer Journey — Public & Auth

Public Pages
- [x] Home `/` — Hero, services, featured projects, testimonials
- [x] About `/about` — Mission, values, sustainability
- [x] Services `/services` — Construction + real estate
- [x] Projects `/projects` — Portfolio gallery (static cards)
- [x] Properties `/properties` — Listing grid with filters; Save Search; Map/Grid toggle
- [x] Contact `/contact` — Form UI only (no submit)
- [x] Legal `/privacy`, `/terms` — Static pages

Auth
- [x] Register `/auth/register` — name, email, phone, password; success screen
- [x] Login `/auth/login` — email + password; remember me (demo)
- [x] Forgot Password `/auth/forgot` — email form; “email sent” message
- [x] Verify Email `/auth/verify` — confirmation screen (demo)

Profile & Settings
- [x] Profile `/account/profile` — name, phone, preferred region
- [x] Notifications `/account/notifications` — email/SMS/WhatsApp toggles (demo)

## Plans (Design Catalog)

Plans Catalog
- [x] List `/plans` — Filters: search, style, beds
  - Plan fields: id, slug, name, heroImage, style, beds, baths, floors, areaSqm, hasGarage, basePrice, regionsAvailable, images[], options[]

Plan Detail
- [x] Detail `/plans/:slug` — Specs, gallery, options, regions
  - CTA: “Request to Build” → wizard

Request to Build (RTB)
- [x] Multi‑step `/plans/:slug/request`
  - Steps: Contact → Region → Budget → Timeline → Options/Customizations → Uploads → Review
  - Demo: files = names only; submit → toast + `/account/requests`

“Cart” for Plan Options (optional)
- [ ] Options Cart `/plans/:slug/configure` — Select options, show subtotal

## Properties (Buy/Rent)

Search & List
- [x] List `/properties` — Filters + search; Save Search (localStorage); Map/Grid toggle (map placeholder)

Property Detail
- [x] Detail `/properties/:id` — Gallery, specs, amenities, agent card, mortgage UI
  - CTA: “Send Inquiry” → `/properties/:id/inquire`

Saved & Alerts
- [x] Favorites `/account/favorites` — save/unsave in memory; grid of saved
- [x] Saved Searches `/account/saved-searches` — list, enable/disable alerts, apply, delete

Inquiries & Appointments
- [x] Inquiry `/properties/:id/inquire` — name, email, phone, message → toast + `/account/messages`
- [~] Schedule Viewing — Button on property detail triggers demo toast and navigates to `/account/appointments`
- [x] Appointments `/account/appointments` — upcoming/past lists

## Customer Dashboard

Overview
- [~] Dashboard `/account` — Cards for Requests, Quotes, Projects, Appointments

Requests to Build
- [x] List `/account/requests` — status chips (new, in_review, quoted)
- [~] Detail `/account/requests/:id` — Submitted data snapshot (timeline TBD)

Quotes
- [x] List `/account/quotes` — total, status (draft/sent/accepted/expired)
- [x] Detail `/account/quotes/:id` — line items, taxes/total; Accept (demo) → `/account/projects`

Projects
- [x] List `/account/projects` — status, next milestone
- [x] Detail `/account/projects/:id` — milestones, updates, actions (message PM / schedule visit)

Messages
- [x] Conversations `/account/messages` — thread list + search
- [x] Thread `/account/messages/:id` — bubbles + send (demo)

Documents & Payments (optional)
- [x] Documents `/account/documents` — list with types; download (no‑op)
- [x] Payments `/account/payments` — invoices with Pay (disabled except unpaid) / View (no‑op)

## Agent/Builder Portal (Phase 2)

Auth & Setup
- [ ] Login `/agent/login`
- [ ] Profile `/agent/profile` — territory, skills, contact

Leads
- [ ] Inbox `/agent/leads` — requests + inquiries; filters by status
- [ ] Detail `/agent/leads/:id` — qualification notes, status changes

Quotes
- [ ] Builder `/agent/quotes/new?request=:id` — line items, options, regional multipliers; preview
- [ ] List `/agent/quotes` & Detail `/agent/quotes/:id`

Projects
- [ ] List `/agent/projects` — assigned only
- [ ] Detail `/agent/projects/:id` — milestones, updates, files; post update

Calendar & Messages
- [ ] Calendar `/agent/calendar` — appointments list (dummy)
- [ ] Messages `/agent/messages` — threads with customers (shared dummy data)

## Admin/Ops Portal (Phase 2+)

Auth
- [ ] Login `/admin/login`

Catalogs
- [ ] Plans CMS `/admin/plans` — list/create/edit with media placeholders
- [ ] Properties CMS `/admin/properties` — list/create/edit with media placeholders

People & Regions
- [ ] Users `/admin/users` — roles & status toggles
- [ ] Regions `/admin/regions` — pricing multipliers CRUD (dummy)

Notifications & Analytics
- [ ] Templates `/admin/notifications` — email/SMS templates list
- [ ] Analytics `/admin/analytics` — simple counters and charts (dummy)

## Dummy Data Library (proposed `src/mocks/*.ts`)

- plan: { id, slug, name, style, beds, baths, floors, areaSqm, hasGarage, basePrice, images[], options[], regionsAvailable }
- property: { id, slug, title, type, listingType, location{city,country}, price, beds, baths, area, image, featured, status, description }
- requestToBuild: { id, planId, customerId, region, budgetRange, timeline, options[], customizations, files[], createdAt, status }
- quote: { id, requestId, items[], taxes, totals, currency, status, sentAt, acceptedAt }
- project: { id, title, status, milestones[], updates[], nextMilestone }
- message: { id, threadId, senderId, body, createdAt, read }
- user: { id, role, name, email, phone, region }
- region: { code, name, currency, multiplier }
- appointment: { id, propertyId?, projectId?, startsAt, endsAt, location, notes, status }

## Tracking

- When a page is scaffolded with placeholders, mark [~]. When the UI is complete for demo, mark [x].

