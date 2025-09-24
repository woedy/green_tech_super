"""
Tests for the notification services.
"""
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from properties.models import Property
from ..models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationType, NotificationStatus, NotificationPriority
)
from ..services import NotificationService, notify_user

User = get_user_model()


class NotificationServiceTests(TestCase):
    """Test the notification service."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='service_test@example.com',
            password='testpass123',
            first_name='Service',
            last_name='Test'
        )
        
        # Create a test template
        self.template = NotificationTemplate.objects.create(
            name='service_test_template',
            notification_type=NotificationType.EMAIL,
            subject='Service Test: {{subject}}',
            template='Hello {{user.first_name}}, this is a service test about {{subject}}.',
            is_active=True
        )
        
        # Create user preferences
        self.preferences = UserNotificationPreference.objects.get(user=self.user)
        self.service = NotificationService()
        
    def test_send_notification(self):
        """Test sending a notification."""
        notification = self.service.send_notification(
            recipient=self.user,
            subject='Test Notification',
            message='This is a test notification',
            notification_type=NotificationType.IN_APP,
            priority=NotificationPriority.NORMAL
        )
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.status, NotificationStatus.SENT)
        
    def test_send_notification_with_template(self):
        """Test sending a notification with a template."""
        context = {
            'subject': 'Template Test',
            'user': self.user
        }
        
        notification = self.service.send_notification(
            recipient=self.user,
            subject='Template Test',
            template_name='service_test_template',
            template_context=context,
            notification_type=NotificationType.EMAIL,
            priority=NotificationPriority.NORMAL
        )
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.template, self.template)
        self.assertEqual(notification.status, NotificationStatus.SENT)
        self.assertIn('Template Test', notification.subject)
        self.assertIn(self.user.first_name, notification.message)
        
    def test_send_bulk_notifications(self):
        """Test sending notifications to multiple users."""
        # Create additional test users
        users = [self.user]
        for i in range(2):
            user = User.objects.create_user(
                email=f'test{i}@example.com',
                password=f'testpass{i}',
                first_name=f'Test{i}',
                last_name='User'
            )
            users.append(user)
        
        # Send bulk notifications
        notifications = self.service.send_bulk_notifications(
            recipients=users,
            subject='Bulk Test',
            message='This is a bulk test notification',
            notification_type=NotificationType.IN_APP,
            priority=NotificationPriority.NORMAL
        )
        
        self.assertEqual(len(notifications), 3)
        for notification in notifications:
            self.assertEqual(notification.subject, 'Bulk Test')
            self.assertEqual(notification.status, NotificationStatus.SENT)


def test_notify_user_helper(self):
    """Test the notify_user helper function."""
    notification = notify_user(
        user=self.user,
        subject='Helper Test',
        message='This is a test from the helper function',
        notification_type=NotificationType.IN_APP
    )
    
    self.assertIsNotNone(notification)
    self.assertEqual(notification.recipient, self.user)
    self.assertEqual(notification.subject, 'Helper Test')
    self.assertEqual(notification.status, NotificationStatus.SENT)
