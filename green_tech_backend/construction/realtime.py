from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .serializers.project_serializers import ProjectMessageSerializer


GROUP_TEMPLATE = 'project-chat-{project_id}'

def broadcast_project_message(message):
    layer = get_channel_layer()
    if not layer:
        return
    serializer = ProjectMessageSerializer(message, context={'request': None})
    async_to_sync(layer.group_send)(
        GROUP_TEMPLATE.format(project_id=message.project_id),
        {
            'type': 'chat.message',
            'payload': serializer.data,
        },
    )


def broadcast_typing(project_id: int, user_id: int, is_typing: bool):
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        GROUP_TEMPLATE.format(project_id=project_id),
        {
            'type': 'chat.typing',
            'payload': {'user_id': user_id, 'is_typing': is_typing},
        },
    )


def broadcast_read_receipt(message, user_id):
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        GROUP_TEMPLATE.format(project_id=message.project_id),
        {
            'type': 'chat.read',
            'payload': {'message_id': message.id, 'user_id': user_id},
        },
    )
