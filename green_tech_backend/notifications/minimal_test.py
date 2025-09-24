"""
Minimal test file for notifications app.
"""
import os
import django
from django.test import TestCase
from django.contrib.auth import get_user_model

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import models after Django setup
from notifications.models import Notification, NotificationTemplate, UserNotificationPreference
from notifications.enums import NotificationType, NotificationStatus, NotificationPriority

User = get_user_model()

class NotificationModelTest(TestCase):
    """Test the notification model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
    def test_create_notification(self):
        """Test creating a notification."""
        notification = Notification.objects.create(
            recipient=self.user,
            subject='Test Notification',
            message='This is a test notification',
            notification_type=NotificationType.IN_APP,
            status=NotificationStatus.PENDING
        )
        
        self.assertEqual(str(notification), 'Test Notification')
        self.assertEqual(notification.status, NotificationStatus.PENDING)
        self.assertEqual(notification.recipient, self.user)

if __name__ == '__main__':
    import unittest
    unittest.main()
