from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

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

    # API v1
    path('api/v1/', include((api_patterns, 'api'), namespace='v1')),

    # Public APIs consumed by the frontends
    path('api/', include(('plans.urls', 'plans'), namespace='plans')),  # /api/plans, /api/build-requests
    path('api/', include(('properties.urls', 'properties'), namespace='properties')),
]
