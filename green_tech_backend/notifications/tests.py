"""
Tests for the notifications app.
"""
import json
from datetime import datetime, timedelta
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from properties.models import Property
from ..models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationType, NotificationStatus, NotificationPriority
)
from ..services import NotificationService, notify_user

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
        ""Test creating a notification.""
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
        ""Test rendering a notification from a template.""
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
        ""Test user notification preferences.""
        # Test default preferences
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.EMAIL))
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.SMS))
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.IN_APP))
        
        # Update preferences
        self.preferences.email_enabled = False
        self.preferences.save()
        
        self.assertFalse(self.preferences.can_receive_notification(NotificationType.EMAIL))
        self.assertTrue(self.preferences.can_receive_notification(NotificationType.IN_APP))


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
        ""Test sending a notification."""
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
        ""Test sending a notification with a template."""
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
        ""Test sending notifications to multiple users."""
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


class NotificationAPITests(TestCase):
    """Test the notification API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='api_test@example.com',
            password='testpass123',
            first_name='API',
            last_name='Test'
        )
        
        # Create test notifications
        self.notification1 = Notification.objects.create(
            recipient=self.user,
            subject='Test Notification 1',
            message='This is test notification 1',
            notification_type=NotificationType.IN_APP,
            status=NotificationStatus.UNREAD
        )
        
        self.notification2 = Notification.objects.create(
            recipient=self.user,
            subject='Test Notification 2',
            message='This is test notification 2',
            notification_type=NotificationType.EMAIL,
            status=NotificationStatus.READ
        )
        
        # Create another user's notification
        other_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            first_name='Other',
            last_name='User'
        )
        self.other_notification = Notification.objects.create(
            recipient=other_user,
            subject='Other User Notification',
            message='This is another user\'s notification',
            notification_type=NotificationType.IN_APP
        )
        
        # Authenticate the test client
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        ""Test listing notifications for the authenticated user."""
        response = self.client.get('/api/v1/notifications/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # Test filtering by read status
        response = self.client.get('/api/v1/notifications/me/?is_read=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['subject'], 'Test Notification 1')
    
    def test_mark_notification_as_read(self):
        ""Test marking a notification as read."""
        # Mark single notification as read
        response = self.client.post(
            '/api/v1/notifications/me/mark-read/',
            {'notification_ids': [str(self.notification1.id)]},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['marked_read'], 1)
        
        # Verify the notification was marked as read
        self.notification1.refresh_from_db()
        self.assertEqual(self.notification1.status, NotificationStatus.READ)
        self.assertIsNotNone(self.notification1.read_at)
    
    def test_mark_all_notifications_as_read(self):
        ""Test marking all notifications as read."""
        response = self.client.post('/api/v1/notifications/me/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['marked_read'], 1)  # Only 1 was unread
        
        # Verify all notifications are now read
        unread_count = Notification.objects.filter(
            recipient=self.user,
            status=NotificationStatus.UNREAD
        ).count()
        self.assertEqual(unread_count, 0)
    
    def test_get_unread_count(self):
        ""Test getting the count of unread notifications."""
        response = self.client.get('/api/v1/notifications/me/unread/count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 1)
    
    def test_update_notification_preferences(self):
        ""Test updating notification preferences."""
        preferences = self.user.notification_preferences
        
        # Update preferences
        response = self.client.patch(
            '/api/v1/notifications/me/preferences/',
            {
                'email_enabled': False,
                'sms_enabled': False,
                'preferences': {
                    'marketing': False,
                    'updates': True,
                    'security': True
                },
                'do_not_disturb': {
                    'enabled': True,
                    'start_time': '22:00:00',
                    'end_time': '07:00:00'
                }
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the preferences were updated
        preferences.refresh_from_db()
        self.assertFalse(preferences.email_enabled)
        self.assertFalse(preferences.sms_enabled)
        self.assertTrue(preferences.in_app_enabled)  # Should remain unchanged
        self.assertFalse(preferences.preferences['marketing'])
        self.assertTrue(preferences.preferences['updates'])
        self.assertTrue(preferences.preferences['security'])
        self.assertTrue(preferences.do_not_disturb['enabled'])
        self.assertEqual(preferences.do_not_disturb['start_time'], '22:00:00')
        self.assertEqual(preferences.do_not_disturb['end_time'], '07:00:00')


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True
)
class NotificationSignalTests(TestCase):
    """Test notification signals and async tasks."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='signal_test@example.com',
            password='testpass123',
            first_name='Signal',
            last_name='Test'
        )
        
        # Create a test property
        self.property = Property.objects.create(
            title='Signal Test Property',
            description='A test property for signal testing',
            price=200000,
            bedrooms=4,
            bathrooms=3,
            square_meters=180,
            location='Signal Test Location',
            created_by=self.user
        )
        
        # Create test templates
        self.email_template = NotificationTemplate.objects.create(
            name='property_created_email',
            notification_type=NotificationType.EMAIL,
            subject='New Property: {{property.title}}',
            template='''Hello {{user.first_name}},\n\nYour new property "{{property.title}}" has been created.\n\nProperty Details:\n- Price: ${{property.price}}\n- Bedrooms: {{property.bedrooms}}\n- Bathrooms: {{property.bathrooms}}\n- Size: {{property.square_meters}} m²\n\nThank you for using our platform!''',
            is_active=True
        )
        
        self.in_app_template = NotificationTemplate.objects.create(
            name='property_created_in_app',
            notification_type=NotificationType.IN_APP,
            subject='Property Created: {{property.title}}',
            template='Your property "{{property.title}}" has been created successfully!',
            is_active=True
        )
    
    def test_property_created_signal(self):
        ""Test that notifications are sent when a property is created."""
        # Create a new property (should trigger the signal)
        new_property = Property.objects.create(
            title='New Test Property',
            description='A new test property',
            price=150000,
            bedrooms=3,
            bathrooms=2,
            square_meters=120,
            location='Test Location',
            created_by=self.user
        )
        
        # Verify notifications were created
        notifications = Notification.objects.filter(
            recipient=self.user,
            content_type=ContentType.objects.get_for_model(new_property),
            object_id=new_property.id
        )
        
        # Should have created 2 notifications (email and in-app)
        self.assertEqual(notifications.count(), 2)
        
        # Verify email notification
        email_notification = notifications.filter(
            notification_type=NotificationType.EMAIL
        ).first()
        self.assertIsNotNone(email_notification)
        self.assertIn(new_property.title, email_notification.subject)
        self.assertIn(self.user.first_name, email_notification.message)
        self.assertIn(str(new_property.price), email_notification.message)
        
        # Verify in-app notification
        in_app_notification = notifications.filter(
            notification_type=NotificationType.IN_APP
        ).first()
        self.assertIsNotNone(in_app_notification)
        self.assertIn(new_property.title, in_app_notification.subject)
        self.assertIn('created successfully', in_app_notification.message)
        
        # Verify notifications were sent (status should be SENT, not PENDING)
        self.assertEqual(email_notification.status, NotificationStatus.SENT)
        self.assertEqual(in_app_notification.status, NotificationStatus.SENT)
