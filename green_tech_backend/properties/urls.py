from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# Main router for property-related endpoints
router = DefaultRouter()
router.register(r'properties', api_views.PropertyViewSet, basename='property')

urlpatterns = [
    # Property management endpoints
    path('', include(router.urls)),
    
    # Property search suggestions
    path('properties/search/suggestions/', 
         api_views.PropertyViewSet.as_view({'get': 'search_suggestions'}), 
         name='property-search-suggestions'),
    
    # Rental management endpoints
    path('rentals/', include('properties.rentals.urls', namespace='rentals')),
]
