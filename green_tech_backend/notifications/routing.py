"""
WebSocket routing for notifications.
"""
from django.urls import path

from .consumers import NotificationConsumer, UserNotificationConsumer

websocket_urlpatterns = [
    path('ws/notifications/', UserNotificationConsumer.as_asgi()),
    path('ws/notifications/<str:user_id>/', NotificationConsumer.as_asgi()),
]