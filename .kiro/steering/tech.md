# Technology Stack

## Backend (Django)
- **Framework**: Django 4.x with Django REST Framework (DRF)
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: JWT tokens via `djangorestframework-simplejwt`
- **Async Tasks**: Celery with Redis broker
- **Real-time**: Django Channels (WebSockets) for chat and live updates
- **File Storage**: S3-compatible storage with django-storages
- **API Documentation**: drf-yasg (Swagger/OpenAPI)

## Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Charts**: Recharts for analytics dashboards

## Infrastructure
- **Containerization**: Docker with docker-compose for local development
- **Database**: PostgreSQL 16 (production), SQLite (development)
- **Cache/Broker**: Redis 7 for Celery and caching
- **Web Server**: Nginx (production), Vite dev server (development)

## Development Tools
- **Code Quality**: ESLint, Black (Python), Flake8, isort
- **Testing**: Vitest (frontend), pytest (backend)
- **Package Management**: npm/Node 20 (frontend), pip/venv (backend)

## Common Commands

### Backend Development
```bash
# Setup virtual environment
cd green_tech_backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run Celery worker
celery -A core worker -l info

# Run tests
pytest
```

### Frontend Development
```bash
# Install dependencies (any frontend)
cd green-tech-africa  # or green-agent-frontend, green-admin-frontend
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:run  # Single run without watch mode

# Linting
npm run lint
```

### Docker Development
```bash
# Full stack local development
docker compose -f docker-compose.local.yml up --build

# Production-like build
docker compose --env-file .env.coolify -f docker-compose.coolify.yml up --build
```

## Environment Configuration
- Use `.env` files for environment-specific configuration
- Backend uses `python-dotenv` for environment variable loading
- Frontend uses Vite's built-in environment variable support (`VITE_` prefix)
- Docker compose configurations handle service orchestration

## API Conventions
- RESTful endpoints under `/api/` prefix
- JWT authentication for protected endpoints
- Pagination using DRF's PageNumberPagination (20 items per page)
- CORS configured for all frontend origins in development
- OpenAPI documentation available at `/swagger/` and `/redoc/`