# Technology Stack

## Backend

- **Framework**: Django with Django REST Framework
- **Language**: Python
- **ASGI Server**: Daphne (for WebSocket support)
- **Database**: PostgreSQL (production), SQLite (development)
- **Caching/Message Broker**: Redis
- **Task Queue**: Celery
- **Real-time**: Django Channels for WebSocket connections
- **Authentication**: JWT via djangorestframework-simplejwt
- **API Documentation**: drf-yasg (Swagger/OpenAPI)

### Backend Apps Structure
- `accounts`: User management and authentication
- `construction`: Project tracking, milestones, documents
- `plans`: Building plans and templates
- `properties`: Property listings and management
- `quotes`: Quote requests and responses
- `notifications`: Real-time notification system
- `finances`: Financial tracking
- `leads`: Lead management
- `locations`: Location data (regions, cities)
- `sitecontent`: CMS functionality
- `dashboard`: Analytics and reporting

## Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React

### Frontend Apps
1. **green-tech-africa** (port 5173): Public website
2. **green-agent-frontend** (port 5174): Agent portal
3. **green-admin-frontend** (port 5175): Admin dashboard

## Development Environment

### Local Development with Docker Compose

Start all services:
```bash
docker-compose -f docker-compose.local.yml up
```

Services:
- Backend API: http://localhost:8000
- Public Frontend: http://localhost:5173
- Agent Frontend: http://localhost:5174
- Admin Frontend: http://localhost:5175
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Backend Commands

```bash
# Navigate to backend directory
cd green_tech_backend

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server (without Docker)
python manage.py runserver

# Run Celery worker
celery -A core worker -l info

# Run tests
pytest

# Code formatting
black .
isort .
flake8
```

### Frontend Commands

```bash
# Navigate to any frontend directory
cd green-admin-frontend  # or green-agent-frontend or green-tech-africa

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Testing

- **Backend**: pytest with pytest-django, factory-boy for fixtures
- **Frontend**: Vitest with React Testing Library, jsdom

## Deployment

Production deployment uses Coolify with separate Docker containers for each service. See `docker-compose.coolify.yml` for production configuration.

## Environment Variables

Backend requires:
- `DJANGO_SECRET_KEY`
- `POSTGRES_*` (database credentials)
- `REDIS_URL`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`, `SITE_URL`

Frontend requires:
- `VITE_API_URL`: Backend API endpoint
- `VITE_APP_ENV`: Environment (local/production)
