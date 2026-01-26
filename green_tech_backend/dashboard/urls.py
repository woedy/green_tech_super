"""Dashboard API URLs."""

from django.urls import path
from .api_views import (
    AdminDashboardView, 
    CustomerDashboardView, 
    CustomerNotificationsView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView
)

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('customer/', CustomerDashboardView.as_view(), name='customer-dashboard'),
    path('notifications/', CustomerNotificationsView.as_view(), name='customer-notifications'),
    path('notifications/<uuid:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),
]