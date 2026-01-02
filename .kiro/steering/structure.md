# Project Structure

## Repository Layout
This is a monorepo containing multiple applications that work together to form the Green Tech Africa platform.

```
├── green_tech_backend/          # Django REST API backend
├── green-tech-africa/           # Public customer frontend
├── green-agent-frontend/        # Agent/builder portal
├── green-admin-frontend/        # Administrative interface
├── docker/                      # Docker configuration files
├── docker-compose.local.yml     # Local development stack
├── docker-compose.coolify.yml   # Production deployment stack
└── .env files                   # Environment configuration
```

## Backend Structure (`green_tech_backend/`)
Django project following app-based architecture:

```
green_tech_backend/
├── core/                        # Main Django project
│   ├── settings.py             # Configuration
│   ├── urls.py                 # URL routing
│   ├── asgi.py                 # ASGI application
│   └── wsgi.py                 # WSGI application
├── accounts/                    # User management & authentication
├── locations/                   # Geographic regions & locations
├── plans/                       # Building plans catalog
├── properties/                  # Real estate listings
├── leads/                       # Lead management system
├── quotes/                      # Quote generation & management
├── construction/                # Project management & tracking
├── notifications/               # Notification system
├── community/                   # Community features
├── finances/                    # Financial management
├── sustainability/              # Sustainability metrics
├── sitecontent/                # CMS content management
├── dashboard/                   # Analytics & reporting
├── templates/                   # Email & document templates
├── requirements.txt             # Python dependencies
└── manage.py                   # Django management script
```

## Frontend Structure (All React Apps)
Each frontend follows consistent structure:

```
src/
├── components/                  # Reusable UI components
│   ├── ui/                     # shadcn/ui base components
│   ├── layout/                 # Layout components (header, nav, footer)
│   └── sections/               # Page-specific sections
├── pages/                      # Route components
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions & API clients
├── types/                      # TypeScript type definitions
├── mocks/                      # Mock data for development
├── assets/                     # Static assets (images, etc.)
├── __tests__/                  # Test files
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles
```

## Key Conventions

### Django Apps
- Each app represents a distinct business domain
- Models in `models.py`, API views in `views.py` or `api_views.py`
- Serializers in `serializers.py` for DRF
- URL patterns in `urls.py`
- Admin configuration in `admin.py`
- Async tasks in `tasks.py` (Celery)
- WebSocket consumers in `consumers.py` (Channels)

### React Components
- Use TypeScript for all components
- Components in PascalCase (e.g., `PropertyCard.tsx`)
- Custom hooks prefixed with `use` (e.g., `useProperties.ts`)
- API functions in `lib/api.ts` or domain-specific files
- Types defined in `types/` directory, grouped by domain

### File Naming
- **Backend**: Snake case (`property_views.py`, `build_request.py`)
- **Frontend**: Camel case for files, PascalCase for components
- **Constants**: UPPER_SNAKE_CASE
- **Environment files**: `.env`, `.env.example`, `.env.local.example`

### API Structure
- Base URL: `/api/`
- Versioning: `/api/v1/` (when needed)
- Resource endpoints: `/api/plans/`, `/api/properties/`
- Nested resources: `/api/projects/{id}/updates/`
- Authentication: `/api/auth/login/`, `/api/auth/register/`

### Database Conventions
- Use Django's default `id` primary keys (BigAutoField)
- Foreign keys with descriptive names (`created_by`, `assigned_agent`)
- Timestamps: `created_at`, `updated_at` (use `django-model-utils`)
- Soft deletes where appropriate (`is_active`, `deleted_at`)

### Testing Structure
- **Backend**: Tests in `tests/` directory or `test_*.py` files
- **Frontend**: Tests alongside components (`Component.test.tsx`)
- **Integration**: Separate `__tests__/` directories
- **Fixtures**: Backend fixtures in `fixtures/` directories

### Environment Configuration
- Development: `.env.local.example` → `.env`
- Production: `.env.coolify.example` → `.env.coolify`
- Each frontend has its own `.env` file
- Backend uses single `.env` file in project root

### Docker Structure
- `docker/frontend.Dockerfile` - Multi-stage build for React apps
- `docker/nginx/spa.conf` - Nginx configuration for SPAs
- Volume mounts for development hot reload
- Health checks for all services
- Named volumes for persistent data (postgres_data, redis_data)