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
- Africa marketplaces: Property24, BuyRentKenya, PropertyPro.ng, meQasa.
- Global UX: Zillow, Redfin.

