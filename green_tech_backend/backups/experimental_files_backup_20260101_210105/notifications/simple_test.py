"""
A simple test script for the notifications app.
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    django.setup()
    print("Django setup successful!")
    
    # Now import and test the models
    from django.contrib.auth import get_user_model
    from notifications.models import Notification, NotificationTemplate, UserNotificationPreference
    from notifications.enums import NotificationType, NotificationStatus, NotificationPriority
    
    print("All imports successful!")
    
    # Create a test user
    User = get_user_model()
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }
    )
    
    print(f"User created/retrieved: {user}")
    
    # Create a notification
    notification = Notification.objects.create(
        recipient=user,
        subject='Test Notification',
        message='This is a test notification',
        notification_type=NotificationType.IN_APP,
        status=NotificationStatus.PENDING
    )
    
    print(f"Created notification: {notification}")
    
    # Test user preferences
    preferences = UserNotificationPreference.objects.get(user=user)
    print(f"User preferences: {preferences}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
