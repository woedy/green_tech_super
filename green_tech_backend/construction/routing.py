from django.urls import path

from .consumers import ProjectChatConsumer

websocket_urlpatterns = [
    path('ws/projects/<int:project_id>/chat/', ProjectChatConsumer.as_asgi()),
]
