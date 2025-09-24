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
- [x] Login `/agent/login` (implemented as `/auth/login` in agent app)
- [~] Profile `/agent/profile` — territory, skills, contact (basic profile at `/profile`)

Leads
- [x] Inbox `/agent/leads` — requests + inquiries; filters by status
- [x] Detail `/agent/leads/:id` — qualification notes, status changes

Quotes
- [x] Builder `/agent/quotes/new?request=:id` — line items, options, regional multipliers; preview
- [x] List `/agent/quotes` & Detail `/agent/quotes/:id`

Projects
- [x] List `/agent/projects` — assigned only
- [x] Detail `/agent/projects/:id` — milestones, updates, files; post update

Calendar & Messages
- [x] Calendar `/agent/calendar` — appointments list (demo events)
- [x] Messages `/agent/messages` — threads with customers (demo)

UX & Workbench Enhancements (Planned)
- [x] Sidebar shell layout — persistent left nav (Dashboard, Leads, Quotes, Projects, Calendar, Messages, Profile) with topbar for quick actions. (Implemented in green-agent-frontend)
- [~] Dashboard KPIs — cards for key stats. Note: customer dashboard shows Requests/Quotes/Projects/Appointments KPIs; agent/builder KPIs not implemented.
- [x] Data tables — Leads, Quotes, and Projects tables with filters and row actions (agent app).
- [x] Lead Kanban board — columns New → Contacted → Qualified → Quoted → Closed (quick actions in agent app).
- [x] Quote builder polish — allowances/tax/notes/terms, reusable templates (save/load), preview (agent builder).
- [x] Quote lifecycle — Send Quote (draft → sent), Duplicate, Download (no-op) from list (agent quotes).
- [x] Project detail tabs — Overview | Milestones | Updates | Files | Team; demo modals for Post Update / Add Milestone (agent app).
- [x] Calendar improvements — Month/List toggle, Add Event modal, color-coded events, and demo link to lead/project (agent app).
- [x] Messages attachments — attach file placeholder + typing indicator polish (agent thread).
- [x] Command palette — Ctrl/Cmd+K quick nav to leads/quotes/projects (agent app).
- [x] Notifications popover — recent events in header (agent app).

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
