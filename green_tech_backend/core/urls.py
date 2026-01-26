from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .health import health_check

# API URL patterns
api_patterns = [
    # JWT Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Accounts endpoints
    path('accounts/', include('accounts.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check
    path('api/health/', health_check, name='health-check'),

    # Authentication endpoints (direct access)
    path('api/auth/', include('accounts.urls')),

    # API v1
    path('api/v1/', include((api_patterns, 'api'), namespace='v1')),
    
    # Finances API
    path('api/v1/finances/', include(('finances.urls', 'finances'), namespace='finances')),

    # Public APIs consumed by the frontends
    path('api/', include(('plans.urls', 'plans'), namespace='plans')),  # /api/plans, /api/build-requests
    path('api/', include(('properties.urls', 'properties'), namespace='properties')),
    path('api/', include(('leads.urls', 'leads'), namespace='leads')),
    path('api/', include(('quotes.urls', 'quotes'), namespace='quotes')),
    path('api/construction/', include(('construction.api.urls', 'construction'), namespace='construction')),
    path('api/', include(('locations.urls', 'locations'), namespace='locations')),
    path('api/', include(('notifications.urls', 'notifications'), namespace='notifications')),
    path('api/', include(('sitecontent.urls', 'sitecontent'), namespace='sitecontent')),
    path('api/dashboard/', include(('dashboard.urls', 'dashboard'), namespace='dashboard')),
]
