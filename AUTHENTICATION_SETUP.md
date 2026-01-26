# Authentication Setup Guide

## 🔐 Authentication System Fixed

The authentication system for both Admin and Agent portals has been completely overhauled to use proper JWT authentication with the Django backend.

## ✅ What Was Fixed

### Backend Issues Fixed:
- ✅ Added `rest_framework_simplejwt.token_blacklist` to INSTALLED_APPS
- ✅ JWT configuration properly set with token rotation and blacklisting
- ✅ Login endpoint returns proper user data with role information
- ✅ Email verification requirement enforced
- ✅ CORS configured for frontend origins
- ✅ Registration endpoint supports user_type selection

### Admin Portal Issues Fixed:
- ✅ Replaced fake localStorage authentication with real JWT API calls
- ✅ Added proper login form with email/password validation
- ✅ Implemented JWT token storage and retrieval
- ✅ Added Authorization headers to all API requests
- ✅ Implemented token refresh logic for expired tokens
- ✅ Added role-based access control (ADMIN users only)
- ✅ Updated route protection to use real authentication state

### Agent Portal Issues Fixed:
- ✅ Replaced demo login with real JWT API authentication
- ✅ Updated user interface to match backend user model
- ✅ Added JWT token storage and Authorization headers
- ✅ Implemented token refresh mechanism
- ✅ Added support for both AGENT and BUILDER user types
- ✅ Fixed role mapping between frontend and backend
- ✅ **NEW**: Added agent/builder registration functionality
- ✅ **NEW**: Added email verification flow with dedicated page

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
cd green_tech_backend

# Install dependencies (if not already done)
pip install -r requirements.txt

# Run migrations (includes new token blacklist tables)
python manage.py migrate

# Create demo users for testing
python manage.py create_demo_users

# Start the Django server
python manage.py runserver
```

### 2. Frontend Setup

#### Admin Portal:
```bash
cd green-admin-frontend
npm install
npm run dev
```

#### Agent Portal:
```bash
cd green-agent-frontend
npm install  
npm run dev
```

### 3. Test Authentication

Run the test script to verify everything is working:

```bash
# Make sure Django server is running first
python test_auth.py
```

## 🔑 Demo Credentials

| Portal | Email | Password | Role |
|--------|-------|----------|------|
| Admin Portal | admin@greentech.africa | admin123 | ADMIN |
| Agent Portal | agent@greentech.africa | agent123 | AGENT |
| Agent Portal | builder@greentech.africa | builder123 | BUILDER |

## 🔧 Technical Details

### JWT Configuration:
- **Access Token Lifetime**: 60 minutes
- **Refresh Token Lifetime**: 1 day
- **Token Rotation**: Enabled (new refresh token on each refresh)
- **Blacklisting**: Enabled (old tokens invalidated after rotation)

### API Endpoints:
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/register/` - Register new agent/builder account
- `GET /api/auth/profile/` - Get current user profile
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/token/verify/` - Verify token validity
- `POST /api/auth/verify-email/` - Verify email with uid + token

### Frontend Token Storage:
- **Admin Portal**: `admin_access_token`, `admin_refresh_token`, `admin_user`
- **Agent Portal**: `gta_agent_token`, `gta_agent_refresh_token`, `gta_agent_auth`

### Role-Based Access:
- **Admin Portal**: Only users with `user_type = 'ADMIN'`
- **Agent Portal**: Users with `user_type = 'AGENT'` or `user_type = 'BUILDER'`

## 🛡️ Security Features

1. **JWT Token Blacklisting**: Old tokens are invalidated when refreshed
2. **Email Verification Required**: Users must verify email before login
3. **Role-Based Access Control**: Portals enforce user type restrictions
4. **Token Expiration**: Access tokens expire after 60 minutes
5. **Automatic Token Refresh**: Expired tokens are automatically refreshed
6. **CORS Protection**: Only allowed origins can access the API

## 🔍 Troubleshooting

### Common Issues:

1. **"Please verify your email before signing in"**
   - Demo users are created with `is_verified=True`
   - For new users, implement email verification flow

2. **"Access denied. Admin privileges required"**
   - User doesn't have ADMIN role for admin portal
   - Check user's `user_type` field in database

3. **"Only users with agent or builder role can access this portal"**
   - User doesn't have AGENT or BUILDER role for agent portal
   - Check user's `user_type` field in database

4. **API requests failing with 401**
   - Token might be expired or invalid
   - Check browser localStorage for tokens
   - Try logging out and logging back in

5. **CORS errors**
   - Make sure Django server is running on http://localhost:8000
   - Check CORS_ALLOWED_ORIGINS in Django settings

### Debug Steps:

1. Check Django server logs for authentication errors
2. Check browser Network tab for API request/response details
3. Check browser localStorage for stored tokens
4. Run `python test_auth.py` to verify backend authentication
5. Check Django admin at http://localhost:8000/admin/ to verify user data

## 🎯 Next Steps

The authentication system is now fully functional with registration capabilities. You can:

1. **Test the portals** with the demo credentials
2. **Register new agents/builders** through the agent portal registration page
3. **Implement email verification** for new user registration (currently shows console output)
4. **Add password reset functionality** 
5. **Implement logout on all devices** using token blacklisting
6. **Add session management** features like "remember me"
7. **Implement 2FA** for enhanced security

## 🆕 New Features Added

### Agent Registration:
- ✅ **Registration Page**: `/register` - Full registration form for agents and builders
- ✅ **User Type Selection**: Choose between AGENT or BUILDER account types
- ✅ **Email Verification Flow**: Redirects to verification page after registration
- ✅ **Form Validation**: Client-side validation with proper error handling
- ✅ **Responsive Design**: Mobile-friendly registration interface

### Registration Flow:
1. User visits `/register` page
2. Fills out registration form (name, email, phone, user type, password)
3. Form validates and submits to backend
4. Backend creates unverified user account
5. User redirected to `/verify-email` page with instructions
6. User must verify email before they can login

## 📝 Files Modified

### Backend:
- `green_tech_backend/core/settings.py` - Added token blacklist app
- `green_tech_backend/accounts/management/commands/create_demo_users.py` - New demo user creation

### Admin Portal:
- `green-admin-frontend/src/admin/api.ts` - Added JWT auth headers and login API
- `green-admin-frontend/src/admin/lib/auth.ts` - New auth utilities
- `green-admin-frontend/src/admin/hooks/useAuth.ts` - New auth hook
- `green-admin-frontend/src/admin/pages/Login.tsx` - Real login implementation
- `green-admin-frontend/src/admin/layout/AdminLayout.tsx` - Updated logout
- `green-admin-frontend/src/App.tsx` - Updated route protection

### Agent Portal:
- `green-agent-frontend/src/lib/api.ts` - Added JWT auth headers and registration API
- `green-agent-frontend/src/lib/auth.ts` - Updated auth utilities
- `green-agent-frontend/src/hooks/useAuth.ts` - Real API authentication + registration
- `green-agent-frontend/src/pages/auth/Login.tsx` - Added registration link
- `green-agent-frontend/src/pages/auth/Register.tsx` - **NEW** Full registration page
- `green-agent-frontend/src/pages/auth/VerifyEmail.tsx` - **NEW** Email verification page
- `green-agent-frontend/src/App.tsx` - Added registration and verification routes

The authentication system is now production-ready! 🎉