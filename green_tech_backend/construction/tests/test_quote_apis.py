""
Tests for the Quote API endpoints.
"""
import json
from datetime import datetime, timedelta
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from construction.models import (
    ConstructionRequest, 
    Quote, 
    QuoteItem,
    QuoteStatus,
    QuoteChangeLog
)
from properties.models import Property

User = get_user_model()


class QuoteAPITestCase(APITestCase):
    """Test suite for the Quote API endpoints."""
    
    def setUp(self):
        # Create test users
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            first_name='Test',
            last_name='Client'
        )
        self.staff_user = User.objects.create_user(
            email='staff@example.com',
            password='testpass123',
            first_name='Staff',
            last_name='User',
            is_staff=True
        )
        
        # Create a test property
        self.property = Property.objects.create(
            title='Test Property',
            description='A test property',
            price=100000,
            address='123 Test St',
            city='Test City',
            region='Greater Accra',
            property_type='RESIDENTIAL',
            status='AVAILABLE',
            created_by=self.client_user
        )
        
        # Create a construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction',
            description='Test construction request',
            construction_type='NEW_CONSTRUCTION',
            status='DRAFT',
            client=self.client_user,
            property=self.property,
            address='123 Test St',
            city='Test City',
            region='Greater Accra',
            budget=50000,
            currency='GHS',
            start_date=timezone.now().date(),
            estimated_end_date=(timezone.now() + timedelta(days=90)).date()
        )
        
        # Create a test quote
        self.quote = Quote.objects.create(
            quote_number='QT-20230001-0001',
            status=QuoteStatus.DRAFT,
            construction_request=self.construction_request,
            created_by=self.staff_user,
            valid_until=timezone.now().date() + timedelta(days=30),
            subtotal=Decimal('10000.00'),
            tax_amount=Decimal('1500.00'),
            discount_amount=Decimal('500.00'),
            total_amount=Decimal('11000.00')
        )
        
        # Create some test quote items
        self.quote_item1 = QuoteItem.objects.create(
            quote=self.quote,
            description='Foundation Work',
            quantity=Decimal('1.00'),
            unit_price=Decimal('5000.00'),
            tax_rate=Decimal('15.00'),
            discount_amount=Decimal('250.00')
        )
        
        self.quote_item2 = QuoteItem.objects.create(
            quote=self.quote,
            description='Roofing',
            quantity=Decimal('1.00'),
            unit_price=Decimal('5000.00'),
            tax_rate=Decimal('15.00'),
            discount_amount=Decimal('250.00')
        )
        
        # Set up URLs
        self.quote_list_url = reverse('quote-list')
        self.quote_detail_url = reverse('quote-detail', kwargs={'pk': self.quote.id})
        self.quote_submit_url = reverse('quote-submit', kwargs={'pk': self.quote.id})
        self.quote_approve_url = reverse('quote-approve', kwargs={'pk': self.quote.id})
        self.quote_reject_url = reverse('quote-reject', kwargs={'pk': self.quote.id})
        self.quote_revise_url = reverse('quote-create-revision', kwargs={'pk': self.quote.id})
        self.quote_history_url = reverse('quote-history', kwargs={'pk': self.quote.id})
        
        # Set up item URLs
        self.quote_item_list_url = reverse('quote-item-list', kwargs={'quote_pk': self.quote.id})
        self.quote_item_detail_url = reverse(
            'quote-item-detail', 
            kwargs={'quote_pk': self.quote.id, 'pk': self.quote_item1.id}
        )
    
    def test_quote_list_authenticated(self):
        ""Test retrieving quotes as an authenticated user."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.quote_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_quote_list_unauthenticated(self):
        ""Test that unauthenticated users cannot access quotes."""
        response = self.client.get(self.quote_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_quote_retrieve_owner(self):
        ""Test that a quote owner can retrieve their quote."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.quote_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quote_number'], self.quote.quote_number)
    
    def test_quote_create(self):
        ""Test creating a new quote."""
        self.client.force_authenticate(user=self.staff_user)
        
        data = {
            'construction_request': self.construction_request.id,
            'valid_until': (timezone.now().date() + timedelta(days=30)).isoformat(),
            'subtotal': '15000.00',
            'tax_amount': '2250.00',
            'discount_amount': '1000.00',
            'notes': 'Test quote creation',
            'terms_and_conditions': 'Standard terms and conditions apply.'
        }
        
        response = self.client.post(self.quote_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Quote.objects.count(), 2)
        self.assertEqual(response.data['status'], 'DRAFT')
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('16250.00'))
    
    def test_quote_submit(self):
        ""Test submitting a quote for approval."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Submit the quote
        response = self.client.post(
            self.quote_submit_url,
            {'notes': 'Please review this quote'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.status, QuoteStatus.PENDING_APPROVAL)
        
        # Check that a change log was created
        change_log = QuoteChangeLog.objects.filter(
            quote=self.quote,
            action=QuoteChangeLog.ACTION_SUBMIT
        ).first()
        self.assertIsNotNone(change_log)
    
    def test_quote_approve(self):
        ""Test approving a quote (staff only)."""
        # First submit the quote
        self.quote.status = QuoteStatus.PENDING_APPROVAL
        self.quote.save()
        
        # Test as staff user
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(
            self.quote_approve_url,
            {'notes': 'Approved for construction'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.status, QuoteStatus.APPROVED)
        self.assertEqual(self.quote.approved_by, self.staff_user)
        self.assertIsNotNone(self.quote.approved_at)
        
        # Test as non-staff user (should fail)
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            self.quote_approve_url,
            {'notes': 'This should fail'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_quote_reject(self):
        ""Test rejecting a quote (staff only)."""
        # First submit the quote
        self.quote.status = QuoteStatus.PENDING_APPROVAL
        self.quote.save()
        
        # Test as staff user
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(
            self.quote_reject_url,
            {'rejection_reason': 'Insufficient details'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.status, QuoteStatus.REJECTED)
        
        # Check the change log
        change_log = QuoteChangeLog.objects.filter(
            quote=self.quote,
            action=QuoteChangeLog.ACTION_REJECT
        ).first()
        self.assertIsNotNone(change_log)
        self.assertIn('Insufficient details', change_log.notes)
    
    def test_quote_revision(self):
        ""Test creating a revision of a quote."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create a revision
        response = self.client.post(
            self.quote_revise_url,
            {'change_reason': 'Updated pricing'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Quote.objects.count(), 2)
        
        # Get the new quote
        new_quote = Quote.objects.latest('created')
        self.assertEqual(new_quote.version, 2)
        self.assertEqual(new_quote.parent_quote, self.quote)
        self.assertEqual(new_quote.status, QuoteStatus.DRAFT)
        
        # Check that items were copied
        self.assertEqual(new_quote.items.count(), 2)
    
    def test_quote_item_operations(self):
        ""Test CRUD operations for quote items."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create a new item
        new_item_data = {
            'description': 'New Item',
            'quantity': '2.0',
            'unit_price': '1000.00',
            'tax_rate': '15.00',
            'discount_amount': '100.00'
        }
        
        response = self.client.post(
            self.quote_item_list_url,
            new_item_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.quote.items.count(), 3)
        
        # Update an item
        item_id = response.data['id']
        update_url = reverse(
            'quote-item-detail',
            kwargs={'quote_pk': self.quote.id, 'pk': item_id}
        )
        
        update_data = {'quantity': '3.0'}
        response = self.client.patch(update_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['quantity']), Decimal('3.0'))
        
        # Delete an item
        response = self.client.delete(update_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.quote.items.count(), 2)
    
    def test_quote_calculations(self):
        ""Test that quote totals are calculated correctly."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create a new quote with items
        data = {
            'construction_request': self.construction_request.id,
            'valid_until': (timezone.now().date() + timedelta(days=30)).isoformat(),
            'items': [
                {
                    'description': 'Item 1',
                    'quantity': '2.0',
                    'unit_price': '1000.00',
                    'tax_rate': '15.00',
                    'discount_amount': '100.00'
                },
                {
                    'description': 'Item 2',
                    'quantity': '1.0',
                    'unit_price': '2000.00',
                    'tax_rate': '15.00',
                    'discount_amount': '50.00'
                }
            ]
        }
        
        response = self.client.post(
            self.quote_list_url,
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check calculations
        quote_data = response.data
        self.assertEqual(Decimal(quote_data['subtotal']), Decimal('4000.00'))  # (2*1000) + (1*2000)
        self.assertEqual(Decimal(quote_data['discount_amount']), Decimal('150.00'))  # 100 + 50
        self.assertEqual(Decimal(quote_data['tax_amount']), Decimal('577.50'))  # (4000 - 150) * 0.15
        self.assertEqual(Decimal(quote_data['total_amount']), Decimal('4427.50'))  # 4000 - 150 + 577.50
    
    def test_quote_status_workflow(self):
        ""Test the quote status workflow."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Start with a draft quote
        self.assertEqual(self.quote.status, QuoteStatus.DRAFT)
        
        # Submit for approval
        response = self.client.post(
            self.quote_submit_url,
            {'notes': 'Ready for review'},
            format='json'
        )
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.status, QuoteStatus.PENDING_APPROVAL)
        
        # Approve the quote
        response = self.client.post(
            self.quote_approve_url,
            {'notes': 'Approved'},
            format='json'
        )
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.status, QuoteStatus.APPROVED)
        
        # Create a revision
        response = self.client.post(
            self.quote_revise_url,
            {'change_reason': 'Need to update pricing'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Get the new quote
        new_quote = Quote.objects.latest('created')
        self.assertEqual(new_quote.status, QuoteStatus.DRAFT)
        self.assertEqual(new_quote.version, 2)
    
    def test_quote_change_history(self):
        ""Test that changes to a quote are logged."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Make some changes to the quote
        update_data = {
            'discount_amount': '750.00',
            'notes': 'Increased discount'
        }
        
        response = self.client.patch(
            self.quote_detail_url,
            update_data,
            format='json'
        )
        
        # Check that a change log was created
        change_log = QuoteChangeLog.objects.filter(
            quote=self.quote,
            action=QuoteChangeLog.ACTION_UPDATE
        ).first()
        
        self.assertIsNotNone(change_log)
        self.assertIn('discount_amount', change_log.changes)
        self.assertEqual(change_log.changes['discount_amount']['from'], '500.00')
        self.assertEqual(change_log.changes['discount_amount']['to'], '750.00')
        
        # Check the history endpoint
        response = self.client.get(self.quote_history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
