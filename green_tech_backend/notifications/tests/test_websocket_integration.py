"""
Integration tests for WebSocket notification functionality.
Tests real-time notification delivery and Ghana-specific features.
"""
import json
import asyncio
from datetime import datetime, timedelta
from unittest.mock import patch, AsyncMock

from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async

from notifications.consumers import UserNotificationConsumer, NotificationConsumer
from notifications.models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationStatus, NotificationType, NotificationPriority
)
from notifications.services import GhanaNotificationService
from construction.models import Project
from quotes.models import Quote

User = get_user_model()


class WebSocketNotificationTests(TransactionTestCase):
    """Test WebSocket notification functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass',
            user_type='customer',
            phone_number='+233241234567',
            location='Greater Accra'
        )
        
        self.agent = User.objects.create_user(
            username='agent',
            email='agent@test.com',
            password='testpass',
            user_type='agent',
            phone_number='+233241234568',
            location='Greater Accra'
        )
        
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )

    async def test_user_notification_websocket_connection(self):
        """Test user can connect to notification WebSocket."""
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope['user'] = self.customer
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Should receive unread count on connect
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'unread_count')
        self.assertIn('count', response)
        
        await communicator.disconnect()

    async def test_unauthenticated_user_rejected(self):
        """Test unauthenticated users cannot connect."""
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        # No user in scope
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)

    async def test_real_time_notification_delivery(self):
        """Test notifications are delivered in real-time via WebSocket."""
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope['user'] = self.customer
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip initial unread count message
        await communicator.receive_json_from()
        
        # Create a notification
        notification = await database_sync_to_async(Notification.objects.create)(
            recipient=self.customer,
            subject="Test Notification",
            message="This is a test notification",
            notification_type=NotificationType.IN_APP,
            priority=NotificationPriority.HIGH
        )
        
        # Send notification via service
        service = GhanaNotificationService()
        await database_sync_to_async(service._send_websocket_notification)(notification)
        
        # Should receive the notification
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification')
        self.assertEqual(response['notification']['subject'], "Test Notification")
        self.assertEqual(response['notification']['message'], "This is a test notification")
        
        await communicator.disconnect()

    async def test_mark_notifications_read(self):
        """Test marking notifications as read via WebSocket."""
        # Create test notifications
        notification1 = await database_sync_to_async(Notification.objects.create)(
            recipient=self.customer,
            subject="Test 1",
            message="Message 1",
            notification_type=NotificationType.IN_APP
        )
        
        notification2 = await database_sync_to_async(Notification.objects.create)(
            recipient=self.customer,
            subject="Test 2",
            message="Message 2",
            notification_type=NotificationType.IN_APP
        )
        
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope['user'] = self.customer
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip initial unread count
        await communicator.receive_json_from()
        
        # Mark notifications as read
        await communicator.send_json_to({
            'type': 'mark_read',
            'notification_ids': [str(notification1.id), str(notification2.id)]
        })
        
        # Should receive updated unread count
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'unread_count')
        
        # Verify notifications are marked as read
        await database_sync_to_async(notification1.refresh_from_db)()
        await database_sync_to_async(notification2.refresh_from_db)()
        
        self.assertEqual(notification1.status, NotificationStatus.READ)
        self.assertEqual(notification2.status, NotificationStatus.READ)
        self.assertIsNotNone(notification1.read_at)
        self.assertIsNotNone(notification2.read_at)
        
        await communicator.disconnect()

    async def test_admin_notification_monitoring(self):
        """Test admin can monitor notifications."""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            "/ws/notifications/admin/"
        )
        communicator.scope['user'] = self.admin
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Request notification stats
        await communicator.send_json_to({
            'type': 'get_stats'
        })
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification_stats')
        self.assertIn('stats', response)
        self.assertIn('total', response['stats'])
        self.assertIn('by_type', response['stats'])
        
        await communicator.disconnect()

    async def test_ghana_specific_notification_timing(self):
        """Test Ghana-specific notification timing restrictions."""
        service = GhanaNotificationService()
        
        # Create notification during business hours
        with patch('django.utils.timezone.now') as mock_now:
            # Set time to 10 AM Ghana time (within business hours)
            mock_now.return_value = datetime.now().replace(hour=10, minute=0)
            
            notification = await database_sync_to_async(Notification.objects.create)(
                recipient=self.customer,
                subject="Business Hours Test",
                message="Should be sent immediately",
                notification_type=NotificationType.SMS,
                priority=NotificationPriority.NORMAL
            )
            
            # Should be appropriate time
            is_appropriate = await database_sync_to_async(
                service._is_appropriate_time_ghana
            )(notification)
            self.assertTrue(is_appropriate)

        # Create notification outside business hours
        with patch('django.utils.timezone.now') as mock_now:
            # Set time to 11 PM Ghana time (outside business hours)
            mock_now.return_value = datetime.now().replace(hour=23, minute=0)
            
            notification = await database_sync_to_async(Notification.objects.create)(
                recipient=self.customer,
                subject="After Hours Test",
                message="Should be delayed",
                notification_type=NotificationType.SMS,
                priority=NotificationPriority.NORMAL
            )
            
            # Should not be appropriate time
            is_appropriate = await database_sync_to_async(
                service._is_appropriate_time_ghana
            )(notification)
            self.assertFalse(is_appropriate)

        # Urgent notifications should always be sent
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = datetime.now().replace(hour=23, minute=0)
            
            urgent_notification = await database_sync_to_async(Notification.objects.create)(
                recipient=self.customer,
                subject="Urgent Test",
                message="Should be sent immediately",
                notification_type=NotificationType.SMS,
                priority=NotificationPriority.URGENT
            )
            
            # Urgent should always be appropriate
            is_appropriate = await database_sync_to_async(
                service._is_appropriate_time_ghana
            )(urgent_notification)
            self.assertTrue(is_appropriate)

    async def test_ghana_localization_templates(self):
        """Test Ghana-specific message templates and localization."""
        service = GhanaNotificationService()
        
        # Test English template
        self.customer.preferred_language = 'en'
        await database_sync_to_async(self.customer.save)()
        
        template_context = {
            'project_name': 'Eco Home Accra',
            'milestone_name': 'Foundation Complete',
            'progress': 25
        }
        
        notification = await database_sync_to_async(service.create_notification)(
            recipient=self.customer,
            subject="Project Update",
            message="",  # Will be filled by template
            template_name='project_milestone',
            template_context=template_context,
            send_immediately=False
        )
        
        self.assertIn('Eco Home Accra', notification.message)
        self.assertIn('Foundation Complete', notification.message)
        self.assertIn('25%', notification.message)

        # Test Twi template
        self.customer.preferred_language = 'tw'
        await database_sync_to_async(self.customer.save)()
        
        notification_tw = await database_sync_to_async(service.create_notification)(
            recipient=self.customer,
            subject="Project Update",
            message="",
            template_name='project_milestone',
            template_context=template_context,
            send_immediately=False
        )
        
        # Should contain Twi text
        self.assertIn('adwuma', notification_tw.message)  # Twi word for "work/project"

    async def test_user_notification_preferences(self):
        """Test user notification preferences are respected."""
        # Create user preferences
        preferences = await database_sync_to_async(
            UserNotificationPreference.objects.create
        )(
            user=self.customer,
            email_notifications=False,  # Disabled
            sms_notifications=True,
            in_app_notifications=True
        )
        
        service = GhanaNotificationService()
        
        # Try to create email notification (should be blocked)
        email_notification = await database_sync_to_async(service.create_notification)(
            recipient=self.customer,
            subject="Email Test",
            message="Should be blocked",
            notification_type=NotificationType.EMAIL,
            send_immediately=False
        )
        
        self.assertIsNone(email_notification)
        
        # Try to create SMS notification (should work)
        sms_notification = await database_sync_to_async(service.create_notification)(
            recipient=self.customer,
            subject="SMS Test",
            message="Should work",
            notification_type=NotificationType.SMS,
            send_immediately=False
        )
        
        self.assertIsNotNone(sms_notification)
        self.assertEqual(sms_notification.notification_type, NotificationType.SMS)

    async def test_project_milestone_notifications(self):
        """Test project milestone notifications work correctly."""
        # Create a mock project
        project = await database_sync_to_async(lambda: type('Project', (), {
            'id': 1,
            'title': 'Test Eco Home',
            'customer': self.customer,
            'agent': self.agent
        })())
        
        service = GhanaNotificationService()
        
        # Send project update
        await database_sync_to_async(service.send_project_update)(
            project=project,
            milestone_name='Foundation Complete',
            progress=25,
            recipients=[self.customer, self.agent]
        )
        
        # Check notifications were created
        notifications = await database_sync_to_async(list)(
            Notification.objects.filter(subject__icontains='Foundation Complete')
        )
        
        self.assertEqual(len(notifications), 2)  # One for customer, one for agent
        
        for notification in notifications:
            self.assertIn('Foundation Complete', notification.subject)
            self.assertEqual(notification.priority, NotificationPriority.HIGH)

    async def test_websocket_reconnection_handling(self):
        """Test WebSocket handles reconnection gracefully."""
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope['user'] = self.customer
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Simulate connection drop
        await communicator.disconnect()
        
        # Reconnect
        communicator2 = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator2.scope['user'] = self.customer
        
        connected, subprotocol = await communicator2.connect()
        self.assertTrue(connected)
        
        # Should still receive unread count
        response = await communicator2.receive_json_from()
        self.assertEqual(response['type'], 'unread_count')
        
        await communicator2.disconnect()

    async def test_bulk_notification_sending(self):
        """Test sending notifications to multiple users efficiently."""
        # Create additional users
        users = []
        for i in range(5):
            user = await database_sync_to_async(User.objects.create_user)(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass',
                user_type='customer'
            )
            users.append(user)
        
        service = GhanaNotificationService()
        
        # Send bulk notifications
        notifications = await database_sync_to_async(service.send_bulk_notifications)(
            recipients=users,
            subject="Bulk Test",
            message="This is a bulk notification",
            notification_type=NotificationType.IN_APP,
            priority=NotificationPriority.NORMAL
        )
        
        self.assertEqual(len(notifications), 5)
        
        # Verify all notifications were created
        for notification in notifications:
            self.assertEqual(notification.subject, "Bulk Test")
            self.assertEqual(notification.status, NotificationStatus.SENT)

    async def test_notification_failure_handling(self):
        """Test notification failure scenarios are handled properly."""
        service = GhanaNotificationService()
        
        # Create notification
        notification = await database_sync_to_async(Notification.objects.create)(
            recipient=self.customer,
            subject="Failure Test",
            message="This should fail",
            notification_type=NotificationType.EMAIL
        )
        
        # Mock email sending to fail
        with patch('django.core.mail.send_mail', side_effect=Exception("Email failed")):
            success = await database_sync_to_async(service.send_notification)(notification)
            self.assertFalse(success)
            
            # Notification should be marked as failed
            await database_sync_to_async(notification.refresh_from_db)()
            self.assertEqual(notification.status, NotificationStatus.FAILED)


class GhanaMarketSimulationTests(TransactionTestCase):
    """Test Ghana market-specific scenarios and connectivity issues."""
    
    def setUp(self):
        """Set up test data for Ghana market simulation."""
        self.customer = User.objects.create_user(
            username='ghana_customer',
            email='customer@ghana.com',
            password='testpass',
            user_type='customer',
            phone_number='+233241234567',
            location='Greater Accra',
            preferred_language='en'
        )

    async def test_poor_connectivity_simulation(self):
        """Test notification delivery under poor connectivity conditions."""
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope['user'] = self.customer
        
        # Simulate slow connection by adding delays
        with patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep:
            connected, subprotocol = await communicator.connect()
            self.assertTrue(connected)
            
            # Create notification
            notification = await database_sync_to_async(Notification.objects.create)(
                recipient=self.customer,
                subject="Connectivity Test",
                message="Testing poor connectivity",
                notification_type=NotificationType.IN_APP
            )
            
            # Should still receive notification despite delays
            service = GhanaNotificationService()
            await database_sync_to_async(service._send_websocket_notification)(notification)
            
            # Skip initial unread count
            await communicator.receive_json_from()
            
            response = await communicator.receive_json_from()
            self.assertEqual(response['type'], 'notification')
            self.assertEqual(response['notification']['subject'], "Connectivity Test")
        
        await communicator.disconnect()

    async def test_ghana_currency_formatting(self):
        """Test Ghana Cedis currency formatting in notifications."""
        service = GhanaNotificationService()
        
        # Mock quote object
        quote = type('Quote', (), {
            'id': 1,
            'total_cost': 150000.50,
            'construction_request': type('ConstructionRequest', (), {
                'title': 'Eco Home Kumasi'
            })()
        })()
        
        # Send quote notification
        await database_sync_to_async(service.send_quote_notification)(
            quote=quote,
            recipient=self.customer,
            notification_type=NotificationType.IN_APP
        )
        
        # Check notification was created with proper formatting
        notification = await database_sync_to_async(
            Notification.objects.filter(subject__icontains='Quote').first
        )()
        
        self.assertIsNotNone(notification)
        self.assertIn('150,000.50', notification.message)  # Proper number formatting
        self.assertIn('GHS', notification.template_context.get('currency', ''))

    async def test_regional_notification_preferences(self):
        """Test notifications adapt to different Ghana regions."""
        # Create users in different regions
        accra_user = await database_sync_to_async(User.objects.create_user)(
            username='accra_user',
            email='accra@test.com',
            password='testpass',
            location='Greater Accra'
        )
        
        kumasi_user = await database_sync_to_async(User.objects.create_user)(
            username='kumasi_user',
            email='kumasi@test.com',
            password='testpass',
            location='Ashanti'
        )
        
        service = GhanaNotificationService()
        
        # Send notifications to both users
        for user in [accra_user, kumasi_user]:
            await database_sync_to_async(service.create_notification)(
                recipient=user,
                subject=f"Regional Test - {user.location}",
                message=f"Notification for {user.location} region",
                notification_type=NotificationType.IN_APP,
                send_immediately=False
            )
        
        # Verify notifications were created with regional context
        accra_notification = await database_sync_to_async(
            Notification.objects.filter(recipient=accra_user).first
        )()
        kumasi_notification = await database_sync_to_async(
            Notification.objects.filter(recipient=kumasi_user).first
        )()
        
        self.assertIn('Greater Accra', accra_notification.subject)
        self.assertIn('Ashanti', kumasi_notification.subject)

    async def test_mobile_network_optimization(self):
        """Test notifications are optimized for Ghana mobile networks."""
        service = GhanaNotificationService()
        
        # Create SMS notification (common in Ghana)
        notification = await database_sync_to_async(service.create_notification)(
            recipient=self.customer,
            subject="Mobile Test",
            message="This is a test SMS for Ghana mobile networks",
            notification_type=NotificationType.SMS,
            send_immediately=False
        )
        
        # Message should be concise for SMS
        self.assertLessEqual(len(notification.message), 160)  # Standard SMS length
        
        # Phone number should be in Ghana format
        self.assertTrue(self.customer.phone_number.startswith('+233'))

    async def test_offline_notification_queuing(self):
        """Test notifications are queued when user is offline."""
        # Create multiple notifications while user is "offline"
        service = GhanaNotificationService()
        
        notifications = []
        for i in range(3):
            notification = await database_sync_to_async(service.create_notification)(
                recipient=self.customer,
                subject=f"Offline Test {i+1}",
                message=f"Message {i+1} while offline",
                notification_type=NotificationType.IN_APP,
                send_immediately=False
            )
            notifications.append(notification)
        
        # When user comes online, they should receive all notifications
        communicator = WebsocketCommunicator(
            UserNotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        communicator.scope['user'] = self.customer
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Should receive unread count including all queued notifications
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'unread_count')
        self.assertGreaterEqual(response['count'], 3)
        
        await communicator.disconnect()