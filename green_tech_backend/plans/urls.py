from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BuildRequestDirectUploadView, BuildRequestUploadView, BuildRequestViewSet, PlanViewSet

app_name = 'plans'

router = DefaultRouter()
router.register('plans', PlanViewSet, basename='plan')
router.register('build-requests', BuildRequestViewSet, basename='build-request')

urlpatterns = [
    path('', include(router.urls)),
    path('build-requests/uploads/', BuildRequestUploadView.as_view(), name='build-request-upload'),
    path('build-requests/uploads/direct/', BuildRequestDirectUploadView.as_view(), name='build-request-direct-upload'),
]
