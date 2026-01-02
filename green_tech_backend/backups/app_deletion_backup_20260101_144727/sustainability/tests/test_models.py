from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from properties.models import Property
from construction.ghana.models import EcoFeature, GhanaRegion
from ..models import (
    SustainabilityScore, CertificationStandard, PropertyCertification,
    SustainabilityFeatureImpact, PropertyComparison, CostSavingsEstimate
)

User = get_user_model()


class SustainabilityModelTests(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create test region
        self.region = GhanaRegion.objects.create(
            name='GREATER_ACCRA',
            capital='Accra',
            cost_multiplier=1.3
        )
        
        # Create test eco features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            category='SOLAR',
            is_available=True
        )
        self.eco_feature2 = EcoFeature.objects.create(
            name='Rainwater Harvesting',
            category='WATER',
            is_available=True
        )
        
        # Create test property
        self.property = Property.objects.create(
            title='Test Property',
            description='A beautiful eco-friendly property',
            property_type='RESIDENTIAL',
            status='PUBLISHED',
            price=500000,
            currency='GHS',
            area=200,
            bedrooms=3,
            bathrooms=2,
            address='123 Test St',
            city='Accra',
            region='GREATER_ACCRA',
            created_by=self.user
        )
        self.property.eco_features.add(self.eco_feature1)
        
        # Create sustainability score
        self.sustainability_score = SustainabilityScore.objects.create(
            property=self.property,
            category='ENERGY',
            score=85,
            max_possible=100,
            details={'solar_panels': 30, 'insulation': 25, 'lighting': 20, 'appliances': 10}
        )
        
        # Create certification standard
        self.certification_standard = CertificationStandard.objects.create(
            name='Green Building Standard',
            description='Standard for eco-friendly buildings',
            issuing_organization='Green Building Council',
            minimum_score=70,
            required_categories=['ENERGY', 'WATER', 'MATERIALS']
        )
        
        # Create property certification
        self.property_certification = PropertyCertification.objects.create(
            property=self.property,
            standard=self.certification_standard,
            status='APPROVED',
            certificate_number='GB-001',
            issue_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=365),
            verified_by=self.user,
            verification_notes='All requirements met'
        )
        
        # Create sustainability feature impact
        self.feature_impact = SustainabilityFeatureImpact.objects.create(
            eco_feature=self.eco_feature1,
            energy_impact=30,
            water_impact=10,
            materials_impact=15,
            waste_impact=5,
            co2_reduction=2.5,
            water_savings=10000,
            cost_savings=5000
        )
        
        # Create property comparison
        self.comparison = PropertyComparison.objects.create(
            name='Eco Properties Comparison',
            description='Comparing eco-friendly properties',
            created_by=self.user
        )
        self.comparison.properties.add(self.property)
        
        # Create cost savings estimate
        self.cost_savings = CostSavingsEstimate.objects.create(
            property=self.property,
            eco_feature=self.eco_feature1,
            installation_cost=15000,
            annual_savings=3000,
            payback_period=5.0,
            annual_co2_reduction=2.5,
            annual_water_savings=10000,
            is_installed=True,
            installation_date=timezone.now().date(),
            notes='Installed last year'
        )
    
    def test_sustainability_score_creation(self):
        ""Test sustainability score creation and string representation."""
        self.assertEqual(str(self.sustainability_score), 'Energy Efficiency: 85/100')
        self.assertEqual(self.sustainability_score.score, 85)
        self.assertEqual(self.sustainability_score.max_possible, 100)
        self.assertEqual(self.sustainability_score.details['solar_panels'], 30)
    
    def test_certification_standard_creation(self):
        ""Test certification standard creation and string representation."""
        self.assertEqual(str(self.certification_standard), 'Green Building Standard')
        self.assertEqual(self.certification_standard.minimum_score, 70)
        self.assertIn('ENERGY', self.certification_standard.required_categories)
        self.assertIn('WATER', self.certification_standard.required_categories)
    
    def test_property_certification_creation(self):
        ""Test property certification creation and string representation."""
        self.assertEqual(
            str(self.property_certification),
            f'{self.property} - {self.certification_standard}'
        )
        self.assertEqual(self.property_certification.status, 'APPROVED')
        self.assertTrue(self.property_certification.is_active)
        
        # Test expired certification
        self.property_certification.expiry_date = timezone.now().date() - timedelta(days=1)
        self.property_certification.save()
        self.assertFalse(self.property_certification.is_active)
    
    def test_sustainability_feature_impact_creation(self):
        ""Test sustainability feature impact creation and string representation."""
        self.assertEqual(
            str(self.feature_impact),
            f'Impact of {self.eco_feature1.name}'
        )
        self.assertEqual(self.feature_impact.energy_impact, 30)
        self.assertEqual(self.feature_impact.water_impact, 10)
        self.assertEqual(self.feature_impact.co2_reduction, 2.5)
    
    def test_property_comparison_creation(self):
        ""Test property comparison creation and string representation."""
        self.assertEqual(
            str(self.comparison),
            'Eco Properties Comparison'
        )
        self.assertEqual(self.comparison.properties.count(), 1)
        self.assertEqual(self.comparison.properties.first(), self.property)
    
    def test_cost_savings_estimate_creation(self):
        ""Test cost savings estimate creation and string representation."""
        self.assertEqual(
            str(self.cost_savings),
            f'{self.eco_feature1.name} - {self.property.title}'
        )
        self.assertEqual(self.cost_savings.installation_cost, 15000)
        self.assertEqual(self.cost_savings.annual_savings, 3000)
        self.assertEqual(self.cost_savings.payback_period, 5.0)
        
        # Test payback period calculation on save
        new_savings = CostSavingsEstimate.objects.create(
            property=self.property,
            eco_feature=self.eco_feature2,
            installation_cost=10000,
            annual_savings=2000,
            annual_co2_reduction=1.5,
            annual_water_savings=5000,
            is_installed=False
        )
        self.assertEqual(new_savings.payback_period, 5.0)  # 10000 / 2000 = 5.0
    
    def test_sustainability_score_calculation(self):
        ""Test sustainability score calculation based on eco features."""
        # Add another eco feature to the property
        self.property.eco_features.add(self.eco_feature2)
        
        # Create impact for the second eco feature
        impact2 = SustainabilityFeatureImpact.objects.create(
            eco_feature=self.eco_feature2,
            energy_impact=15,
            water_impact=25,
            materials_impact=10,
            waste_impact=5,
            co2_reduction=1.5,
            water_savings=8000,
            cost_savings=3000
        )
        
        # In a real scenario, we would call a method to update scores
        # For now, we'll just test the model relationships
        energy_score = self.property.sustainability_scores.filter(category='ENERGY').first()
        self.assertIsNotNone(energy_score)
        
        # The actual score calculation would be done in a service or signal
        # This is just testing the relationship
        self.assertEqual(energy_score.property, self.property)
    
    def test_certification_requirements(self):
        ""Test certification requirements checking."""
        # In a real scenario, we would check if the property meets all requirements
        # This is just testing the model structure
        self.assertEqual(self.certification_standard.required_categories, ['ENERGY', 'WATER', 'MATERIALS'])
        
        # A property would need scores in all required categories to be certified
        # This would be checked in the certification process
        required_scores = SustainabilityScore.objects.filter(
            property=self.property,
            category__in=self.certification_standard.required_categories
        )
        
        # The property should have at least one score in a required category
        self.assertTrue(required_scores.exists())
