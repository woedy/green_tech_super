"""
WebSocket consumers for real-time notifications.
"""
import json
import logging
from typing import Dict, Any
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Notification, NotificationStatus, NotificationType
from .serializers import NotificationSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class UserNotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for user-specific notifications.
    Handles real-time notification delivery and status updates.
    """
    
    async def connect(self):
        """Accept WebSocket connection for authenticated users."""
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        self.user = user
        self.group_name = f'user_notifications_{user.id}'
        
        # Join user-specific notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"User {user.id} connected to notifications WebSocket")
        
        # Send unread notification count on connect
        unread_count = await self._get_unread_count()
        await self.send_json({
            'type': 'unread_count',
            'count': unread_count
        })

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
        if hasattr(self, 'user'):
            logger.info(f"User {self.user.id} disconnected from notifications WebSocket")

    async def receive_json(self, content, **kwargs):
        """Handle incoming WebSocket messages."""
        message_type = content.get('type')
        
        if message_type == 'mark_read':
            notification_ids = content.get('notification_ids', [])
            await self._mark_notifications_read(notification_ids)
        
        elif message_type == 'mark_all_read':
            await self._mark_all_notifications_read()
        
        elif message_type == 'get_unread_count':
            unread_count = await self._get_unread_count()
            await self.send_json({
                'type': 'unread_count',
                'count': unread_count
            })

    async def notification_message(self, event):
        """Send notification to user."""
        await self.send_json({
            'type': 'notification',
            'notification': event['notification']
        })

    async def notification_update(self, event):
        """Send notification status update to user."""
        await self.send_json({
            'type': 'notification_update',
            'notification_id': event['notification_id'],
            'status': event['status'],
            'read_at': event.get('read_at')
        })

    async def unread_count_update(self, event):
        """Send updated unread count to user."""
        await self.send_json({
            'type': 'unread_count',
            'count': event['count']
        })

    @sync_to_async
    def _get_unread_count(self):
        """Get count of unread notifications for the user."""
        return Notification.objects.filter(
            recipient=self.user
        ).exclude(status=NotificationStatus.READ).count()

    @sync_to_async
    def _mark_notifications_read(self, notification_ids):
        """Mark specific notifications as read."""
        if not notification_ids:
            return
        
        updated = Notification.objects.filter(
            id__in=notification_ids,
            recipient=self.user
        ).exclude(status=NotificationStatus.READ).update(
            status=NotificationStatus.READ,
            read_at=timezone.now()
        )
        
        if updated > 0:
            # Send updated unread count
            unread_count = Notification.objects.filter(
                recipient=self.user
            ).exclude(status=NotificationStatus.READ).count()
            
            # Broadcast to user's group
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            
            import asyncio
            asyncio.create_task(
                channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'unread_count_update',
                        'count': unread_count
                    }
                )
            )

    @sync_to_async
    def _mark_all_notifications_read(self):
        """Mark all notifications as read for the user."""
        updated = Notification.objects.filter(
            recipient=self.user
        ).exclude(status=NotificationStatus.READ).update(
            status=NotificationStatus.READ,
            read_at=timezone.now()
        )
        
        if updated > 0:
            # Send updated unread count (should be 0)
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            
            import asyncio
            asyncio.create_task(
                channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'unread_count_update',
                        'count': 0
                    }
                )
            )


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Admin-level notification consumer for monitoring all notifications.
    Used for admin dashboard and system monitoring.
    """
    
    async def connect(self):
        """Accept WebSocket connection for admin users only."""
        user = self.scope.get('user')
        if not user or not user.is_authenticated or not user.is_staff:
            await self.close()
            return
        
        self.user = user
        self.user_id = self.scope['url_route']['kwargs'].get('user_id')
        
        # Admin can monitor specific user or all notifications
        if self.user_id:
            self.group_name = f'user_notifications_{self.user_id}'
        else:
            self.group_name = 'admin_notifications'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Admin {user.id} connected to notification monitoring")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
        if hasattr(self, 'user'):
            logger.info(f"Admin {self.user.id} disconnected from notification monitoring")

    async def receive_json(self, content, **kwargs):
        """Handle incoming WebSocket messages from admin."""
        message_type = content.get('type')
        
        if message_type == 'get_stats':
            stats = await self._get_notification_stats()
            await self.send_json({
                'type': 'notification_stats',
                'stats': stats
            })

    async def notification_message(self, event):
        """Forward notification to admin monitoring."""
        await self.send_json({
            'type': 'notification',
            'notification': event['notification']
        })

    async def system_alert(self, event):
        """Send system alerts to admin."""
        await self.send_json({
            'type': 'system_alert',
            'alert': event['alert']
        })

    @sync_to_async
    def _get_notification_stats(self):
        """Get notification statistics for admin dashboard."""
        from django.db.models import Count, Q
        from datetime import datetime, timedelta
        
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        
        stats = Notification.objects.aggregate(
            total=Count('id'),
            unread=Count('id', filter=Q(status=NotificationStatus.PENDING)),
            sent_today=Count('id', filter=Q(sent_at__date=today)),
            failed=Count('id', filter=Q(status=NotificationStatus.FAILED)),
            sent_this_week=Count('id', filter=Q(sent_at__date__gte=week_ago))
        )
        
        # Add notification type breakdown
        type_stats = {}
        for notification_type in NotificationType.choices:
            type_code = notification_type[0]
            type_stats[type_code] = Notification.objects.filter(
                notification_type=type_code
            ).count()
        
        stats['by_type'] = type_stats
        return stats


# Utility functions for sending notifications via WebSocket
async def send_notification_to_user(user_id: int, notification_data: Dict[str, Any]):
    """
    Send a notification to a specific user via WebSocket.
    """
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    group_name = f'user_notifications_{user_id}'
    
    await channel_layer.group_send(
        group_name,
        {
            'type': 'notification_message',
            'notification': notification_data
        }
    )


async def send_system_alert(alert_data: Dict[str, Any]):
    """
    Send a system alert to all admin users.
    """
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        'admin_notifications',
        {
            'type': 'system_alert',
            'alert': alert_data
        }
    )


async def update_user_unread_count(user_id: int):
    """
    Update the unread notification count for a user.
    """
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    group_name = f'user_notifications_{user_id}'
    
    # Get current unread count
    unread_count = await sync_to_async(
        lambda: Notification.objects.filter(
            recipient_id=user_id
        ).exclude(status=NotificationStatus.READ).count()
    )()
    
    await channel_layer.group_send(
        group_name,
        {
            'type': 'unread_count_update',
            'count': unread_count
        }
    )