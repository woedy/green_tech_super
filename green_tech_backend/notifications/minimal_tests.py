"""
Minimal tests for the notifications app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from notifications.models import Notification, UserNotificationPreference
from notifications.enums import NotificationType, NotificationStatus, NotificationPriority


class SimpleNotificationTest(TestCase):
    """Simple test case for notifications."""
    
    def setUp(self):
        """Set up test data."""
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_create_notification(self):
        ""Test creating a notification."""
        notification = Notification.objects.create(
            recipient=self.user,
            subject='Test Notification',
            message='This is a test notification',
            notification_type=NotificationType.IN_APP,
            status=NotificationStatus.PENDING
        )
        
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.subject, 'Test Notification')
        self.assertEqual(notification.status, NotificationStatus.PENDING)
    
    def test_user_preferences_created(self):
        ""Test that user preferences are created automatically."""
        preferences = UserNotificationPreference.objects.get(user=self.user)
        self.assertIsNotNone(preferences)
        self.assertTrue(preferences.email_enabled)  # Default should be True
        self.assertTrue(preferences.in_app_enabled)  # Default should be True
