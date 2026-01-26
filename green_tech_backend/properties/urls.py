from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PropertyInquiryView, PropertyViewSet, ViewingAppointmentViewSet
from .views_admin import PropertyAdminViewSet

app_name = 'properties'

router = DefaultRouter()
router.register('properties', PropertyViewSet, basename='property')
router.register('appointments', ViewingAppointmentViewSet, basename='appointments')
router.register('admin/properties', PropertyAdminViewSet, basename='admin-properties')

urlpatterns = [
    path('properties/inquiries/', PropertyInquiryView.as_view(), name='property-inquiry'),
    path('', include(router.urls)),
]
