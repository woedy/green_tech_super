# Project Structure

## Repository Layout

```
/
├── green-admin-frontend/      # Admin portal (port 5175)
├── green-agent-frontend/      # Agent portal (port 5174)
├── green-tech-africa/         # Public website (port 5173)
├── green_tech_backend/        # Django backend (port 8000)
├── docker/                    # Docker configurations
├── .kiro/                     # Kiro AI assistant config
└── docker-compose.*.yml       # Docker orchestration
```

## Frontend Application Structure

All three frontends follow a consistent structure:

```
src/
├── admin/                     # Admin-specific features (admin frontend only)
│   ├── components/           # Admin UI components
│   ├── pages/                # Admin page components
│   ├── layout/               # Admin layout components
│   ├── hooks/                # Admin custom hooks
│   ├── lib/                  # Admin utilities
│   ├── types/                # Admin TypeScript types
│   ├── data/                 # Admin data/constants
│   ├── __tests__/            # Admin tests
│   └── api.ts                # Admin API client
├── components/               # Shared/reusable components
│   ├── ui/                   # Base UI components (shadcn/ui)
│   ├── layout/               # Layout components
│   └── sections/             # Page section components
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions and helpers
│   ├── utils.ts              # General utilities
│   ├── validation.ts         # Form validation schemas
│   ├── api.ts                # API client (agent/public)
│   └── auth.ts               # Authentication logic
├── mocks/                    # Mock data for development
├── assets/                   # Static assets (images, etc.)
├── test/                     # Test configuration
│   └── setup.ts              # Test setup file
├── App.tsx                   # Root component with routing
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

## Key Conventions

### Component Organization

- **UI Components** (`components/ui/`): Atomic, reusable components from shadcn/ui
- **Layout Components** (`components/layout/`): Header, Footer, Navigation
- **Section Components** (`components/sections/`): Larger page sections
- **Page Components** (`pages/` or `admin/pages/`): Full page views

### File Naming

- Components: PascalCase (e.g., `UserDetail.tsx`)
- Utilities: camelCase (e.g., `validation.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Tests: `*.test.ts` or `*.test.tsx` co-located with source

### Import Aliases

Use `@/` for all imports from `src/`:
```typescript
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
```

### Routing Patterns

Admin frontend uses nested routes:
- List view: `/admin/[resource]` (e.g., `/admin/users`)
- Detail view: `/admin/[resource]/:id`
- Create form: `/admin/[resource]/new`
- Edit form: `/admin/[resource]/:id/edit`

### State Management

- **Server State**: TanStack Query for API data
- **Form State**: React Hook Form
- **Local State**: React useState/useReducer
- **Auth State**: Custom hooks (e.g., `useAuth`)

### Testing

- Test files co-located with source: `Component.test.tsx`
- Test setup in `src/test/setup.ts`
- Use React Testing Library patterns
- Run with `npm run test` or `npm run test:run`
