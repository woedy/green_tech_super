from __future__ import annotations

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class LeadFeedConsumer(AsyncJsonWebsocketConsumer):
    group_name = 'agent-leads'

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):  # pragma: no cover - inherited behavior
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(code)

    async def lead_event(self, event):
        await self.send_json({'event': event['event'], 'data': event['data']})
