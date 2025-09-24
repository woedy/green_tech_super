"""
URLs for rental property management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'properties', views.RentalPropertyViewSet, basename='rental-property')
router.register(r'leases', views.LeaseAgreementViewSet, basename='lease-agreement')
router.register(r'maintenance-requests', views.MaintenanceRequestViewSet, basename='maintenance-request')
router.register(r'payments', views.PaymentViewSet, basename='payment')

app_name = 'rentals'

urlpatterns = [
    path('', include(router.urls)),
]
