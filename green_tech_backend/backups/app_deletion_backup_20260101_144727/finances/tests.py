"""
Tests for the finances app.
"""
import json
from decimal import Decimal
from datetime import date, timedelta

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from properties.models import Property, PropertyType, EcoFeature
from construction.models import Project
from .models import (
    FinancingOption, 
    GovernmentIncentive, 
    BankIntegration, 
    PaymentPlan, 
    ROICalculation,
    PaymentSchedule
)

User = get_user_model()


class BaseTestCase(APITestCase):
    """Base test case with common setup."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.customer = User.objects.create_user(
            email='customer@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        
        self.agent = User.objects.create_user(
            email='agent@example.com',
            password='testpass123',
            first_name='Jane',
            last_name='Smith',
            is_agent=True
        )
        
        # Create property types and eco features
        self.property_type = PropertyType.objects.create(
            name='Residential',
            description='Residential property'
        )
        
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            description='Photovoltaic solar panels'
        )
        
        self.eco_feature2 = EcoFeature.objects.create(
            name='Rainwater Harvesting',
            description='System to collect and store rainwater'
        )
        
        # Create a property
        self.property = Property.objects.create(
            title='Eco Home',
            description='Sustainable home with solar panels',
            property_type=self.property_type,
            price=500000,
            size=200,
            bedrooms=3,
            bathrooms=2,
            owner=self.customer,
            agent=self.agent
        )
        self.property.eco_features.add(self.eco_feature1)
        
        # Create a project
        self.project = Project.objects.create(
            name='Eco Home Construction',
            description='Construction of a sustainable home',
            user=self.customer,
            property=self.property,
            start_date=date.today(),
            expected_completion=date.today() + timedelta(days=180)
        )
        
        # Create test data for financial models
        self.financing_option = FinancingOption.objects.create(
            name='Green Home Loan',
            description='Special loan for eco-friendly homes',
            interest_rate=Decimal('3.5'),
            min_loan_amount=10000,
            max_loan_amount=1000000,
            min_loan_term=12,
            max_loan_term=360,
            is_active=True
        )
        
        self.government_incentive = GovernmentIncentive.objects.create(
            name='Solar Panel Rebate',
            incentive_type='rebate',
            description='Government rebate for solar panel installation',
            amount=2000,
            is_percentage=False,
            min_qualifying_amount=10000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            is_active=True,
            application_url='https://example.com/rebates/solar',
            documentation_required='Proof of purchase, installation certificate'
        )
        self.government_incentive.eligible_property_types.add(self.property_type)
        self.government_incentive.eligible_eco_features.add(self.eco_feature1)
        
        self.bank_integration = BankIntegration.objects.create(
            name='EcoBank',
            api_base_url='https://api.ecobank.com/v1',
            is_active=True
        )
        
        self.payment_plan = PaymentPlan.objects.create(
            name='5-Year Fixed',
            description='5-year fixed payment plan',
            down_payment_percentage=Decimal('20.0'),
            interest_rate=Decimal('4.5'),
            term_months=60,
            payment_frequency='monthly',
            is_active=True
        )
        
        self.roi_calculation = ROICalculation.objects.create(
            name='Solar Panel ROI',
            description='ROI calculation for solar panel installation',
            initial_cost=Decimal('10000.00'),
            annual_savings=Decimal('1500.00'),
            lifespan_years=20,
            maintenance_cost_per_year=Decimal('100.00')
        )
        
        self.payment_schedule = PaymentSchedule.objects.create(
            payment_plan=self.payment_plan,
            property=self.property,
            project=self.project,
            payment_amount=Decimal('1500.00'),
            payment_date=date.today() + timedelta(days=30),
            status='pending',
            created_by=self.customer
        )
        
        # API client
        self.client = APIClient()


class FinancingOptionTests(BaseTestCase):
    """Tests for the FinancingOption API."""
    
    def test_list_financing_options_authenticated(self):
        """Test retrieving financing options as an authenticated user."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('financing-option-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_filter_financing_options_by_loan_amount(self):
        """Test filtering financing options by loan amount."""
        self.client.force_authenticate(user=self.customer)
        url = f"{reverse('financing-option-list')}?loan_amount=50000"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_financing_option_as_admin(self):
        """Test creating a financing option as admin."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('financing-option-list')
        data = {
            'name': 'Eco Renovation Loan',
            'description': 'Loan for eco-friendly renovations',
            'interest_rate': '4.25',
            'min_loan_amount': '5000',
            'max_loan_amount': '200000',
            'min_loan_term': 6,
            'max_loan_term': 120,
            'is_active': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FinancingOption.objects.count(), 2)
    
    def test_create_financing_option_unauthorized(self):
        """Test that non-admin users cannot create financing options."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('financing-option-list')
        data = {'name': 'Test Loan', 'interest_rate': '5.0'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GovernmentIncentiveTests(BaseTestCase):
    """Tests for the GovernmentIncentive API."""
    
    def test_list_government_incentives(self):
        """Test retrieving government incentives."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('government-incentive-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_check_eligibility(self):
        """Test checking eligibility for incentives."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('government-incentive-check-eligibility')
        data = {'property_id': self.property.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('eligible_incentives', response.data)
        self.assertEqual(len(response.data['eligible_incentives']), 1)
    
    def test_filter_incentives_by_property_type(self):
        """Test filtering incentives by property type."""
        self.client.force_authenticate(user=self.customer)
        url = f"{reverse('government-incentive-list')}?property_type={self.property_type.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class PaymentPlanTests(BaseTestCase):
    """Tests for the PaymentPlan API."""
    
    def test_calculate_payment(self):
        """Test calculating a payment plan."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('payment-plan-calculate')
        data = {
            'amount': '100000',
            'interest_rate': '5.0',
            'term_months': 360,
            'down_payment': '20000',
            'payment_frequency': 'monthly'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('payment_amount', response.data)
        self.assertIn('total_interest', response.data)
    
    def test_invalid_payment_calculation(self):
        """Test payment calculation with invalid data."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('payment-plan-calculate')
        data = {'amount': '-10000'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ROICalculationTests(BaseTestCase):
    """Tests for the ROI Calculation API."""
    
    def test_calculate_roi(self):
        """Test calculating ROI."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('roi-calculation-calculate')
        data = {
            'initial_cost': '10000.00',
            'annual_savings': '1500.00',
            'lifespan_years': 10,
            'maintenance_cost_per_year': '100.00'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('roi_percentage', response.data)
        self.assertIn('payback_period_years', response.data)
        self.assertIn('is_viable', response.data)
    
    def test_roi_calculation_invalid_data(self):
        """Test ROI calculation with invalid data."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('roi-calculation-calculate')
        data = {'initial_cost': '-10000'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PaymentScheduleTests(BaseTestCase):
    """Tests for the PaymentSchedule API."""
    
    def test_list_payment_schedules(self):
        """Test retrieving payment schedules."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('payment-schedule-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_payment_schedule(self):
        """Test creating a payment schedule."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('payment-schedule-list')
        data = {
            'payment_plan': self.payment_plan.id,
            'property': self.property.id,
            'project': self.project.id,
            'payment_amount': '2000.00',
            'payment_date': (date.today() + timedelta(days=30)).isoformat(),
            'status': 'pending'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PaymentSchedule.objects.count(), 2)
    
    def test_payment_schedule_permissions(self):
        """Test that users can only see their own payment schedules."""
        # Create another user
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='User'
        )
        
        # Other user should not see the payment schedule
        self.client.force_authenticate(user=other_user)
        url = reverse('payment-schedule-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class BankIntegrationTests(BaseTestCase):
    """Tests for the BankIntegration API."""
    
    def test_bank_integration_admin_only(self):
        """Test that only admin users can access bank integrations."""
        # Regular user should be denied
        self.client.force_authenticate(user=self.customer)
        url = reverse('bank-integration-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin should be allowed
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class FinancialCalculationsTest(TestCase):
    """Test financial calculations."""
    
    def test_roi_calculation(self):
        """Test ROI calculation logic."""
        from .models import ROICalculation
        
        # Test case 1: Positive ROI
        roi1 = ROICalculation(
            initial_cost=10000,
            annual_savings=2000,
            lifespan_years=10,
            maintenance_cost_per_year=200
        )
        self.assertAlmostEqual(roi1.calculate_roi(), 80.0)  # (2000-200)*10 - 10000 / 10000 * 100 = 80%
        
        # Test case 2: Negative ROI
        roi2 = ROICalculation(
            initial_cost=10000,
            annual_savings=500,
            lifespan_years=10,
            maintenance_cost_per_year=200
        )
        self.assertAlmostEqual(roi2.calculate_roi(), -70.0)  # (500-200)*10 - 10000 / 10000 * 100 = -70%
    
    def test_payback_period_calculation(self):
        """Test payback period calculation logic."""
        from .models import ROICalculation
        
        # Test case 1: 5 year payback
        roi1 = ROICalculation(
            initial_cost=10000,
            annual_savings=2000,
            maintenance_cost_per_year=0
        )
        self.assertAlmostEqual(roi1.calculate_payback_period(), 5.0)  # 10000 / 2000 = 5 years
        
        # Test case 2: With maintenance costs
        roi2 = ROICalculation(
            initial_cost=10000,
            annual_savings=2500,
            maintenance_cost_per_year=500
        )
        self.assertAlmostEqual(roi2.calculate_payback_period(), 5.0)  # 10000 / (2500-500) = 5 years
        
        # Test case 3: Never pays back (negative savings)
        roi3 = ROICalculation(
            initial_cost=10000,
            annual_savings=500,
            maintenance_cost_per_year=1000
        )
        self.assertEqual(roi3.calculate_payback_period(), float('inf'))
