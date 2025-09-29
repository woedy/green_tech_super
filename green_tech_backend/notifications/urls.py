"""URLs for the notifications API."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'admin/notifications/templates', views.NotificationTemplateViewSet, basename='notification-template')
router.register(r'send', views.SendNotificationViewSet, basename='send-notification')
router.register(r'triggers', views.NotificationTriggerViewSet, basename='notification-trigger')

urlpatterns = [
    # User notifications
    path('me/', views.NotificationViewSet.as_view({
        'get': 'list',
        'delete': 'destroy'
    }), name='my-notifications'),
    
    path('me/unread/count/', views.NotificationViewSet.as_view({
        'get': 'unread_count'
    }), name='unread-notification-count'),
    
    path('me/mark-all-read/', views.NotificationViewSet.as_view({
        'post': 'mark_all_as_read'
    }), name='mark-all-notifications-read'),
    
    path('me/mark-read/', views.NotificationViewSet.as_view({
        'post': 'mark_as_read'
    }), name='mark-notifications-read'),
    
    # User notification preferences
    path('me/preferences/', views.UserNotificationPreferenceViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update'
    }), name='my-notification-preferences'),
    
    # Include router URLs
    path('', include(router.urls)),
]
