# Project Structure

## Repository Layout

```
green_tech_super/
├── green_tech_backend/          # Django REST API
├── green-tech-africa/           # Public frontend
├── green-agent-frontend/        # Agent portal
├── green-admin-frontend/        # Admin dashboard
├── docker/                      # Docker configurations
├── docker-compose.local.yml     # Local development
└── docker-compose.coolify.yml   # Production deployment
```

## Backend Structure (`green_tech_backend/`)

```
green_tech_backend/
├── core/                        # Django project settings
│   ├── settings.py             # Main configuration
│   ├── urls.py                 # Root URL routing
│   ├── asgi.py                 # ASGI config (WebSockets)
│   └── celery.py               # Celery configuration
├── accounts/                    # User management
├── construction/               # Construction projects
│   ├── models/                 # Split models
│   ├── serializers/            # API serializers
│   ├── api/                    # API views
│   └── tasks/                  # Celery tasks
├── plans/                      # Building plans
├── properties/                 # Property listings
├── quotes/                     # Quote management
├── notifications/              # Notification system
├── finances/                   # Financial tracking
├── leads/                      # Lead management
├── locations/                  # Location data
├── dashboard/                  # Analytics
├── sitecontent/               # CMS
├── templates/                  # Email templates
├── media/                      # User uploads
├── staticfiles/               # Collected static files
├── manage.py                   # Django CLI
└── requirements.txt            # Python dependencies
```

### Django App Pattern

Each Django app follows this structure:
```
app_name/
├── models.py                   # Database models
├── serializers.py             # DRF serializers
├── views.py                   # API views (public)
├── views_admin.py             # Admin-only views
├── serializers_admin.py       # Admin serializers
├── urls.py                    # URL routing
├── admin.py                   # Django admin config
├── tasks.py                   # Celery tasks
├── tests/                     # Test files
└── migrations/                # Database migrations
```

## Frontend Structure (all three apps)

```
frontend-app/
├── src/
│   ├── components/            # Reusable components
│   │   ├── ui/               # Radix UI components
│   │   ├── layout/           # Layout components
│   │   └── sections/         # Page sections
│   ├── pages/                # Route pages
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth helpers
│   │   └── utils.ts         # General utilities
│   ├── types/                # TypeScript types
│   ├── assets/               # Images, fonts
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── public/                    # Static assets
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

### Admin Frontend Specifics

```
green-admin-frontend/src/
└── admin/                     # Admin-specific code
    ├── pages/                # Admin pages
    ├── components/           # Admin components
    ├── hooks/               # Admin hooks
    ├── types/               # Admin types
    ├── layout/              # Admin layout
    └── api.ts               # Admin API client
```

## Code Organization Conventions

### Backend

- **Separation of concerns**: Public vs admin views/serializers
- **API versioning**: URLs prefixed with `/api/`
- **Admin endpoints**: Separate `views_admin.py` and `serializers_admin.py`
- **Real-time**: WebSocket consumers in `consumers.py`, routing in `routing.py`
- **Async tasks**: Background jobs in `tasks.py` using Celery
- **Permissions**: Custom permission classes in `permissions.py`

### Frontend

- **Path alias**: `@/` maps to `src/` directory
- **Component organization**: UI primitives in `components/ui/`, feature components in feature folders
- **API calls**: Centralized in `lib/api.ts` using TanStack Query
- **Type safety**: Shared types in `types/` directory
- **Styling**: Tailwind utility classes, component variants with CVA

## Key Files

- **Backend entry**: `green_tech_backend/manage.py`
- **Backend settings**: `green_tech_backend/core/settings.py`
- **Frontend configs**: `vite.config.ts`, `tailwind.config.ts`
- **Environment**: `.env` files (use `.env.example` as template)
- **Docker**: `docker-compose.local.yml` for development
