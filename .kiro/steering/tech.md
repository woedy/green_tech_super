# Tech Stack

## Frontend Stack

All three frontends share the same technology stack:

- **Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 5.4 with SWC plugin for fast compilation
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Routing**: React Router DOM 6.30
- **State Management**: TanStack Query (React Query) 5.83
- **Forms**: React Hook Form 7.61 with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts 2.15
- **Testing**: Vitest with React Testing Library

## Backend Stack

- **Framework**: Django with Daphne ASGI server
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **Task Queue**: Celery
- **Containerization**: Docker with Docker Compose

## Common Commands

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Run tests
npm run test

# Run tests once (non-watch mode)
npm run test:run
```

### Docker Development

```bash
# Start all services
docker-compose -f docker-compose.local.yml up

# Start specific service
docker-compose -f docker-compose.local.yml up frontend_admin

# Stop all services
docker-compose -f docker-compose.local.yml down

# View logs
docker-compose -f docker-compose.local.yml logs -f [service_name]
```

## TypeScript Configuration

- Path alias `@/*` maps to `./src/*`
- Relaxed type checking: `noImplicitAny: false`, `strictNullChecks: false`
- Project references for app and node configs

## Environment Variables

Each frontend uses `.env` files with:
- `VITE_API_URL` - Backend API endpoint
- `VITE_APP_ENV` - Environment (local/dev/prod)
- `VITE_API_BASE_PATH` - API base path (admin only)
