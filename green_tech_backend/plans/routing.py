from django.urls import path

from .consumers import BuildRequestFeedConsumer

websocket_urlpatterns = [
    path('ws/admin/build-requests/', BuildRequestFeedConsumer.as_asgi()),
]
