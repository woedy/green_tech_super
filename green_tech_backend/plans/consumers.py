from __future__ import annotations

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class BuildRequestFeedConsumer(AsyncJsonWebsocketConsumer):
    group_name = 'build-requests'

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(code)

    async def build_request_created(self, event):
        await self.send_json(event['data'])
