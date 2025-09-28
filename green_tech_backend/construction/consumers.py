from __future__ import annotations

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from django.utils import timezone

from construction.models import Project, ProjectChatMessage, ProjectMessageReceipt
from construction.permissions import IsProjectTeamMember
from construction.realtime import broadcast_typing
from construction.serializers.project_serializers import ProjectMessageSerializer

User = get_user_model()


class ProjectChatConsumer(AsyncJsonWebsocketConsumer):
    group_name_template = 'project-chat-{project_id}'

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        self.project_id = int(self.scope['url_route']['kwargs']['project_id'])
        project = await self._get_project(self.project_id)
        if not project:
            await self.close()
            return
        has_access = await self._has_access(project, user)
        if not has_access:
            await self.close()
            return
        self.project = project
        self.group_name = self.group_name_template.format(project_id=self.project_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(code)

    async def receive_json(self, content, **kwargs):
        event_type = content.get('type')
        user = self.scope['user']
        if event_type == 'typing':
            is_typing = bool(content.get('is_typing'))
            broadcast_typing(self.project_id, user.id, is_typing)
        elif event_type == 'read':
            message_id = content.get('message_id')
            if message_id:
                await self._mark_read(message_id, user)
        elif event_type == 'message':
            body = content.get('body', '').strip()
            if not body:
                return
            message = await self._create_message(body, user, content.get('quote'))
            await self._broadcast_message(message)
        else:
            return

    async def chat_message(self, event):
        await self.send_json({'type': 'message', 'payload': event['payload']})

    async def chat_typing(self, event):
        await self.send_json({'type': 'typing', 'payload': event['payload']})

    async def chat_read(self, event):
        await self.send_json({'type': 'read', 'payload': event['payload']})

    @sync_to_async
    def _get_project(self, project_id: int):
        try:
            return Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return None

    @sync_to_async
    def _has_access(self, project: Project, user: User) -> bool:
        perm = IsProjectTeamMember()
        return perm._is_team_member(user, project)

    @sync_to_async
    def _create_message(self, body: str, user: User, quote_id=None):
        quote = None
        if quote_id:
            from construction.models import Quote
            try:
                quote = Quote.objects.get(pk=quote_id)
            except Quote.DoesNotExist:
                quote = None
        message = ProjectChatMessage.objects.create(
            project=self.project,
            quote=quote,
            sender=user,
            body=body,
        )
        ProjectMessageReceipt.objects.get_or_create(
            message=message,
            user=user,
            defaults={'read_at': timezone.now()},
        )
        return message

    @sync_to_async
    def _mark_read(self, message_id, user: User):
        try:
            message = ProjectChatMessage.objects.get(pk=message_id, project=self.project)
        except ProjectChatMessage.DoesNotExist:
            return
        ProjectMessageReceipt.objects.get_or_create(
            message=message,
            user=user,
            defaults={'read_at': timezone.now()},
        )

    async def _broadcast_message(self, message: ProjectChatMessage):
        serializer = ProjectMessageSerializer(message, context={'request': None})
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat.message',
                'payload': serializer.data,
            },
        )
