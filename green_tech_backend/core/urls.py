from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# API URL patterns
api_patterns = [
    # Dashboard endpoints
    path('dashboard/', include('dashboard.urls')),
    
    # JWT Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Include other app URLs here
    path('finances/', include('finances.urls')),
    path('properties/', include('properties.urls')),
    path('construction/', include('construction.urls')),
    path('accounts/', include('accounts.urls')),
    path('community/', include('community.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include((api_patterns, 'api'), namespace='v1')),
]
