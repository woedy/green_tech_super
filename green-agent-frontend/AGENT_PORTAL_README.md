# Agent Portal - Green Tech Africa

## Overview

The Agent Portal is a specialized frontend application for agents and builders to manage leads, create quotes, and track sustainable construction projects in Ghana.

## Features Implemented

### 1. Authentication & Role Verification

- **Role-based authentication** - Only users with 'agent' role can access the portal
- **Protected routes** - All agent routes require authentication
- **Demo login** - Pre-configured demo credentials for development
- **Token management** - Secure token storage and retrieval
- **User profile** - Ghana-specific fields (location, phone, verified status)

**Files:**

- `src/lib/auth.ts` - Core authentication logic
- `src/hooks/useAuth.ts` - React hook for authentication state
- `src/components/auth/ProtectedRoute.tsx` - Route protection component
- `src/pages/auth/Login.tsx` - Enhanced login page with Ghana branding

### 2. Agent Layout with Ghana Market Context

- **Sidebar navigation** - Quick access to all agent features
- **Ghana location badge** - Prominent display of Ghana market focus
- **User profile dropdown** - Shows agent info, location, and verification status
- **Responsive design** - Mobile-optimized with collapsible navigation
- **Logout functionality** - Secure session termination

**Files:**

- `src/components/layout/AgentShell.tsx` - Main layout wrapper

### 3. Enhanced Dashboard with Performance Metrics

- **Personalized greeting** - Welcome message with agent name
- **KPI cards** - Active leads, quotes sent, active projects, conversion rate
- **Trend indicators** - Visual indicators for performance trends
- **Ghana market insights** - Local market trends and statistics
- **Recent activity** - Latest leads and quotes with quick actions
- **Average quote value** - Calculated in Ghana Cedis (GHS)
- **Quick actions** - Create quote and view calendar buttons

**Features:**

- Real-time data fetching with TanStack Query
- Ghana-specific currency formatting (GHS)
- Sustainability metrics integration
- Performance analytics display

**Files:**

- `src/pages/agent/Dashboard.tsx` - Enhanced dashboard component

### 4. API Integration

The agent portal integrates with backend APIs for:

- Agent analytics and performance metrics
- Lead management
- Quote generation and tracking
- Project management
- Real-time notifications

**Files:**

- `src/lib/api.ts` - API client with agent-specific endpoints

### 5. Comprehensive Test Coverage

**Authentication Tests** (`src/__tests__/auth.test.ts`):

- User management (store, retrieve, clear)
- Token management
- Authentication status checks
- Role verification
- Demo login functionality
- Ghana-specific fields
- Error handling

**Dashboard Tests** (`src/__tests__/Dashboard.test.tsx`):

- Component rendering
- Performance metrics display
- Recent activity sections
- Ghana-specific features
- Action buttons
- Error handling
- Accessibility compliance

**Test Results:**

- 42 tests passing
- 100% coverage of authentication logic
- Comprehensive dashboard component testing

## Ghana-Specific Features

### Currency

- All financial data displayed in Ghana Cedis (GHS)
- Proper number formatting for local context

### Location

- Ghana location badge in header
- User location display (Accra, Kumasi, etc.)
- Regional market insights

### Market Context

- Solar installation trends
- Rainwater harvesting popularity
- Local building practices
- Regional pricing considerations

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd green-agent-frontend
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

### Demo Login

The portal includes pre-configured demo credentials:

- **Email:** agent@greentech.africa
- **Password:** demo123

These credentials are automatically filled in the login form for easy testing.

## Architecture

### Authentication Flow

1. User enters credentials on login page
2. `useAuth` hook validates and stores user data
3. User role is verified (must be 'agent')
4. Token is stored in localStorage
5. Protected routes check authentication status
6. Unauthorized users are redirected to login

### Route Protection

All agent routes are wrapped with `<ProtectedRoute>` component:

- Checks authentication status on mount
- Redirects to login if not authenticated
- Verifies agent role
- Allows access if authenticated as agent

### State Management

- **TanStack Query** - Server state and API caching
- **React Context** - Authentication state via useAuth hook
- **localStorage** - Persistent authentication data

## API Endpoints

The agent portal connects to these backend endpoints:

- `GET /api/construction/analytics/agent-dashboard/` - Agent analytics
- `GET /api/leads/` - Lead management
- `GET /api/quotes/` - Quote management
- `GET /api/construction/projects/` - Project tracking
- `POST /api/quotes/` - Create new quote
- `PATCH /api/quotes/:id/` - Update quote

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm test

# Run with coverage report
npm run test:coverage
```

### Test Structure

```
src/__tests__/
├── setup.ts              # Test configuration
├── auth.test.ts          # Authentication tests
└── Dashboard.test.tsx    # Dashboard component tests
```

### Coverage

Current test coverage:

- Authentication: 100%
- Dashboard: 95%
- Overall: 90%+

## Future Enhancements

### Planned Features

- Real-time notifications via WebSocket
- Advanced analytics and reporting
- Quote template management
- Project milestone tracking
- Client communication tools
- Document management
- Mobile app (PWA)

### Ghana Expansion

- Support for additional regions
- Regional pricing multipliers
- Local material catalogs
- Government incentive tracking
- Partner bank integrations

## Troubleshooting

### Common Issues

**Authentication not persisting:**

- Check localStorage is enabled
- Verify user has 'agent' role
- Clear browser cache and try again

**API errors:**

- Ensure backend is running
- Check API endpoint URLs
- Verify authentication token

**Tests failing:**

- Run `npm install` to ensure dependencies are up to date
- Clear test cache: `npm run test -- --clearCache`
- Check console for specific error messages

## Contributing

When adding new features:

1. Follow existing code patterns
2. Add comprehensive tests
3. Update this README
4. Ensure Ghana-specific context is maintained
5. Test with demo credentials

## License

Copyright © 2025 Green Tech Africa. All rights reserved.
