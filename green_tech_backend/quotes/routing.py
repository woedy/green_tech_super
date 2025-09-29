"""Quote app websocket routing configuration."""
from django.urls import path

from .consumers import QuoteChatConsumer

websocket_urlpatterns = [
    path('ws/quotes/<uuid:quote_id>/chat/', QuoteChatConsumer.as_asgi()),
]
