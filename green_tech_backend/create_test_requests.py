#!/usr/bin/env python
"""
Create sample construction requests for testing status filtering
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from construction.models.request import ConstructionRequest, ConstructionStatus, ConstructionType

def create_test_requests():
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
    else:
        print(f"Using existing test user: {user.email}")
    
    # Create sample requests with different statuses
    requests_data = [
        {
            'title': 'Modern Residential Villa',
            'construction_type': ConstructionType.NEW_CONSTRUCTION,
            'status': ConstructionStatus.DRAFT,
            'description': 'A beautiful 3-bedroom villa with modern amenities'
        },
        {
            'title': 'Office Complex Renovation',
            'construction_type': ConstructionType.RENOVATION,
            'status': ConstructionStatus.PENDING_APPROVAL,
            'description': 'Complete renovation of 5-story office building'
        },
        {
            'title': 'Eco-Friendly Apartment Building',
            'construction_type': ConstructionType.NEW_CONSTRUCTION,
            'status': ConstructionStatus.APPROVED,
            'description': 'Green apartment building with solar panels and rainwater harvesting'
        },
        {
            'title': 'Shopping Mall Extension',
            'construction_type': ConstructionType.EXTENSION,
            'status': ConstructionStatus.IN_PROGRESS,
            'description': 'Add new wing to existing shopping mall'
        },
        {
            'title': 'Sustainable Factory',
            'construction_type': ConstructionType.NEW_CONSTRUCTION,
            'status': ConstructionStatus.COMPLETED,
            'description': 'Industrial facility with sustainable features'
        }
    ]
    
    created_requests = []
    for req_data in requests_data:
        request_obj, created = ConstructionRequest.objects.get_or_create(
            title=req_data['title'],
            client=user,
            defaults=req_data
        )
        
        if created:
            print(f"Created request: {request_obj.title} ({request_obj.status})")
            created_requests.append(request_obj)
        else:
            print(f"Request already exists: {request_obj.title} ({request_obj.status})")
            # Update status if different
            if request_obj.status != req_data['status']:
                request_obj.status = req_data['status']
                request_obj.save()
                print(f"Updated status to: {request_obj.status}")
    
    print(f"\nTotal requests: {ConstructionRequest.objects.filter(client=user).count()}")
    print("Status breakdown:")
    for status in ConstructionStatus:
        count = ConstructionRequest.objects.filter(client=user, status=status.value).count()
        print(f"  {status.label}: {count}")

if __name__ == '__main__':
    create_test_requests()
