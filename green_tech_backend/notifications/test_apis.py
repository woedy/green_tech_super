"""
Tests for the notification API endpoints.
"""
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from properties.models import Property
from ..models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationType, NotificationStatus, NotificationPriority
)

User = get_user_model()


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
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            first_name='Other',
            last_name='User'
        )
        self.other_notification = Notification.objects.create(
            recipient=self.other_user,
            subject='Other User Notification',
            message='This is another user\'s notification',
            notification_type=NotificationType.IN_APP
        )
        
        # Create a test template
        self.template = NotificationTemplate.objects.create(
            name='api_test_template',
            notification_type=NotificationType.EMAIL,
            subject='API Test: {{subject}}',
            template='Hello {{user.first_name}}, this is an API test about {{subject}}.',
            is_active=True
        )
        
        # Authenticate the test client
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test listing notifications for the authenticated user."""
        url = reverse('notifications:notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # Test filtering by read status
        response = self.client.get(url, {'is_read': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['subject'], 'Test Notification 1')
    
    def test_retrieve_notification(self):
        """Test retrieving a single notification."""
        url = reverse('notifications:notification-detail', args=[self.notification1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], 'Test Notification 1')
    
    def test_retrieve_other_users_notification(self):
        """Test that users cannot retrieve other users' notifications."""
        url = reverse('notifications:notification-detail', args=[self.other_notification.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_mark_notification_as_read(self):
        """Test marking a notification as read."""
        url = reverse('notifications:notification-mark-read')
        
        # Mark single notification as read
        response = self.client.post(
            url,
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
        """Test marking all notifications as read."""
        url = reverse('notifications:notification-mark-all-read')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['marked_read'], 1)  # Only 1 was unread
        
        # Verify all notifications are now read
        unread_count = Notification.objects.filter(
            recipient=self.user,
            status=NotificationStatus.UNREAD
        ).count()
        self.assertEqual(unread_count, 0)
    
    def test_get_unread_count(self):
        """Test getting the count of unread notifications."""
        url = reverse('notifications:notification-unread-count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 1)
    
    def test_update_notification_preferences(self):
        """Test updating notification preferences."""
        url = reverse('notifications:notification-preferences')
        preferences = self.user.notification_preferences
        
        # Update preferences
        response = self.client.patch(
            url,
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
