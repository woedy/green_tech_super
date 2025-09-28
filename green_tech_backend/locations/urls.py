from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views_admin import RegionAdminViewSet

app_name = 'locations'

router = DefaultRouter()
router.register('admin/regions', RegionAdminViewSet, basename='admin-regions')

urlpatterns = [
    path('', include(router.urls)),
]
