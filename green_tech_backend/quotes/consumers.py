from __future__ import annotations

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from django.contrib.auth import get_user_model

from .models import Quote, QuoteChatMessage, QuoteMessageReceipt
from .notifications import notify_quote_chat_message
from .permissions import user_can_access_quote_chat
from .serializers import QuoteMessageSerializer

User = get_user_model()


class QuoteChatConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer powering quote-specific chat rooms."""

    group_name_template = 'quote-chat-{quote_id}'

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.quote_id = self.scope['url_route']['kwargs'].get('quote_id')
        quote = await self._get_quote(self.quote_id)
        if not quote:
            await self.close()
            return
        has_access = await self._has_access(quote, user)
        if not has_access:
            await self.close()
            return

        self.quote = quote
        self.group_name = self.group_name_template.format(quote_id=self.quote_id)
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
            await self._broadcast_typing(user.id, bool(content.get('is_typing')))
        elif event_type == 'read':
            message_id = content.get('message_id')
            if message_id:
                result = await self._mark_read(message_id, user)
                if result:
                    message, receipt, updated = result
                    if updated:
                        await self._broadcast_read_receipt(message, receipt)
        elif event_type == 'message':
            body = (content.get('body') or '').strip()
            if not body:
                return
            message = await self._create_message(body, user)
            await self._broadcast_message(message)

    async def chat_message(self, event):
        await self.send_json({'type': 'message', 'payload': event['payload']})

    async def chat_typing(self, event):
        await self.send_json({'type': 'typing', 'payload': event['payload']})

    async def chat_read(self, event):
        await self.send_json({'type': 'read', 'payload': event['payload']})

    @sync_to_async
    def _get_quote(self, quote_id):
        try:
            return Quote.objects.select_related('build_request__user').get(pk=quote_id)
        except Quote.DoesNotExist:
            return None

    @sync_to_async
    def _has_access(self, quote: Quote, user: User) -> bool:
        return user_can_access_quote_chat(quote, user)

    @sync_to_async
    def _create_message(self, body: str, user: User) -> QuoteChatMessage:
        message = QuoteChatMessage.objects.create(
            quote=self.quote,
            sender=user,
            body=body,
        )
        QuoteMessageReceipt.objects.update_or_create(
            message=message,
            user=user,
            defaults={'read_at': timezone.now()},
        )
        notify_quote_chat_message(message)
        return message

    @sync_to_async
    def _mark_read(self, message_id, user: User):
        try:
            message = QuoteChatMessage.objects.get(pk=message_id, quote=self.quote)
        except QuoteChatMessage.DoesNotExist:
            return None
        receipt, created = QuoteMessageReceipt.objects.get_or_create(
            message=message,
            user=user,
            defaults={'read_at': timezone.now()},
        )
        updated = created
        if not created:
            now = timezone.now()
            if abs((now - receipt.read_at).total_seconds()) > 1:
                receipt.read_at = now
                receipt.save(update_fields=('read_at',))
                updated = True
        return message, receipt, updated

    async def _broadcast_message(self, message: QuoteChatMessage):
        serializer = QuoteMessageSerializer(message, context={'request': None})
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat.message',
                'payload': serializer.data,
            },
        )

    async def _broadcast_typing(self, user_id: int, is_typing: bool):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat.typing',
                'payload': {'user_id': user_id, 'is_typing': is_typing},
            },
        )

    async def _broadcast_read_receipt(self, message: QuoteChatMessage, receipt: QuoteMessageReceipt):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat.read',
                'payload': {
                    'message_id': str(message.id),
                    'user_id': receipt.user_id,
                    'read_at': receipt.read_at,
                },
            },
        )
