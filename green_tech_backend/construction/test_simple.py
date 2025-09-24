from django.test import TestCase
from django.contrib.auth import get_user_model
from properties.models import Property
from .models import ConstructionRequest, ConstructionMilestone, Project, ConstructionDocument

User = get_user_model()

class SimpleConstructionTest(TestCase):
    """A simple test case to verify basic model functionality."""
    
    def test_create_construction_request(self):
        """Test creating a simple construction request."""
        # Create a test user
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create a property
        property = Property.objects.create(
            title='Test Property',
            description='Test description',
            price=100000,
            location='Accra, Ghana',
            property_type='residential',
            status='for_sale',
            created_by=user
        )
        
        # Create a construction request
        construction = ConstructionRequest.objects.create(
            title='Test Construction',
            description='Test description',
            property=property,
            client=user,
            budget=50000,
            currency='GHS'
        )
        
        # Verify the construction request was created
        self.assertEqual(ConstructionRequest.objects.count(), 1)
        self.assertEqual(construction.title, 'Test Construction')
        self.assertEqual(construction.client, user)
        self.assertEqual(construction.property, property)
