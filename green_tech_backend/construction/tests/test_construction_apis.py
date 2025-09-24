"""
Tests for the Construction Request and Eco-Feature Selection APIs.
"""
import json
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from construction.models import (
    ConstructionRequest, ConstructionRequestEcoFeature, ConstructionRequestStep
)
from construction.ghana.models import EcoFeature, EcoFeatureCategory, GhanaRegion

User = get_user_model()


class ConstructionRequestAPITestCase(APITestCase):
    """Test the construction request API endpoints."""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test region
        self.region = GhanaRegion.objects.create(
            name='Greater Accra',
            code='GA',
            cost_multipliers={
                'SOLAR': 1.1,
                'WATER': 1.0,
                'MATERIALS': 1.2
            }
        )
        
        # Create test eco-feature category
        self.category = EcoFeatureCategory.objects.create(
            name='Solar',
            description='Solar energy features',
            icon='solar-panel'
        )
        
        # Create test eco-features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            description='Photovoltaic solar panels',
            category=self.category,
            base_cost=5000.00,
            energy_impact=30,
            water_impact=0,
            materials_impact=10,
            waste_impact=5
        )
        
        self.eco_feature2 = EcoFeature.objects.create(
            name='Solar Water Heater',
            description='Solar-powered water heating system',
            category=self.category,
            base_cost=2500.00,
            energy_impact=25,
            water_impact=15,
            materials_impact=5,
            waste_impact=2
        )
        
        # Create a test construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction',
            description='Test description',
            construction_type='NEW',
            client=self.user,
            address='123 Test St',
            city='Accra',
            region='Greater Accra',
            budget=100000.00,
            currency='GHS'
        )
    
    def test_create_construction_request(self):
        ""Test creating a new construction request."""
        url = reverse('construction-request-list')
        data = {
            'title': 'New Construction Project',
            'description': 'A new eco-friendly home',
            'construction_type': 'NEW',
            'address': '456 New St',
            'city': 'Kumasi',
            'region': 'Ashanti',
            'budget': '150000.00',
            'currency': 'GHS'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ConstructionRequest.objects.count(), 2)
        self.assertEqual(ConstructionRequest.objects.latest('id').title, 'New Construction Project')
    
    def test_save_project_details_step(self):
        ""Test saving the project details step."""
        url = reverse('construction-request-save-step', args=[self.construction_request.id])
        data = {
            'step': 'project_details',
            'data': {
                'title': 'Updated Title',
                'description': 'Updated description',
                'construction_type': 'RENO'
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh the instance
        self.construction_request.refresh_from_db()
        self.assertEqual(self.construction_request.title, 'Updated Title')
        self.assertEqual(self.construction_request.construction_type, 'RENO')
        self.assertEqual(self.construction_request.current_step, 'project_details')
    
    def test_save_eco_features_step(self):
        ""Test saving the eco-features step."""
        url = reverse('construction-request-save-step', args=[self.construction_request.id])
        data = {
            'step': 'eco_features',
            'data': {
                'selected_features': [
                    {
                        'id': str(self.eco_feature1.id),
                        'quantity': 2,
                        'customizations': {'size': 'large'}
                    },
                    {
                        'id': str(self.eco_feature2.id),
                        'quantity': 1,
                        'customizations': {}
                    }
                ]
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that the eco-features were saved
        self.assertEqual(self.construction_request.selected_eco_features.count(), 2)
        
        # Check that the estimated cost was updated
        self.construction_request.refresh_from_db()
        self.assertIsNotNone(self.construction_request.estimated_cost)
    
    def test_get_next_steps(self):
        ""Test getting the next available steps."""
        # Set the current step to project_details
        self.construction_request.current_step = 'project_details'
        self.construction_request.save()
        
        url = reverse('construction-request-next-steps', args=[self.construction_request.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next_steps', response.data)
        self.assertGreater(len(response.data['next_steps']), 0)


class EcoFeatureSelectionAPITestCase(APITestCase):
    """Test the eco-feature selection API endpoints."""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test region
        self.region = GhanaRegion.objects.create(
            name='Greater Accra',
            code='GA',
            cost_multipliers={'SOLAR': 1.1}
        )
        
        # Create test eco-feature category
        self.category = EcoFeatureCategory.objects.create(
            name='Solar',
            description='Solar energy features',
            icon='solar-panel'
        )
        
        # Create test eco-features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            description='Photovoltaic solar panels',
            category=self.category,
            base_cost=5000.00
        )
        
        self.eco_feature2 = EcoFeature.objects.create(
            name='Solar Water Heater',
            description='Solar-powered water heating system',
            category=self.category,
            base_cost=2500.00
        )
        
        # Create a test construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction',
            client=self.user,
            address='123 Test St',
            city='Accra',
            region='Greater Accra',
            budget=100000.00,
            currency='GHS'
        )
    
    def test_list_eco_features_by_category(self):
        ""Test listing eco-features grouped by category."""
        url = reverse('eco-feature-selection-by-category')
        response = self.client.get(f"{url}?request_id={self.construction_request.id}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)
        self.assertIn('features', response.data[0])
    
    def test_create_eco_feature_selections(self):
        ""Test creating multiple eco-feature selections."""
        url = reverse('eco-feature-selection-list')
        data = {
            'request_id': str(self.construction_request.id),
            'features': [
                {
                    'id': str(self.eco_feature1.id),
                    'quantity': 2,
                    'customizations': {'size': 'large'}
                },
                {
                    'id': str(self.eco_feature2.id),
                    'quantity': 1,
                    'customizations': {}
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)
        
        # Verify the selections were created
        selections = ConstructionRequestEcoFeature.objects.filter(
            construction_request=self.construction_request
        )
        self.assertEqual(selections.count(), 2)
        
        # Verify the estimated costs were calculated
        for selection in selections:
            self.assertIsNotNone(selection.estimated_cost)
    
    def test_update_eco_feature_selection(self):
        ""Test updating an eco-feature selection."""
        # Create a selection first
        selection = ConstructionRequestEcoFeature.objects.create(
            construction_request=self.construction_request,
            eco_feature=self.eco_feature1,
            quantity=1,
            customizations={}
        )
        
        url = reverse('eco-feature-selection-detail', args=[selection.id])
        data = {
            'quantity': 3,
            'customizations': {'size': 'extra large'}
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the update
        selection.refresh_from_db()
        self.assertEqual(selection.quantity, 3)
        self.assertEqual(selection.customizations, {'size': 'extra large'})
        self.assertIsNotNone(selection.estimated_cost)
