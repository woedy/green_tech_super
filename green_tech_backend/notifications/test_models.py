"""
Tests for the notification models.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from properties.models import Property
from ..models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationType, NotificationStatus, NotificationPriority
)

User = get_user_model()


class NotificationModelTests(TestCase):
    """Test the notification models."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create a test property
        self.property = Property.objects.create(
            title='Test Property',
            description='A test property',
            price=100000,
            bedrooms=3,
            bathrooms=2,
            square_meters=150,
            location='Test Location',
            created_by=self.user
        )
        
        # Create a test template
        self.template = NotificationTemplate.objects.create(
            name='test_template',
            notification_type=NotificationType.EMAIL,
            subject='Test Notification: {{subject}}',
            template='Hello {{user.first_name}}, this is a test about {{subject}}.',
            is_active=True
        )
        
        # Create user preferences
        self.preferences = UserNotificationPreference.objects.get(user=self.user)

    def test_notification_creation(self):
        """Test creating a notification."""
        notification = Notification.objects.create(
            recipient=self.user,
            subject='Test Notification',
            message='This is a test notification',
            notification_type=NotificationType.IN_APP,
            priority=NotificationPriority.NORMAL,
            content_object=self.property
        )
        
        self.assertEqual(str(notification), 'Test Notification')
        self.assertEqual(notification.status, NotificationStatus.PENDING)
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.content_object, self.property)
        
    def test_notification_template_rendering(self):
        """Test rendering a notification from a template."""
        context = {
            'subject': 'Test Subject',
            'user': self.user
        }
        
        rendered = self.template.render(context)
        self.assertEqual(rendered['subject'], 'Test Notification: Test Subject')
        self.assertEqual(
            rendered['message'],
            f'Hello {self.user.first_name}, this is a test about Test Subject.'
        )
        
    def test_user_notification_preferences(self):
        """Test user notification preferences."""
        # Test default preferences
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.EMAIL))
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.SMS))
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.IN_APP))
        
        # Update preferences
        self.preferences.email_enabled = False
        self.preferences.save()
        
        self.assertFalse(self.preferences.can_receive_notification(NotificationType.EMAIL))
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.IN_APP))
