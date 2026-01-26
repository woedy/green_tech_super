#!/usr/bin/env python
"""Test notification system with real UUIDs."""

import os
import sys
import django
import requests

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.models import Notification

User = get_user_model()

def test_notification_system():
    """Test the notification system with real UUIDs."""
    
    # Get test user
    user = User.objects.get(email='test@example.com')
    
    # Get real notifications with UUIDs
    notifications = Notification.objects.filter(recipient=user)
    
    print(f"Found {notifications.count()} notifications for {user.email}")
    
    # Get auth token
    auth_response = requests.post('http://localhost:8000/api/v1/auth/token/', json={
        'email': 'test@example.com',
        'password': 'testpass123'
    })
    
    if auth_response.status_code != 200:
        print(f"Auth failed: {auth_response.status_code}")
        return
    
    token = auth_response.json()['access']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Test notifications endpoint
    notif_response = requests.get('http://localhost:8000/api/dashboard/notifications/', headers=headers)
    
    if notif_response.status_code == 200:
        data = notif_response.json()
        print(f"✓ Notifications endpoint working: {len(data['notifications'])} notifications returned")
        print(f"✓ Unread count: {data['unread_count']}")
        
        # Test mark-as-read with first real UUID notification
        if data['notifications']:
            # Find a notification with UUID format (not sample_*)
            uuid_notification = None
            for notif in data['notifications']:
                if '-' in notif['id'] and len(notif['id']) == 36:  # UUID format
                    uuid_notification = notif
                    break
            
            if uuid_notification:
                notif_id = uuid_notification['id']
                print(f"✓ Testing mark-as-read with UUID: {notif_id}")
                
                # Mark as read
                mark_response = requests.patch(
                    f'http://localhost:8000/api/dashboard/notifications/{notif_id}/read/',
                    headers=headers
                )
                
                if mark_response.status_code == 200:
                    print("✓ Mark-as-read endpoint working")
                else:
                    print(f"✗ Mark-as-read failed: {mark_response.status_code}")
                
                # Test mark-all-read
                mark_all_response = requests.patch(
                    'http://localhost:8000/api/dashboard/notifications/mark-all-read/',
                    headers=headers
                )
                
                if mark_all_response.status_code == 200:
                    print("✓ Mark-all-read endpoint working")
                    result = mark_all_response.json()
                    print(f"✓ Marked {result.get('count', 0)} notifications as read")
                else:
                    print(f"✗ Mark-all-read failed: {mark_all_response.status_code}")
                
                # Test preferences update
                prefs_response = requests.patch(
                    'http://localhost:8000/api/dashboard/notifications/',
                    headers=headers,
                    json={
                        'preferences': {
                            'email': False,
                            'sms': True,
                            'in_app': True,
                            'project_updates': False,
                            'quote_notifications': True,
                            'payment_reminders': False,
                            'marketing_emails': True
                        }
                    }
                )
                
                if prefs_response.status_code == 200:
                    print("✓ Preferences update endpoint working")
                else:
                    print(f"✗ Preferences update failed: {prefs_response.status_code}")
            else:
                print("✗ No UUID notifications found (all are sample notifications)")
        else:
            print("✗ No notifications returned")
    else:
        print(f"✗ Notifications endpoint failed: {notif_response.status_code}")
    
    print("\n🎉 Notification system test complete!")

if __name__ == '__main__':
    test_notification_system()
