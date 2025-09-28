# AGENTS: Green Tech Africa – Project Overview

This file gives a durable snapshot of the product vision, scope, architecture, and domain model so anyone (human or AI) can quickly gain context and make consistent decisions while working on the codebase.

## Snapshot

- Purpose: A construction and real estate platform combining a catalog of building plans (with request-to-build workflow) and real estate listings (buy/rent), plus portals for customers, agents/builders, and admins.
- Vision: Make sustainable construction and property transactions simpler and transparent across Africa, highlighting green building best practices.
- Frontend: React + TypeScript + Tailwind (shadcn-ui), client routing.
- Backend: Django + DRF, Postgres, Redis, Celery, Channels (WebSockets).
- Repos/Layout: React app at `green-tech-africa/`; Django project created at `../green_tech_backend/` named `core`.

## Personas & Primary Flows

- Customer
  - Discover plans and properties; request to build a plan; inquire/schedule viewings; receive quotes; track project milestones; chat with assigned agent/PM; receive email/SMS updates.
- Agent/Builder/PM
  - Manage assigned leads; qualify and communicate; build/send quotes; convert quotes to projects; manage milestones and updates; schedule appointments; coordinate documents.
- Admin/Ops
  - Manage catalogs (plans, properties), regions/pricing, users/roles, moderation, analytics, notification templates, and system settings.

## Scope – MVP vs. Next

MVP
- Plan catalog and detail pages (React) backed by DRF.
- Request-to-build submission with email notification (Celery task).
- Property listing search and detail; inquiries + viewing scheduler with email confirmations.
- Basic admin CRUD for plans/properties; region and pricing seed data.

Next Iterations
- Quote builder with regional multipliers and options.
- Customer dashboard with quotes, projects, documents, and chat (Channels).
- SMS/WhatsApp notifications for time-sensitive events.
- Analytics (lead funnel, quote acceptance, project status).

## Architecture

- Frontend (React)
  - Vite, TypeScript, Tailwind, shadcn-ui components.
  - Routes already scaffolded: home, about, services, projects, properties, property detail, contact, privacy, terms.
  - Will consume DRF APIs with TanStack Query; auth via JWT/session cookies.

- Backend (Django)
  - `core` project: `settings.py`, `urls.py`, `asgi.py`, `wsgi.py`.
  - DRF for REST API; JWT or session auth; role-based permissions.
  - Postgres as primary DB; S3-compatible storage for media.
  - Celery + Redis for async tasks (email/SMS, media processing, digests).
  - Channels (ASGI) for chat and live updates (quotes/projects).

- Infrastructure
  - Environments: local, staging, production (12-factor config via env vars).
  - Observability: request logs, Celery/Channels health, alarms on failures.

## Domain Model (High-Level)

- User, Profile(role, phone, preferences)
- Plan, PlanAsset, PlanOption/Variant, Region, PricingRule
- BuildRequest (plan, customizations JSON, region, budget, timeline, status)
- Quote (build_request, items JSON, totals, currency, status, accepted_at)
- Project (quote, milestones, documents, gallery, payments, change_orders)
- Property (listing_type: sale/rent, type, price, location, specs), PropertyImage
- Agent, Assignment (lead → agent/builder), Inquiry, ViewingAppointment
- Conversation, Message, Notification

## API Surface (Illustrative)

