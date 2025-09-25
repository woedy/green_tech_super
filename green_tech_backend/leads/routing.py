from django.urls import path

from .consumers import LeadFeedConsumer

websocket_urlpatterns = [
    path('ws/agent/leads/', LeadFeedConsumer.as_asgi()),
]
