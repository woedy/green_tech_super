"""
Tests for quote system consolidation.
"""

from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from quotes.models import Quote, QuoteType, QuoteLineItem, QuoteLineItemKind
from construction.models import ConstructionRequest
from plans.models import Plan, BuildRequest
from locations.models import Region

User = get_user_model()


class QuoteConsolidationTestCase(TestCase):
    """Test cases for the consolidated quote system."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create a region
        self.region = Region.objects.create(
            name='Test Region',
            country='Ghana',
            cost_multiplier=Decimal('1.2')
        )
        
        # Create a plan for build requests
        self.plan = Plan.objects.create(
            title='Test Plan',
            description='A test building plan',
            base_price=Decimal('10000.00'),
            is_published=True
        )
        
        # Create a build request
        self.build_request = BuildRequest.objects.create(
            plan=self.plan,
            region=self.region,
            contact_name='John Doe',
            contact_email='john@example.com',
            contact_phone='+233123456789',
            customizations={'rooms': 3}
        )
        
        # Create a construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction Project',
            client=self.user,
            region='Test Region',
            construction_type='NEW',
            budget=Decimal('50000.00')
        )
    
    def test_build_request_quote_creation(self):
        """Test creating a quote for a build request."""
        quote = Quote.objects.create(
            quote_type=QuoteType.BUILD_REQUEST,
            build_request=self.build_request,
            region=self.region,
            currency_code='GHS',
            regional_multiplier=Decimal('1.2')
        )
        
        self.assertEqual(quote.quote_type, QuoteType.BUILD_REQUEST)
        self.assertTrue(quote.reference.startswith('Q'))
        self.assertEqual(quote.region, self.region)
        self.assertEqual(quote.build_request, self.build_request)
        self.assertIsNone(quote.construction_request)
    
    def test_construction_project_quote_creation(self):
        """Test creating a quote for a construction project."""
        quote = Quote.objects.create(
            quote_type=QuoteType.CONSTRUCTION_PROJECT,
            construction_request=self.construction_request,
            region=self.region,
            currency_code='GHS',
            regional_multiplier=Decimal('1.2')
        )
        
        self.assertEqual(quote.quote_type, QuoteType.CONSTRUCTION_PROJECT)
        self.assertTrue(quote.reference.startswith('CQ'))
        self.assertEqual(quote.region, self.region)
        self.assertEqual(quote.construction_request, self.construction_request)
        self.assertIsNone(quote.build_request)
    
    def test_quote_totals_calculation(self):
        """Test that quote totals are calculated correctly with tax and discount."""
        quote = Quote.objects.create(
            quote_type=QuoteType.BUILD_REQUEST,
            build_request=self.build_request,
            region=self.region,
            currency_code='GHS',
            regional_multiplier=Decimal('1.0')
        )
        
        # Add line items
        item1 = QuoteLineItem.objects.create(
            quote=quote,
            kind=QuoteLineItemKind.BASE,
            label='Foundation Work',
            quantity=Decimal('1.0'),
            unit_cost=Decimal('1000.00'),
            metadata={'tax_amount': 150.0, 'discount_amount': 50.0}
        )
        
        item2 = QuoteLineItem.objects.create(
            quote=quote,
            kind=QuoteLineItemKind.OPTION,
            label='Solar Panels',
            quantity=Decimal('2.0'),
            unit_cost=Decimal('500.00'),
            metadata={'tax_amount': 150.0}
        )
        
        # Recalculate totals
        quote.recalculate_totals()
        
        # Check calculations
        self.assertEqual(quote.subtotal_amount, Decimal('1000.00'))  # Base items only
        self.assertEqual(quote.tax_amount, Decimal('300.00'))  # Total tax
        self.assertEqual(quote.discount_amount, Decimal('50.00'))  # Total discount
        # Total should be subtotal + tax - discount + options (1000 + 300 - 50 + 1000)
        expected_total = Decimal('2250.00')
        self.assertEqual(quote.total_amount, expected_total)
    
    def test_quote_revision_creation(self):
        """Test creating a revision of a quote."""
        quote = Quote.objects.create(
            quote_type=QuoteType.BUILD_REQUEST,
            build_request=self.build_request,
            region=self.region,
            status='sent',
            version=1
        )
        
        # Add a line item
        QuoteLineItem.objects.create(
            quote=quote,
            kind=QuoteLineItemKind.BASE,
            label='Original Item',
            quantity=Decimal('1.0'),
            unit_cost=Decimal('1000.00')
        )
        
        # Create revision
        revision = quote.create_revision(self.user, 'Price update')
        
        self.assertEqual(revision.version, 2)
        self.assertEqual(revision.parent_quote, quote)
        self.assertEqual(revision.status, 'draft')
        self.assertEqual(revision.items.count(), 1)
        self.assertEqual(revision.items.first().label, 'Original Item')
    
    def test_quote_type_constraint(self):
        """Test that quote type constraints are enforced."""
        # This test would verify the database constraint
        # In a real scenario, this would raise an IntegrityError
        # when trying to create invalid combinations
        pass