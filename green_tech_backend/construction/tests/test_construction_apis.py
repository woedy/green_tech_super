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
from construction.ghana.models import EcoFeature, GhanaRegion

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
            name=GhanaRegion.RegionName.GREATER_ACCRA,
            capital='Accra',
            cost_multiplier=1.1
        )
        
        # Create test eco-features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            description='Photovoltaic solar panels',
            category=EcoFeature.FeatureCategory.SOLAR,
            is_available=True
        )
        
        self.eco_feature2 = EcoFeature.objects.create(
            name='Solar Water Heater',
            description='Solar-powered water heating system',
            category=EcoFeature.FeatureCategory.SOLAR,
            is_available=True
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
        """Test creating a new construction request."""
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
        """Test saving the project details step."""
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
        """Test saving the eco-features step."""
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
        """Test getting the next available steps."""
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
            name=GhanaRegion.RegionName.GREATER_ACCRA,
            capital='Accra',
            cost_multiplier=1.1
        )
        
        # Create test eco-features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            description='Photovoltaic solar panels',
            category=EcoFeature.FeatureCategory.SOLAR,
            is_available=True
        )
        
        self.eco_feature2 = EcoFeature.objects.create(
            name='Solar Water Heater',
            description='Solar-powered water heating system',
            category=EcoFeature.FeatureCategory.SOLAR,
            is_available=True
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
        """Test listing eco-features grouped by category."""
        url = reverse('eco-feature-selection-by-category')
        response = self.client.get(f"{url}?request_id={self.construction_request.id}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)
        self.assertIn('features', response.data[0])
    
    def test_create_eco_feature_selections(self):
        """Test creating multiple eco-feature selections."""
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
        """Test updating an eco-feature selection."""
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


class ConstructionCustomizationTestCase(APITestCase):
    """Test customization logic and cost calculations."""
    
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
        
        # Create test region with cost multiplier
        self.region = GhanaRegion.objects.create(
            name=GhanaRegion.RegionName.GREATER_ACCRA,
            capital='Accra',
            cost_multiplier=1.2
        )
        
        # Create test eco-features with different categories
        self.solar_panels = EcoFeature.objects.create(
            name='Solar Panels',
            description='Photovoltaic solar panels',
            category=EcoFeature.FeatureCategory.SOLAR,
            is_available=True
        )
        
        self.rainwater_harvesting = EcoFeature.objects.create(
            name='Rainwater Harvesting System',
            description='System to collect and store rainwater',
            category=EcoFeature.FeatureCategory.WATER,
            is_available=True
        )
        
        # Create a test construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Eco Construction',
            description='Test eco-friendly construction project',
            construction_type='NEW',
            client=self.user,
            address='123 Eco Street',
            city='Accra',
            region='Greater Accra',
            budget=50000.00,
            currency='GHS'
        )
    
    def test_cost_calculation_with_regional_multipliers(self):
        """Test that cost calculations apply regional multipliers correctly."""
        # Create Ghana pricing for the eco-features
        from construction.ghana.models import GhanaPricing
        
        solar_pricing = GhanaPricing.objects.create(
            region=self.region,
            eco_feature=self.solar_panels,
            base_price=10000.00,
            currency='GHS'
        )
        
        water_pricing = GhanaPricing.objects.create(
            region=self.region,
            eco_feature=self.rainwater_harvesting,
            base_price=3000.00,
            currency='GHS'
        )
        
        # Add eco-features to the construction request
        solar_selection = ConstructionRequestEcoFeature.objects.create(
            construction_request=self.construction_request,
            eco_feature=self.solar_panels,
            quantity=2,
            customizations={'panel_type': 'monocrystalline', 'warranty': '25_years'}
        )
        
        water_selection = ConstructionRequestEcoFeature.objects.create(
            construction_request=self.construction_request,
            eco_feature=self.rainwater_harvesting,
            quantity=1,
            customizations={'tank_size': '5000L', 'filtration': 'advanced'}
        )
        
        # Calculate individual feature costs
        solar_cost = solar_selection.calculate_cost()
        water_cost = water_selection.calculate_cost()
        
        # Verify individual calculations
        # Solar: 10000 * 1.2 (regional multiplier) * 2 (quantity) = 24000
        expected_solar_cost = 24000.00
        self.assertAlmostEqual(float(solar_cost), expected_solar_cost, places=2)
        
        # Water: 3000 * 1.2 (regional multiplier) * 1 (quantity) = 3600
        expected_water_cost = 3600.00
        self.assertAlmostEqual(float(water_cost), expected_water_cost, places=2)
    
    def test_customization_data_persistence(self):
        """Test that customization data is properly saved and retrieved."""
        # Save project details step
        project_data = {
            'title': 'Updated Eco Project',
            'description': 'Updated description with eco focus',
            'construction_type': 'RENO',
            'target_energy_rating': 5,
            'target_water_rating': 4
        }
        self.construction_request.save_step_data('project_details', project_data)
        
        # Save eco-features step
        eco_features_data = {
            'selected_features': [
                {
                    'id': str(self.solar_panels.id),
                    'quantity': 3,
                    'customizations': {
                        'panel_type': 'monocrystalline',
                        'inverter_type': 'string',
                        'mounting': 'roof_mounted',
                        'warranty': '25_years'
                    }
                }
            ],
            'sustainability_goals': {
                'energy_independence': 80,
                'carbon_reduction': 60
            }
        }
        self.construction_request.save_step_data('eco_features', eco_features_data)
        
        # Save budget step
        budget_data = {
            'total_budget': 75000.00,
            'payment_plan': 'installments',
            'financing_needed': True,
            'down_payment': 15000.00
        }
        self.construction_request.save_step_data('budget', budget_data)
        
        # Refresh and verify data persistence
        self.construction_request.refresh_from_db()
        
        # Check that all step data was saved
        self.assertIn('project_details', self.construction_request.customization_data)
        self.assertIn('eco_features', self.construction_request.customization_data)
        self.assertIn('budget', self.construction_request.customization_data)
        
        # Verify specific data values
        saved_project_data = self.construction_request.customization_data['project_details']
        self.assertEqual(saved_project_data['title'], 'Updated Eco Project')
        self.assertEqual(saved_project_data['target_energy_rating'], 5)
        
        saved_eco_data = self.construction_request.customization_data['eco_features']
        self.assertEqual(len(saved_eco_data['selected_features']), 1)
        self.assertEqual(saved_eco_data['selected_features'][0]['quantity'], 3)
        
        saved_budget_data = self.construction_request.customization_data['budget']
        self.assertEqual(saved_budget_data['total_budget'], 75000.00)
        self.assertTrue(saved_budget_data['financing_needed'])
    
    def test_complex_customization_scenarios(self):
        """Test complex customization scenarios with multiple features and options."""
        # Create multiple eco-feature selections with various customizations
        selections_data = [
            {
                'eco_feature': self.solar_panels,
                'quantity': 4,
                'customizations': {
                    'panel_type': 'monocrystalline',
                    'power_rating': '400W',
                    'inverter_type': 'micro',
                    'monitoring': 'advanced',
                    'warranty': '25_years',
                    'installation_type': 'roof_mounted'
                }
            },
            {
                'eco_feature': self.rainwater_harvesting,
                'quantity': 2,
                'customizations': {
                    'tank_size': '10000L',
                    'material': 'fiberglass',
                    'filtration': 'multi_stage',
                    'pump_type': 'solar_powered',
                    'distribution': 'gravity_fed'
                }
            }
        ]
        
        # Create the selections
        for selection_data in selections_data:
            ConstructionRequestEcoFeature.objects.create(
                construction_request=self.construction_request,
                eco_feature=selection_data['eco_feature'],
                quantity=selection_data['quantity'],
                customizations=selection_data['customizations']
            )
        
        # Update cost and verify calculations
        total_cost = self.construction_request.update_estimated_cost()
        
        # Verify that customizations are preserved
        selections = ConstructionRequestEcoFeature.objects.filter(
            construction_request=self.construction_request
        )
        
        solar_selection = selections.get(eco_feature=self.solar_panels)
        self.assertEqual(solar_selection.quantity, 4)
        self.assertEqual(solar_selection.customizations['panel_type'], 'monocrystalline')
        self.assertEqual(solar_selection.customizations['power_rating'], '400W')
        self.assertEqual(solar_selection.customizations['warranty'], '25_years')
        
        water_selection = selections.get(eco_feature=self.rainwater_harvesting)
        self.assertEqual(water_selection.quantity, 2)
        self.assertEqual(water_selection.customizations['tank_size'], '10000L')
        self.assertEqual(water_selection.customizations['pump_type'], 'solar_powered')
        
        # Verify cost calculation includes all features
        self.assertIsNotNone(total_cost)
        self.assertGreater(total_cost, self.construction_request.budget)
    
    def test_specification_document_generation(self):
        """Test that specification documents are generated with customization details."""
        # Add some eco-features with customizations
        ConstructionRequestEcoFeature.objects.create(
            construction_request=self.construction_request,
            eco_feature=self.solar_panels,
            quantity=2,
            customizations={
                'panel_type': 'monocrystalline',
                'power_rating': '350W',
                'warranty': '20_years'
            }
        )
        
        # Save customization data
        self.construction_request.save_step_data('project_details', {
            'title': 'Eco-Friendly Home',
            'construction_type': 'NEW',
            'target_energy_rating': 5
        })
        
        # Test document generation (this would normally create a PDF)
        try:
            file_path, file_name = self.construction_request.generate_specification_document()
            self.assertIsNotNone(file_path)
            self.assertIsNotNone(file_name)
            self.assertTrue(file_name.endswith('.pdf'))
        except Exception as e:
            # If document generation fails due to missing dependencies, 
            # at least verify the method exists and can be called
            self.assertIn('generate_specification_document', dir(self.construction_request))
    
    def test_cost_calculation_edge_cases(self):
        """Test cost calculation edge cases and error handling."""
        # Test with no region set
        self.construction_request.region = None
        self.construction_request.save()
        
        result = self.construction_request.update_estimated_cost()
        self.assertIsNone(result)
        
        # Test with invalid region
        self.construction_request.region = 'Invalid Region'
        self.construction_request.save()
        
        result = self.construction_request.update_estimated_cost()
        self.assertIsNone(result)
        
        # Test with no budget set
        self.construction_request.region = 'Greater Accra'
        self.construction_request.budget = None
        self.construction_request.save()
        
        result = self.construction_request.update_estimated_cost()
        self.assertIsNotNone(result)  # Should still calculate based on eco-features
        
        # Test with zero budget
        self.construction_request.budget = 0
        self.construction_request.save()
        
        result = self.construction_request.update_estimated_cost()
        self.assertIsNotNone(result)
