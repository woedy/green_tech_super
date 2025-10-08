import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django_application = get_asgi_application()

websocket_urlpatterns = []

try:
    from plans.routing import websocket_urlpatterns as plan_ws
except Exception:  # pragma: no cover
    plan_ws = []

try:
    from leads.routing import websocket_urlpatterns as lead_ws
except Exception:  # pragma: no cover
    lead_ws = []

try:
    from quotes.routing import websocket_urlpatterns as quote_ws
except Exception:  # pragma: no cover
    quote_ws = []

try:
    from construction.routing import websocket_urlpatterns as construction_ws
except Exception:  # pragma: no cover
    construction_ws = []

try:
    from notifications.routing import websocket_urlpatterns as notification_ws
except Exception:  # pragma: no cover
    notification_ws = []

websocket_urlpatterns.extend(plan_ws)
websocket_urlpatterns.extend(lead_ws)
websocket_urlpatterns.extend(quote_ws)
websocket_urlpatterns.extend(construction_ws)
websocket_urlpatterns.extend(notification_ws)

application = ProtocolTypeRouter(
    {
        'http': django_application,
        'websocket': AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
