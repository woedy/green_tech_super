from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SiteDocumentVersionViewSet, SiteDocumentViewSet

app_name = 'sitecontent'

router = DefaultRouter()
router.register('admin/site-documents', SiteDocumentViewSet, basename='site-document')
router.register('admin/site-document-versions', SiteDocumentVersionViewSet, basename='site-document-version')

urlpatterns = [
    path('', include(router.urls)),
]
