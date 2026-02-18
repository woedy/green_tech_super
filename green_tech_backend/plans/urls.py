from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BuildRequestDirectUploadView, BuildRequestUploadView, BuildRequestViewSet, PlanViewSet
from .views_admin import BuildRequestAdminViewSet, PlanAdminViewSet

app_name = 'plans'

router = DefaultRouter()
router.register('plans', PlanViewSet, basename='plan')
router.register('build-requests', BuildRequestViewSet, basename='build-request')
router.register('admin/plans', PlanAdminViewSet, basename='admin-plans')
router.register('admin/build-requests', BuildRequestAdminViewSet, basename='admin-build-requests')

urlpatterns = [
    path('build-requests/uploads/', BuildRequestUploadView.as_view(), name='build-request-upload'),
    path('build-requests/uploads/direct/', BuildRequestDirectUploadView.as_view(), name='build-request-direct-upload'),
    path('', include(router.urls)),
]
