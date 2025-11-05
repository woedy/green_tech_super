# Docker & Deployment Guide

This repo ships with two docker-compose configurations:

1. `docker-compose.local.yml` – spins up the full stack for local development (Postgres, Redis, Django, Celery worker, and the three Vite frontends with HMR).
2. `docker-compose.coolify.yml` – production-oriented build that Coolify can deploy. It builds release images, skips host port bindings, and lets Coolify assign external ports.

## 1. Local development

1. Prepare environment files:
   ```bash
   cp .env.local.example .env
   cp green_tech_backend/.env.example green_tech_backend/.env
   cp green-tech-africa/.env.example green-tech-africa/.env
   cp green-agent-frontend/.env.example green-agent-frontend/.env
   cp green-admin-frontend/.env.example green-admin-frontend/.env
   ```
   Update domains, ports, and secrets to match your machine.
2. Start the stack:
   ```bash
   docker compose -f docker-compose.local.yml up --build
   ```

What you get:

- Django API available at `http://localhost:8000`
- Public customer app at `http://localhost:5173`
- Agent app at `http://localhost:5174`
- Admin app at `http://localhost:5175`
- Hot reload for backend (via bind mount) and all frontends (`npm install` happens inside the containers the first time they boot)

The services share the following credentials by default:

- Postgres: `postgres://gtagent:gtagent@localhost:5432/green_tech`
- Redis: `redis://localhost:6379/0`

Migrations run automatically on boot. If you need a clean slate, stop the stack and remove the named volumes (`postgres_data`, `redis_data`).

## 2. Coolify deployment

1. Copy `.env.coolify.example` to `.env.coolify` and fill in your production secrets, domains, and (optionally) external database connection info.
2. In Coolify, create a docker-compose application that points at `docker-compose.coolify.yml` and loads the `.env.coolify` file. Keep the Postgres username/password aligned with the defaults (`gtagent`/`super-secret-password`) unless you intend to wipe the existing database volume.
3. Coolify will build the images and map ports itself:
   - `backend` exposes port `8000` (ASGI via Daphne)
   - Each frontend exposes port `80` (served by nginx)
4. Assign domains/SSL certificates to the services through the Coolify UI.

If you already have managed Postgres or Redis instances in Coolify, remove the bundled `db`/`redis` services from the compose file and update the environment variables in `.env.coolify` to point to your managed endpoints.

To smoke test the production stack locally, run:

```bash
docker compose --env-file .env.coolify -f docker-compose.coolify.yml up --build
```

### Notes

- `docker/frontend.Dockerfile` assumes a `package-lock.json`. If you switch to pnpm/yarn, adjust the Dockerfile or add the relevant lockfile.
- The backend image runs migrations and `collectstatic` on startup. Static assets land in the container at `/app/staticfiles`; serve them via a CDN/S3 if you need to scale beyond single container.
- Celery worker shares the same image as the API and connects to Redis for the broker/result backend.
- Admin UI reads `VITE_API_URL` (host) plus `VITE_API_BASE_PATH` (default `/api`). Set `VITE_API_BASE_URL` only when you need to hardcode the entire admin endpoint.
