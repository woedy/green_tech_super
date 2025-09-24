# Project Structure

## Repository Organization

This is a multi-application repository with separate frontend applications and a shared backend:

```
├── .kiro/                          # Kiro IDE configuration and steering
├── green-tech-africa/              # Main customer-facing frontend
├── green-admin-frontend/           # Admin/ops portal frontend  
├── green-agent-frontend/           # Agent/builder portal frontend
└── green_tech_backend/             # Django backend API
```

## Frontend Application Structure

All frontend applications follow a consistent Vite + React structure:

```
├── public/                         # Static assets
├── src/
│   ├── components/                 # Reusable UI components
│   ├── pages/                      # Route components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility functions and configurations
│   ├── mocks/                      # Mock data for development
│   └── main.tsx                    # Application entry point
├── index.html                      # HTML template
├── package.json                    # Dependencies and scripts
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
└── components.json                 # shadcn/ui configuration
```

## Backend Structure

Django backend follows standard Django project layout:

```
green_tech_backend/
├── core/                           # Django project settings
├── manage.py                       # Django management script
└── [apps]/                         # Django applications (to be created)
```

## Key Configuration Files

### Frontend
- **components.json**: shadcn/ui component configuration
- **tailwind.config.ts**: Tailwind CSS customization
- **tsconfig.json**: TypeScript compiler options
- **vite.config.ts**: Build tool configuration
- **eslint.config.js**: Code linting rules

### Backend
- **manage.py**: Django command-line utility
- **core/settings.py**: Django configuration (planned)

## Development Conventions

### File Naming
- React components: PascalCase (e.g., `UserProfile.tsx`)
- Utility files: camelCase (e.g., `apiClient.ts`)
- Page components: PascalCase matching route names
- Mock data files: camelCase with `.ts` extension

### Import Organization
- External libraries first
- Internal components and utilities second
- Relative imports last
- Use absolute imports from `src/` when possible

### Component Structure
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow shadcn/ui patterns for consistent styling
- Use React Router 6 for navigation

### Data Management
- Mock data in `src/mocks/` for development
- Use localStorage for demo state persistence
- Implement proper TypeScript interfaces for all data models