- Plans: `GET /api/plans`, `GET /api/plans/{id}`
- Build Requests: `POST /api/build-requests`, `GET /api/build-requests/{id}`
- Quotes: `GET /api/quotes/{id}`, `POST /api/quotes/{id}/send`, `POST /api/quotes/{id}/accept`
- Properties: `GET /api/properties`, `GET /api/properties/{id}`
- Inquiries/Viewings: `POST /api/inquiries`, `POST /api/viewings`
- Conversations: `GET/POST /api/conversations`, `WS /ws/conversations/{room}`
- Projects: `GET /api/projects/{id}`, `POST /api/projects/{id}/updates`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/verify` (email)

## Realtime & Async

- Channels rooms per quote/project for customer ↔ agent chat.
- Live notifications for quote status, milestone updates, and appointments.
- Celery tasks for notifications, media processing, and scheduled digests.

## Data & Search

- Postgres with GIN/trigram indexes for full-text-ish search on listings and plans.
- Region-aware pricing via `Region` + `PricingRule` tables.

## Security & Compliance

- Role-based permissions; rate limits on sensitive endpoints; audit logs on quote/project lifecycle actions.
- PII handling: hashed passwords, minimal data collection, secure storage of documents.

## Frontend Design System

- Tailwind with shadcn-ui; keep consistent spacing, typography, and color tokens already present in the app.
- Accessibility: keyboard focus states, ARIA labels for interactive components.

## Local Development

Frontend
- `npm i` in `green-tech-africa/` and `npm run dev` to launch.

Backend
- Location: `../green_tech_backend/`
- From that directory: `py -m venv venv && ./venv/Scripts/activate` (Windows), then `pip install django djangorestframework celery redis channels` (plus `psycopg[binary]` for Postgres locally or `sqlite3` for quick start).
- Run: `python manage.py migrate && python manage.py runserver`.
- Configure CORS and .env variables to allow the React dev origin.

## Definition of Done (DoD)

- Feature has API endpoints, auth/permissions, basic unit tests, and fixtures.
- Frontend integrates the API with loading/error states and is accessible.
- Emails/SMS (where applicable) are queued and templates are set up.
- Logs/metrics emit without errors; docs updated (README/Features.md).

## References

- Plan marketplaces: Architectural Designs, Truoba, ePlans.
- Prefab/request-to-build: Dvele, Connect Homes, BuildZoom.
- Ghana marketplaces: meQasa, Tonaton, Jiji Ghana.
- Global UX: Zillow, Redfin.

## Implementation Tasklist – Investor Demo Readiness

### Phase 0 — Platform Foundations (Weeks 0-2)
- [x] **US0.1 – As an engineer,** I want a reproducible dev/staging environment so that frontend and backend teams can iterate without configuration drift.
  - Acceptance criteria:
    - `.env.example` files documented for React and Django with required secrets.
    - Docker Compose (or equivalent) spins up Postgres, Redis, backend API, and frontend with one command.
    - CI pipeline runs lint/tests for all workspaces on each PR.
- [x] **US0.2 – As an admin,** I want secure authentication/authorization so that dashboards stay protected.
  - Acceptance criteria:
    - Django custom user model with roles (customer, agent, admin) and email verification via Celery task.
    - DRF JWT/session endpoints consumed by React auth hooks; localStorage demo auth fully removed.
    - Role-based route guards in each frontend enforce 403 redirects and show helpful messaging.

### Phase 1 — Customer Vertical Slice (Weeks 2-6)
- [x] **US1.1 – As a prospective customer,** I want to browse sustainable building plans with intuitive filters so that I can shortlist designs that fit my needs.
  - Acceptance criteria:
    - `/api/plans` supports filtering by style, bedrooms, bathrooms, floors, area, and budget with Postgres indexes.
    - React catalog grid shows skeleton states, empty results messaging, and saves filter state to query params.
    - Plan detail page displays media gallery, specs, and regional cost estimate sourced from backend pricing rules.
- [x] **US1.2 – As a customer,** I want to submit a request-to-build with my requirements so that an agent can follow up.
  - Acceptance criteria:
    - Multi-step intake form validates required fields, file uploads (S3 presigned URLs), and confirms submission.
    - DRF endpoint creates `BuildRequest`, stores customizations JSON, and queues Celery email to staff + confirmation email to customer.
    - Admin portal receives new lead in real time (toast + badge) via WebSocket notification.
- [x] **US1.3 – As a property seeker,** I want to discover listings and schedule viewings so that I can evaluate available homes.
  - Acceptance criteria:
    - `/api/properties` provides search (price, type, beds, baths, area, location) and pagination.
    - Property detail page renders gallery, map embed, agent card, and related listings carousel.
    - Inquiry/viewing form creates `Inquiry` + `ViewingAppointment`, sends confirmation email/SMS, and populates agent calendar.

### Phase 2 — Agent & Admin Enablement (Weeks 6-10)
- [x] **US2.1 – As an agent,** I want a lead inbox and qualification workflow so that I can triage customer interest efficiently.
  - Acceptance criteria:
    - Agent dashboard lists assigned leads with status chips, priority sorting, and unread indicators.
    - Leads support status transitions with activity log and internal notes persisted via API.
    - Real-time updates when new leads arrive or when another teammate updates a shared lead.
- [x] **US2.2 – As an agent,** I want to generate and send quotes with regional pricing so that customers receive accurate estimates.
  - Acceptance criteria:
    - Quote builder calculates line items, allowances, and regional multipliers using backend pricing service.
    - Generated quotes render customer-facing PDF/HTML with e-sign CTA; status tracked (sent, viewed, accepted, declined).
    - Customer dashboard surfaces quote timeline, allows acceptance with digital signature, and triggers notifications.
- [x] **US2.3 – As an admin,** I want to manage catalogs, regions, and notification templates so that the platform stays current.
  - Acceptance criteria:
    - Admin portal provides CRUD tables/forms for plans, properties, regions, pricing rules, and notification templates with audit trail.
    - Draft/publish workflow prevents incomplete content from going live; media uploads handled via shared asset library.
    - Global settings (legal pages, contact info) editable with preview and version history.
    - Implementation snapshot: Admin portal now uses DRF-backed CRUD for plans, properties, regions, notification templates, and site content with draft/publish workflows and audit trails.

### Phase 3 — Project Delivery & Engagement (Weeks 10-14)
- [x] **US3.1 – As a customer with an active project,** I want to track milestones, documents, and updates so that I stay informed.
  - Acceptance criteria:
    - Project dashboard shows milestone timeline, progress bar, recent updates, and outstanding tasks/documents.
    - File uploads support versioning and secure download links; activity feed records changes.
    - Notifications delivered via email/SMS/push when milestones change or documents are requested.
- [ ] **US3.2 – As an agent/project manager,** I want real-time collaboration tools so that I can coordinate with customers and teammates.
  - Acceptance criteria:
    - Channels-powered chat rooms per project and quote with typing indicators and read receipts.
    - Task assignments with due dates sync to calendar; overdue tasks trigger escalations.
    - Analytics dashboard summarizes pipeline KPIs (lead-to-quote conversion, quote acceptance, project status breakdown) with exportable CSV.
- [ ] **US3.3 – As an executive stakeholder,** I want demo-ready storytelling assets so that investors understand traction and vision.
  - Acceptance criteria:
    - Seed data/fixtures populate sandbox with realistic plans, properties, leads, and project scenarios.
    - Guided demo script with checkpoints (customer journey, agent workflow, admin oversight) documented in `Features.md`.
    - Pitch-ready dashboards/screens recorded as Loom/video plus static screenshots stored in `/docs`.

### Continuous Quality Gates
- [ ] Automated tests (unit + integration + end-to-end smoke) cover critical journeys and run in CI with coverage thresholds.
- [ ] Observability stack captures API/worker logs, error reporting, and performance metrics with alerting on failure states.
- [ ] Accessibility, responsiveness, and performance audits (Lighthouse/axe) meet agreed-upon benchmarks before release.




