from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def notify_new_build_request(build_request):
    """Push a build request notification to the admin websocket feed."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    payload = {
        'id': str(build_request.id),
        'plan': {
            'name': build_request.plan.name,
            'slug': build_request.plan.slug,
            'style': build_request.plan.style,
        },
        'region': build_request.region.name,
        'contact_name': build_request.contact_name,
        'contact_email': build_request.contact_email,
        'contact_phone': build_request.contact_phone,
        'submitted_at': build_request.submitted_at.isoformat(),
        'status': build_request.status,
    }
    async_to_sync(channel_layer.group_send)(
        'build-requests',
        {
            'type': 'build_request.created',
            'data': payload,
        },
    )
