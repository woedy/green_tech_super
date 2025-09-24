from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

router = DefaultRouter()
router.register(r'scores', api_views.SustainabilityScoreViewSet, basename='sustainability-score')
router.register(r'certification-standards', api_views.CertificationStandardViewSet, basename='certification-standard')
router.register(r'property-certifications', api_views.PropertyCertificationViewSet, basename='property-certification')
router.register(r'feature-impacts', api_views.SustainabilityFeatureImpactViewSet, basename='feature-impact')
router.register(r'property-comparisons', api_views.PropertyComparisonViewSet, basename='property-comparison')
router.register(r'cost-savings-estimates', api_views.CostSavingsEstimateViewSet, basename='cost-savings-estimate')

# Additional URL patterns that don't fit the ViewSet pattern
urlpatterns = [
    path('', include(router.urls)),
    
    # Custom actions for property certifications
    path(
        'property-certifications/<int:pk>/approve/',
        api_views.PropertyCertificationViewSet.as_view({'post': 'approve'}),
        name='property-certification-approve'
    ),
    path(
        'property-certifications/<int:pk>/reject/',
        api_views.PropertyCertificationViewSet.as_view({'post': 'reject'}),
        name='property-certification-reject'
    ),
    
    # Property comparison actions
    path(
        'property-comparisons/<int:pk>/add-property/',
        api_views.PropertyComparisonViewSet.as_view({'post': 'add_property'}),
        name='property-comparison-add-property'
    ),
    path(
        'property-comparisons/<int:pk>/remove-property/',
        api_views.PropertyComparisonViewSet.as_view({'post': 'remove_property'}),
        name='property-comparison-remove-property'
    ),
    path(
        'property-comparisons/<int:pk>/summary/',
        api_views.PropertyComparisonViewSet.as_view({'get': 'summary'}),
        name='property-comparison-summary'
    ),
    
    # Cost savings summary
    path(
        'cost-savings-estimates/summary/',
        api_views.CostSavingsEstimateViewSet.as_view({'get': 'summary'}),
        name='cost-savings-estimates-summary'
    ),
]
