# Green Tech Africa - Development Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

## Frontend Setup (Primary Focus)
```bash
cd green-tech-africa/
npm install
npm run dev  # Development server at http://localhost:5173
```

## Backend Setup
```bash
cd green_tech_backend/
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # API at http://localhost:8000
```

## Docker Setup (Recommended)
```bash
# One command setup:
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Database: PostgreSQL on port 5432
# Redis: on port 6379
```

## Key Development Commands
- Frontend: `npm run build` (production build)
- Backend: `python manage.py test` (run tests)
- Backend: `python manage.py createsuperuser` (admin user)
- Linting: `npm run lint` (frontend)

## Next Priority Features to Implement
1. **Plans API Integration** - Connect frontend catalog to backend
2. **Authentication Flow** - Login/register with JWT
3. **Request-to-Build Form** - Multi-step form with file uploads
4. **Property Search** - Filters and pagination
5. **Admin Dashboard** - Basic CRUD operations
