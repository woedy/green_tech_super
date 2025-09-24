"""
Test notifications functionality.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Notification, UserNotificationPreference
from notifications.enums import NotificationType, NotificationStatus

class Command(BaseCommand):
    help = 'Test notifications functionality'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Create or get test user
        user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'User',
                'password': 'testpass123'
            }
        )
        
        self.stdout.write(self.style.SUCCESS(f'User: {user}'))
        
        # Create a notification
        notification = Notification.objects.create(
            recipient=user,
            subject='Test Notification',
            message='This is a test notification',
            notification_type=NotificationType.IN_APP,
            status=NotificationStatus.PENDING
        )
        
        self.stdout.write(self.style.SUCCESS(f'Created notification: {notification}'))
        
        # Get user preferences
        preferences = UserNotificationPreference.objects.get(user=user)
        self.stdout.write(self.style.SUCCESS(f'User preferences: {preferences}'))
        
        self.stdout.write(self.style.SUCCESS('Test completed successfully!'))
