"""
Tests for the dashboard app.
"""
from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta

# Import models for test data creation
from properties.models import Property
from construction.models import Project, ConstructionRequest

User = get_user_model()


class DashboardAPITestCase(TestCase):
    """Test cases for the Dashboard API."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.agent_user = User.objects.create_user(
            email='agent@example.com',
            password='agentpass123',
            first_name='Agent',
            last_name='User',
            is_agent=True
        )
        
        self.customer_user = User.objects.create_user(
            email='customer@example.com',
            password='customerpass123',
            first_name='Customer',
            last_name='User'
        )
        
        # Create test properties
        self.property1 = Property.objects.create(
            title='Test Property 1',
            description='A test property',
            price=250000.00,
            location='Accra, Ghana',
            agent=self.agent_user,
            is_published=True
        )
        
        self.property2 = Property.objects.create(
            title='Test Property 2',
            description='Another test property',
            price=350000.00,
            location='Kumasi, Ghana',
            agent=self.agent_user,
            is_published=True
        )
        
        # Create test construction requests
        self.construction_request = ConstructionRequest.objects.create(
            user=self.customer_user,
            property=self.property1,
            status='pending',
            budget=300000.00,
            timeline_months=12
        )
        
        # Create test projects
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project',
            status='in_progress',
            progress_percentage=30,
            start_date=datetime.now() - timedelta(days=30),
            expected_end_date=datetime.now() + timedelta(days=60),
            construction_request=self.construction_request
        )

        # Set up API client
        self.client = APIClient()

    def test_admin_dashboard_access(self):
        """
        Test admin user can access dashboard.
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('v1:api:dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('quick_actions', response.data)
        self.assertEqual(response.data['stats']['role'], 'admin')

    def test_agent_dashboard_access(self):
        """
        Test agent user can access dashboard.
        """
        self.client.force_authenticate(user=self.agent_user)
        url = reverse('v1:api:dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('quick_actions', response.data)
        self.assertEqual(response.data['stats']['role'], 'agent')

    def test_customer_dashboard_access(self):
        """
        Test customer user can access dashboard.
        """
        self.client.force_authenticate(user=self.customer_user)
        url = reverse('v1:api:dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('quick_actions', response.data)
        self.assertEqual(response.data['stats']['role'], 'customer')

    def test_analytics_endpoint(self):
        """
        Test analytics endpoint with different timeframes.
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('v1:api:analytics')

        # Test with default timeframe
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('timeframe', response.data)
        self.assertIn('property_views', response.data)
        self.assertIn('new_users', response.data)
        self.assertIn('construction_requests', response.data)

        # Test with specific timeframe
        for timeframe in ['7d', '30d', '90d', '1y']:
            response = self.client.get(f"{url}?timeframe={timeframe}")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['timeframe'], timeframe)

    def test_consolidated_view_endpoint(self):
        """
        Test the consolidated view endpoint with different user roles.
        """
        # Test admin access
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('v1:api:consolidated')

        # Test with default parameters
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

        # Test with view_type=projects
        response = self.client.get(f"{url}?view_type=projects")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test with view_type=properties
        response = self.client.get(f"{url}?view_type=properties")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test pagination
        response = self.client.get(f"{url}?page=1&page_size=5")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test agent access
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test customer access
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_consolidated_view_invalid_parameters(self):
        """
        Test the consolidated view with invalid parameters.
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('v1:api:consolidated')

        # Invalid view_type
        response = self.client.get(f"{url}?view_type=invalid")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid page
        response = self.client.get(f"{url}?page=0")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid page_size
        response = self.client.get(f"{url}?page_size=0")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_access(self):
        """
        Test that unauthenticated users cannot access dashboard endpoints.
        """
        # Test dashboard endpoint
        url = reverse('v1:api:dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test analytics endpoint
        url = reverse('v1:api:analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test consolidated endpoint
        url = reverse('v1:api:consolidated')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
