"""
URL configuration for the construction app's API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter

from .views import (
    ConstructionRequestViewSet,
    EcoFeatureSelectionViewSet,
    QuoteViewSet,
    QuoteItemViewSet
)

# Import project views
from .project_views import (
    ProjectViewSet,
    ProjectMilestoneViewSet,
    ProjectDocumentViewSet,
    ProjectUpdateViewSet,
    ProjectTaskViewSet
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
project_router.register(r'documents', ProjectDocumentViewSet, 
                       basename='project-document')
project_router.register(r'updates', ProjectUpdateViewSet, 
                       basename='project-update')
project_router.register(r'tasks', ProjectTaskViewSet, 
                       basename='project-task')

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
    path('projects/<int:project_pk>/', include(project_router.urls)),
    
    # Quote URLs
    path('', include(quote_router.urls)),
    
    # Nested quote items URLs
    path('quotes/<uuid:quote_pk>/', include(quote_item_router.urls)),
]
