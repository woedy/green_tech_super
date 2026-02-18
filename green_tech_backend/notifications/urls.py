"""URLs for the notifications API."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'admin/notifications/templates', views.NotificationTemplateViewSet, basename='notification-template')
router.register(r'send', views.SendNotificationViewSet, basename='send-notification')
router.register(r'triggers', views.NotificationTriggerViewSet, basename='notification-trigger')

urlpatterns = [
    # User notification preferences
    path('notifications/preferences/', views.UserNotificationPreferenceViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update'
    }), name='my-notification-preferences'),
    
    # Include router URLs
    path('', include(router.urls)),
]
