# Technology Stack

## Frontend Applications
All frontend applications use a consistent modern React stack:

### Core Technologies
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **React Router 6** for client-side routing
- **Tailwind CSS** for styling
- **shadcn/ui** component library built on Radix UI primitives

### Key Libraries
- **@tanstack/react-query** for server state management
- **react-hook-form** with **@hookform/resolvers** and **zod** for form handling
- **lucide-react** for icons
- **date-fns** for date manipulation
- **recharts** for data visualization
- **sonner** for toast notifications
- **next-themes** for theme management

### Development Tools
- **ESLint** with TypeScript support
- **PostCSS** with Autoprefixer
- **lovable-tagger** for Lovable platform integration

## Backend
- **Django** with Python
- **Django REST Framework** (planned)
- **PostgreSQL** database (planned)
- **Celery + Redis** for async tasks (planned)
- **Channels** for WebSocket support (planned)

## Common Commands

### Frontend Development
```bash
# Install dependencies
npm i

# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Backend Development
```bash
# Run Django development server
python manage.py runserver

# Run migrations
python manage.py migrate

# Create migrations
python manage.py makemigrations
```

## Project Structure
- **green-tech-africa/**: Main customer-facing frontend
- **green-admin-frontend/**: Admin/ops portal
- **green-agent-frontend/**: Agent/builder portal  
- **green_tech_backend/**: Django backend API

## Development Environment
- Node.js with npm for frontend package management
- Python with Django for backend development
- All projects use ES modules (`"type": "module"`)
- TypeScript strict mode enabled