from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_lead_event(event_type: str, lead_payload_source) -> None:
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    if hasattr(lead_payload_source, 'to_payload'):
        payload = lead_payload_source.to_payload()
    else:
        payload = dict(lead_payload_source)

    async_to_sync(channel_layer.group_send)(
        'agent-leads',
        {
            'type': 'lead.event',
            'event': event_type,
            'data': payload,
        },
    )
