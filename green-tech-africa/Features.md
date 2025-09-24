## Plan Client Journey — `frontend`

Registration & Login
- [ ] Sign up/login (email verification)
- [ ] Social login (optional)

Discovery (Building Plans)
- [ ] Browse plan catalog with filters (style, beds, baths, floors, area, garage, budget)
- [ ] Plan detail page with specs, drawings/renders, options/variants
- [ ] Regional cost-to-build estimate shown on plan detail

Request-to-Build & Intake
- [ ] Start multi-step intake (region, budget, timeline, plan, customizations, files)
- [ ] Review summary and submit request
- [ ] Confirmation email to customer; lead notification to staff

Quotes & Acceptance
- [ ] View quote(s) in dashboard with line items/options
- [ ] Accept quote (e‑sign/acknowledge) and see next steps

Project Tracking
- [ ] See project milestones, progress updates, gallery, and appointments
- [ ] Real‑time chat with PM/agent in project context

Notifications & Settings
- [ ] Email notifications for key events (request submitted, quote ready, milestone updates)
- [ ] SMS/WhatsApp for time‑sensitive events (appointment reminders)
- [ ] Notification preferences in profile

Logout
- [ ] Existing

Status (UI present today)
- [x] Landing, nav, About/Services/Projects pages
- [~] Properties UI (cards/detail placeholders)
- [ ] Plans catalog and request‑to‑build UI

---

## Property Buyer/Renter Journey — `frontend`

Search & Discovery
- [ ] Buy/Rent toggle; filters (price, type, beds, baths, area, location)
- [~] Listing cards with price/status/specs and CTA
- [~] Listing detail with gallery, amenities, agent info

Inquiries & Viewings
- [ ] Listing inquiry and schedule viewing (date/time/contact)
- [ ] Email/SMS confirmations and reminders

Account & Saved Items
- [ ] Create account, save favorites, saved searches, alerts
- [ ] Manage profile and preferred regions

Transactions
- [ ] Offer/negotiation (optional); document exchange
- [ ] Payment/invoice (optional MVP+)

Logout
- [ ] Existing

---

## Agent/Builder Journey — `agent_portal`

Registration & Onboarding
- [ ] Agent/builder login; profile and territory setup
- [ ] Team roles/permissions

Lead Inbox & Qualification
- [ ] View assigned leads (requests‑to‑build, inquiries)
- [ ] Qualify lead (notes/tags) and status updates (new/contacted/qualified/quoted/closed)

Quote Builder
- [ ] Create quotes with line items, allowances, options, regional multipliers
- [ ] Send quote and track customer views/acceptance

Projects & Milestones
- [ ] Convert accepted quote to project with milestones/tasks
- [ ] Post progress updates with photos; notify customer

Calendar & Appointments
- [ ] Manage viewings/site visits; calendar invites and reminders

Docs & Messages
- [ ] Upload/request documents; track signatures/approvals
- [ ] Real‑time chat with customer

Logout
- [ ] Existing

---

## Admin/Ops Journey — `admin_portal`

Access & Roles
- [ ] Admin login; roles: admin, agent, builder, customer
- [ ] Permission management and audit trail

Plans Catalog Management
- [ ] CRUD plans; variants/options; media (images/PDFs); publish/feature flags
- [ ] Moderation/approval for changes

Properties Management
- [ ] CRUD listings; media; verification badge; publish/schedule; featured

Regions & Pricing
- [ ] Regions and pricing multipliers for cost‑to‑build
- [ ] Taxes/fees configuration per region

Analytics & Reporting
- [ ] Leads funnel, quote acceptance, project status, inventory health
- [ ] CSV export and basic dashboards

Notifications
- [ ] Email/SMS template management; channel routing rules

Settings
- [ ] CORS, branding, contact, legal pages, and content blocks

---

## Backend & Platform — `core (Django)`

API & Auth
- [~] Django project scaffolded (`../green_tech_backend/core`)
- [ ] DRF installed and base API structure (`/api/...`)
- [ ] Auth (JWT or session) + email verification
- [ ] Roles/permissions (customer/agent/builder/admin)

Domain Services
- [ ] Plans, Properties, Inquiries, BuildRequests, Quotes, Projects endpoints
- [ ] Pricing engine (base price + options + regional multipliers)
- [ ] Search/filters with Postgres indexes (GIN/trigram)
- [ ] Media storage (S3‑compatible) with signed URLs

Realtime & Async
- [ ] Channels (WebSocket) for chat and live updates
- [ ] Celery + Redis for emails/SMS, media processing, digests

Integrations & Ops
- [ ] Email provider (SendGrid/Mailgun)
- [ ] SMS/WhatsApp (Twilio/WhatsApp Business)
- [ ] CORS configured for React dev/prod
- [ ] Rate limiting/throttling for sensitive endpoints
- [ ] Audit logging of critical actions

Quality & Tooling
- [ ] OpenAPI/Swagger docs; Postman collection
- [ ] Unit/integration tests for core flows
- [ ] Seed data/fixtures for local dev
- [ ] CI pipeline (tests/lint) and env configs

---

## Phase Tracking

Phase 1 (MVP)
- [ ] Plans catalog + request‑to‑build + email notifications
- [ ] Property listing search + detail + inquiry/viewing scheduler

Phase 2
- [ ] Quote generation + customer dashboard + live chat
- [ ] Admin management for plans/properties/regions + notification templates

Phase 3
- [ ] Project tracking + payments + analytics + SMS/WhatsApp
