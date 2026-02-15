from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PropertyInquiryView, PropertyViewSet, ViewingAppointmentViewSet
from .views_admin import PropertyAdminViewSet
from .views_transactions import PropertyTransactionViewSet
from .views_transactions_admin import PropertyTransactionAdminViewSet

app_name = 'properties'

router = DefaultRouter()
router.register('properties', PropertyViewSet, basename='property')
router.register('appointments', ViewingAppointmentViewSet, basename='appointments')
router.register('transactions', PropertyTransactionViewSet, basename='property-transactions')
router.register('admin/properties', PropertyAdminViewSet, basename='admin-properties')
router.register('admin/transactions', PropertyTransactionAdminViewSet, basename='admin-transactions')

urlpatterns = [
    path('properties/inquiries/', PropertyInquiryView.as_view(), name='property-inquiry'),
    path('', include(router.urls)),
]
