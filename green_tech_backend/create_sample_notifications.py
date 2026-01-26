#!/usr/bin/env python
"""Create sample notifications for testing."""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.models import Notification, UserNotificationPreference
from django.utils import timezone
import uuid

User = get_user_model()

def create_sample_notifications():
    """Create sample notifications for testing."""
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User'
        }
    )

    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created test user: {user.email}")

    # Create user notification preferences
    prefs, created = UserNotificationPreference.objects.get_or_create(
        user=user,
        defaults={
            'email_notifications': True,
            'sms_notifications': False,
            'in_app_notifications': True,
            'project_updates': True,
            'quote_updates': True,
            'payment_reminders': True,
            'marketing': False,
        }
    )
    
    if created:
        print(f"Created notification preferences for {user.email}")

    # Create sample notifications
    notifications_data = [
        {
            'subject': 'Welcome to Green Tech Africa',
            'message': 'Your account has been successfully created. Explore our eco-friendly construction solutions.',
            'priority': 'normal',
        },
        {
            'subject': 'Quote Ready for Review',
            'message': 'Your quote for the Eco Bungalow project is ready for review. Please check the details and confirm.',
            'priority': 'high',
        },
        {
            'subject': 'Project Milestone Completed',
            'message': 'Foundation work has been completed for your Accra project. The team is moving to the next phase.',
            'priority': 'normal',
        },
        {
            'subject': 'Payment Due Soon',
            'message': 'Next payment for your project is due in 3 days. Please ensure timely payment to avoid delays.',
            'priority': 'high',
        },
        {
            'subject': 'New Project Update Available',
            'message': 'New photos and progress updates have been added to your project gallery.',
            'priority': 'normal',
        }
    ]

    for i, notif_data in enumerate(notifications_data):
        notification, created = Notification.objects.get_or_create(
            id=uuid.uuid4(),
            recipient=user,
            subject=notif_data['subject'],
            defaults={
                'message': notif_data['message'],
                'notification_type': 'in_app',
                'status': 'read' if i >= 2 else 'pending',  # Mark some as read
                'priority': notif_data['priority'],
                'sent_at': timezone.now() - timezone.timedelta(hours=i+1),
            }
        )
        
        if not created and notification.status == 'read':
            notification.read_at = timezone.now() - timezone.timedelta(hours=i+1)
            notification.save()

    unread_count = Notification.objects.filter(
        recipient=user, 
        status__in=['pending', 'sent', 'delivered']
    ).count()
    
    total_count = Notification.objects.filter(recipient=user).count()
    
    print(f'Created {total_count} sample notifications for user {user.email}')
    print(f'Unread count: {unread_count}')
    
    return user

if __name__ == '__main__':
    create_sample_notifications()
