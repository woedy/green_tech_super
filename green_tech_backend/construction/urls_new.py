"""
URL configuration for the construction app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter

from .api_views import (
    ConstructionRequestViewSet,
    EcoFeatureSelectionViewSet,
    QuoteViewSet,
    QuoteItemViewSet,
    ProjectViewSet,
    ProjectMilestoneViewSet
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'construction-requests', ConstructionRequestViewSet, 
                basename='construction-request')
router.register(r'eco-feature-selections', EcoFeatureSelectionViewSet, 
                basename='eco-feature-selection')

# Project and Milestone endpoints
router.register(r'projects', ProjectViewSet, basename='project')

# Nested router for project milestones
project_router = SimpleRouter()
project_router.register(r'milestones', ProjectMilestoneViewSet, 
                        basename='project-milestone')

# Quote endpoints with nested routes for items
quote_router = SimpleRouter()
quote_router.register(r'quotes', QuoteViewSet, basename='quote')

# Nested router for quote items
quote_item_router = SimpleRouter()
quote_item_router.register(r'items', QuoteItemViewSet, basename='quote-item')

# The API URLs are now determined automatically by the router
urlpatterns = [
    # Main API endpoints
    path('', include(router.urls)),
    
    # Project nested routes
    path('projects/<uuid:project_pk>/', include(project_router.urls)),
    
    # Quote URLs
    path('', include(quote_router.urls)),
    
    # Nested quote items URLs
    path('quotes/<uuid:quote_pk>/', include(quote_item_router.urls)),
]

# Additional custom URLs can be added here if needed
# Example:
# urlpatterns += [
#     path('custom-endpoint/', views.custom_view, name='custom-endpoint'),
# ]
