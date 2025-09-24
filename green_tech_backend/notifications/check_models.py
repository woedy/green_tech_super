"""
Script to check if notification models can be imported and used.
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Now import and test the models
from django.contrib.auth import get_user_model
from notifications.models import Notification, NotificationTemplate, UserNotificationPreference
from notifications.enums import NotificationType, NotificationStatus, NotificationPriority

def test_notification_creation():
    """Test creating a notification."""
    User = get_user_model()
    
    # Create a test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }
    )
    
    # Create a notification
    notification = Notification.objects.create(
        recipient=user,
        subject='Test Notification',
        message='This is a test notification',
        notification_type=NotificationType.IN_APP,
        status=NotificationStatus.PENDING
    )
    
    print(f"Created notification: {notification}")
    print(f"Recipient: {notification.recipient.email}")
    print(f"Type: {notification.notification_type}")
    print(f"Status: {notification.status}")
    
    # Test user preferences
    preferences = UserNotificationPreference.objects.get(user=user)
    print(f"\nUser preferences:")
    print(f"Email enabled: {preferences.email_enabled}")
    print(f"SMS enabled: {preferences.sms_enabled}")
    print(f"In-app enabled: {preferences.in_app_enabled}")

if __name__ == '__main__':
    test_notification_creation()
