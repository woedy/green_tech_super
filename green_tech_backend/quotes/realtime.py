"""Utilities for broadcasting quote chat events over Channels."""
from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .serializers import QuoteMessageSerializer

GROUP_TEMPLATE = 'quote-chat-{quote_id}'


def broadcast_quote_message(message) -> None:
    """Send a new quote chat message payload to connected WebSocket clients."""

    layer = get_channel_layer()
    if not layer:
        return
    serializer = QuoteMessageSerializer(message, context={'request': None})
    async_to_sync(layer.group_send)(
        GROUP_TEMPLATE.format(quote_id=message.quote_id),
        {
            'type': 'chat.message',
            'payload': serializer.data,
        },
    )
