from django.urls import path

from .consumers import ProjectChatConsumer
from quotes.consumers import QuoteChatConsumer

websocket_urlpatterns = [
    path('ws/projects/<int:project_id>/chat/', ProjectChatConsumer.as_asgi()),
    path('ws/quotes/<uuid:quote_id>/chat/', QuoteChatConsumer.as_asgi()),
]
