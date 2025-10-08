"""
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
        """Test retrieving quotes as an authenticated user."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.quote_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_quote_list_unauthenticated(self):
        """Test that unauthenticated users cannot access quotes."""
        response = self.client.get(self.quote_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_quote_retrieve_owner(self):
        """Test that a quote owner can retrieve their quote."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.quote_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quote_number'], self.quote.quote_number)
    
    def test_quote_create(self):
        """Test creating a new quote."""
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
        """Test submitting a quote for approval."""
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
        """Test approving a quote (staff only)."""
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
        """Test rejecting a quote (staff only)."""
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
        """Test creating a revision of a quote."""
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
        """Test CRUD operations for quote items."""
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
        """Test that quote totals are calculated correctly."""
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
        """Test the quote status workflow."""
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
        """Test that changes to a quote are logged."""
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


class QuoteModificationTrackingTestCase(APITestCase):
    """Test suite for quote modification tracking and version control."""
    
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
            currency='GHS'
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
    
    def test_quote_modification_tracking(self):
        """Test that all quote modifications are properly tracked."""
        self.client.force_authenticate(user=self.staff_user)
        
        quote_detail_url = reverse('quote-detail', kwargs={'pk': self.quote.id})
        
        # Make multiple modifications
        modifications = [
            {'subtotal': '12000.00', 'notes': 'Updated subtotal'},
            {'discount_amount': '750.00', 'notes': 'Increased discount'},
            {'tax_amount': '1800.00', 'notes': 'Updated tax calculation'},
            {'valid_until': (timezone.now().date() + timedelta(days=45)).isoformat()}
        ]
        
        for i, modification in enumerate(modifications):
            response = self.client.patch(quote_detail_url, modification, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify change log was created
            change_logs = QuoteChangeLog.objects.filter(
                quote=self.quote,
                action=QuoteChangeLog.ACTION_UPDATE
            ).order_by('-created_at')
            
            self.assertEqual(change_logs.count(), i + 1)
            
            latest_log = change_logs.first()
            self.assertEqual(latest_log.changed_by, self.staff_user)
            self.assertIsNotNone(latest_log.changes)
    
    def test_quote_version_control(self):
        """Test quote version control and revision management."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create multiple revisions
        revision_reasons = [
            'Initial revision for client feedback',
            'Updated pricing based on material costs',
            'Final revision after client approval'
        ]
        
        current_quote = self.quote
        for i, reason in enumerate(revision_reasons):
            revision_url = reverse('quote-create-revision', kwargs={'pk': current_quote.id})
            
            response = self.client.post(
                revision_url,
                {'change_reason': reason},
                format='json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Get the new revision
            new_quote = Quote.objects.get(id=response.data['id'])
            self.assertEqual(new_quote.version, i + 2)  # Original is version 1
            self.assertEqual(new_quote.parent_quote, self.quote)
            self.assertEqual(new_quote.status, QuoteStatus.DRAFT)
            
            # Verify change log
            change_log = QuoteChangeLog.objects.filter(
                quote=current_quote,
                action=QuoteChangeLog.ACTION_REVISE
            ).latest('created_at')
            
            self.assertEqual(change_log.notes, reason)
            current_quote = new_quote
        
        # Verify we have the correct number of quotes
        total_quotes = Quote.objects.filter(construction_request=self.construction_request).count()
        self.assertEqual(total_quotes, len(revision_reasons) + 1)
    
    def test_quote_status_management_workflow(self):
        """Test comprehensive quote status management and workflow."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Test complete workflow: Draft -> Pending -> Approved -> Revised
        workflow_steps = [
            {
                'action': 'submit',
                'url_name': 'quote-submit',
                'data': {'notes': 'Ready for client review'},
                'expected_status': QuoteStatus.PENDING_APPROVAL,
                'log_action': QuoteChangeLog.ACTION_SUBMIT
            },
            {
                'action': 'approve',
                'url_name': 'quote-approve',
                'data': {'notes': 'Approved by management'},
                'expected_status': QuoteStatus.APPROVED,
                'log_action': QuoteChangeLog.ACTION_APPROVE
            }
        ]
        
        for step in workflow_steps:
            url = reverse(step['url_name'], kwargs={'pk': self.quote.id})
            response = self.client.post(url, step['data'], format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify status change
            self.quote.refresh_from_db()
            self.assertEqual(self.quote.status, step['expected_status'])
            
            # Verify change log
            change_log = QuoteChangeLog.objects.filter(
                quote=self.quote,
                action=step['log_action']
            ).latest('created_at')
            
            self.assertIsNotNone(change_log)
            self.assertEqual(change_log.changed_by, self.staff_user)
        
        # Test rejection workflow
        self.quote.status = QuoteStatus.PENDING_APPROVAL
        self.quote.save()
        
        reject_url = reverse('quote-reject', kwargs={'pk': self.quote.id})
        response = self.client.post(
            reject_url,
            {'rejection_reason': 'Pricing needs adjustment'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.status, QuoteStatus.REJECTED)
    
    def test_quote_change_history_detailed(self):
        """Test detailed change history tracking and retrieval."""
        self.client.force_authenticate(user=self.staff_user)
        
        quote_detail_url = reverse('quote-detail', kwargs={'pk': self.quote.id})
        history_url = reverse('quote-history', kwargs={'pk': self.quote.id})
        
        # Make a series of changes with different types
        changes = [
            {'subtotal': '15000.00', 'notes': 'Updated base cost'},
            {'discount_amount': '1000.00', 'notes': 'Applied bulk discount'},
            {'valid_until': (timezone.now().date() + timedelta(days=60)).isoformat()},
        ]
        
        for change in changes:
            self.client.patch(quote_detail_url, change, format='json')
        
        # Submit and approve
        submit_url = reverse('quote-submit', kwargs={'pk': self.quote.id})
        self.client.post(submit_url, {'notes': 'Ready for approval'}, format='json')
        
        approve_url = reverse('quote-approve', kwargs={'pk': self.quote.id})
        self.client.post(approve_url, {'notes': 'Approved'}, format='json')
        
        # Get change history
        response = self.client.get(history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        history = response.data
        self.assertGreaterEqual(len(history), 5)  # 3 updates + 1 submit + 1 approve
        
        # Verify history contains all expected actions
        actions = [log['action'] for log in history]
        self.assertIn(QuoteChangeLog.ACTION_UPDATE, actions)
        self.assertIn(QuoteChangeLog.ACTION_SUBMIT, actions)
        self.assertIn(QuoteChangeLog.ACTION_APPROVE, actions)
        
        # Verify chronological order (newest first)
        timestamps = [log['created_at'] for log in history]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))
    
    def test_quote_concurrent_modification_handling(self):
        """Test handling of concurrent modifications to quotes."""
        self.client.force_authenticate(user=self.staff_user)
        
        quote_detail_url = reverse('quote-detail', kwargs={'pk': self.quote.id})
        
        # Simulate concurrent modifications
        original_updated_at = self.quote.updated_at
        
        # First modification
        response1 = self.client.patch(
            quote_detail_url,
            {'subtotal': '12000.00'},
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Verify timestamp updated
        self.quote.refresh_from_db()
        self.assertGreater(self.quote.updated_at, original_updated_at)
        
        # Second modification should also succeed
        response2 = self.client.patch(
            quote_detail_url,
            {'discount_amount': '800.00'},
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verify both changes are tracked
        change_logs = QuoteChangeLog.objects.filter(
            quote=self.quote,
            action=QuoteChangeLog.ACTION_UPDATE
        ).order_by('created_at')
        
        self.assertEqual(change_logs.count(), 2)
        self.assertIn('subtotal', change_logs[0].changes)
        self.assertIn('discount_amount', change_logs[1].changes)
    
    def test_quote_item_modification_tracking(self):
        """Test that quote item modifications are properly tracked."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create quote items
        item_list_url = reverse('quote-item-list', kwargs={'quote_pk': self.quote.id})
        
        item_data = {
            'description': 'Foundation Work',
            'quantity': '1.0',
            'unit_price': '5000.00',
            'tax_rate': '15.00'
        }
        
        response = self.client.post(item_list_url, item_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        item_id = response.data['id']
        item_detail_url = reverse(
            'quote-item-detail',
            kwargs={'quote_pk': self.quote.id, 'pk': item_id}
        )
        
        # Modify the item
        modifications = [
            {'quantity': '2.0'},
            {'unit_price': '5500.00'},
            {'description': 'Foundation and Basement Work'}
        ]
        
        for modification in modifications:
            response = self.client.patch(item_detail_url, modification, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify that quote-level change logs were created for item modifications
        item_change_logs = QuoteChangeLog.objects.filter(
            quote=self.quote,
            action=QuoteChangeLog.ACTION_UPDATE_ITEM
        )
        
        self.assertEqual(item_change_logs.count(), len(modifications))
        
        # Verify each change log contains item information
        for log in item_change_logs:
            self.assertIn('item_id', log.changes)
            self.assertEqual(log.changes['item_id'], item_id)
    
    def test_quote_bulk_operations_tracking(self):
        """Test tracking of bulk operations on quotes."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create multiple quote items
        item_list_url = reverse('quote-item-list', kwargs={'quote_pk': self.quote.id})
        
        items_data = [
            {
                'description': 'Foundation',
                'quantity': '1.0',
                'unit_price': '5000.00',
                'tax_rate': '15.00'
            },
            {
                'description': 'Framing',
                'quantity': '1.0',
                'unit_price': '8000.00',
                'tax_rate': '15.00'
            },
            {
                'description': 'Roofing',
                'quantity': '1.0',
                'unit_price': '6000.00',
                'tax_rate': '15.00'
            }
        ]
        
        created_items = []
        for item_data in items_data:
            response = self.client.post(item_list_url, item_data, format='json')
            created_items.append(response.data['id'])
        
        # Perform bulk update (apply discount to all items)
        bulk_update_url = reverse('quote-bulk-update-items', kwargs={'pk': self.quote.id})
        bulk_data = {
            'item_ids': created_items,
            'updates': {
                'discount_amount': '200.00'
            }
        }
        
        response = self.client.post(bulk_update_url, bulk_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify bulk operation was logged
        bulk_log = QuoteChangeLog.objects.filter(
            quote=self.quote,
            action=QuoteChangeLog.ACTION_BULK_UPDATE
        ).latest('created_at')
        
        self.assertIsNotNone(bulk_log)
        self.assertEqual(len(bulk_log.changes['updated_items']), len(created_items))
        self.assertEqual(bulk_log.changes['bulk_updates']['discount_amount'], '200.00')


class QuoteCalculationTestCase(APITestCase):
    """Test suite for quote calculation accuracy and edge cases."""
    
    def setUp(self):
        # Create test users
        self.staff_user = User.objects.create_user(
            email='staff@example.com',
            password='testpass123',
            first_name='Staff',
            last_name='User',
            is_staff=True
        )
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123'
        )
        
        # Create test data
        self.property = Property.objects.create(
            title='Test Property',
            price=100000,
            address='123 Test St',
            city='Test City',
            region='Greater Accra',
            property_type='RESIDENTIAL',
            status='AVAILABLE',
            created_by=self.client_user
        )
        
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction',
            construction_type='NEW_CONSTRUCTION',
            client=self.client_user,
            property=self.property,
            budget=50000,
            currency='GHS'
        )
    
    def test_complex_quote_calculations(self):
        """Test complex quote calculations with multiple items and varying tax rates."""
        self.client.force_authenticate(user=self.staff_user)
        
        quote_list_url = reverse('quote-list')
        
        # Create quote with complex item structure
        quote_data = {
            'construction_request': self.construction_request.id,
            'valid_until': (timezone.now().date() + timedelta(days=30)).isoformat(),
            'items': [
                {
                    'description': 'Materials (Tax-exempt)',
                    'quantity': '1.0',
                    'unit_price': '10000.00',
                    'tax_rate': '0.00',
                    'discount_amount': '500.00'
                },
                {
                    'description': 'Labor (Standard tax)',
                    'quantity': '40.0',
                    'unit_price': '50.00',
                    'tax_rate': '15.00',
                    'discount_amount': '100.00'
                },
                {
                    'description': 'Equipment Rental (Higher tax)',
                    'quantity': '5.0',
                    'unit_price': '200.00',
                    'tax_rate': '20.00',
                    'discount_amount': '50.00'
                }
            ]
        }
        
        response = self.client.post(quote_list_url, quote_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify calculations
        quote = response.data
        
        # Expected calculations:
        # Item 1: 10000 * 1 = 10000, discount = 500, taxable = 9500, tax = 0
        # Item 2: 50 * 40 = 2000, discount = 100, taxable = 1900, tax = 285
        # Item 3: 200 * 5 = 1000, discount = 50, taxable = 950, tax = 190
        
        expected_subtotal = Decimal('13000.00')  # 10000 + 2000 + 1000
        expected_discount = Decimal('650.00')    # 500 + 100 + 50
        expected_tax = Decimal('475.00')         # 0 + 285 + 190
        expected_total = Decimal('12825.00')     # 13000 - 650 + 475
        
        self.assertEqual(Decimal(quote['subtotal']), expected_subtotal)
        self.assertEqual(Decimal(quote['discount_amount']), expected_discount)
        self.assertEqual(Decimal(quote['tax_amount']), expected_tax)
        self.assertEqual(Decimal(quote['total_amount']), expected_total)
    
    def test_quote_calculation_edge_cases(self):
        """Test quote calculations with edge cases and boundary conditions."""
        self.client.force_authenticate(user=self.staff_user)
        
        quote_list_url = reverse('quote-list')
        
        # Test with zero amounts
        edge_case_data = {
            'construction_request': self.construction_request.id,
            'valid_until': (timezone.now().date() + timedelta(days=30)).isoformat(),
            'items': [
                {
                    'description': 'Free consultation',
                    'quantity': '1.0',
                    'unit_price': '0.00',
                    'tax_rate': '15.00',
                    'discount_amount': '0.00'
                },
                {
                    'description': 'High precision item',
                    'quantity': '0.001',
                    'unit_price': '1000000.00',
                    'tax_rate': '15.00',
                    'discount_amount': '0.01'
                }
            ]
        }
        
        response = self.client.post(quote_list_url, edge_case_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        quote = response.data
        
        # Verify zero amounts are handled correctly
        self.assertGreaterEqual(Decimal(quote['subtotal']), Decimal('0'))
        self.assertGreaterEqual(Decimal(quote['total_amount']), Decimal('0'))
        
        # Verify precision is maintained
        expected_item2_subtotal = Decimal('1000.00')  # 0.001 * 1000000
        self.assertEqual(Decimal(quote['subtotal']), expected_item2_subtotal)
    
    def test_quote_recalculation_on_item_changes(self):
        """Test that quote totals are recalculated when items change."""
        self.client.force_authenticate(user=self.staff_user)
        
        # Create a quote with items
        quote = Quote.objects.create(
            quote_number='QT-TEST-001',
            construction_request=self.construction_request,
            created_by=self.staff_user,
            valid_until=timezone.now().date() + timedelta(days=30)
        )
        
        # Add items
        item1 = QuoteItem.objects.create(
            quote=quote,
            description='Item 1',
            quantity=Decimal('2.0'),
            unit_price=Decimal('1000.00'),
            tax_rate=Decimal('15.00')
        )
        
        item2 = QuoteItem.objects.create(
            quote=quote,
            description='Item 2',
            quantity=Decimal('1.0'),
            unit_price=Decimal('500.00'),
            tax_rate=Decimal('15.00')
        )
        
        # Trigger recalculation
        quote.recalculate_totals()
        
        # Verify initial calculations
        expected_subtotal = Decimal('2500.00')  # (2 * 1000) + (1 * 500)
        expected_tax = Decimal('375.00')        # 2500 * 0.15
        expected_total = Decimal('2875.00')     # 2500 + 375
        
        self.assertEqual(quote.subtotal, expected_subtotal)
        self.assertEqual(quote.tax_amount, expected_tax)
        self.assertEqual(quote.total_amount, expected_total)
        
        # Modify an item
        item1.quantity = Decimal('3.0')
        item1.save()
        
        # Recalculate
        quote.recalculate_totals()
        
        # Verify updated calculations
        new_expected_subtotal = Decimal('3500.00')  # (3 * 1000) + (1 * 500)
        new_expected_tax = Decimal('525.00')        # 3500 * 0.15
        new_expected_total = Decimal('4025.00')     # 3500 + 525
        
        self.assertEqual(quote.subtotal, new_expected_subtotal)
        self.assertEqual(quote.tax_amount, new_expected_tax)
        self.assertEqual(quote.total_amount, new_expected_total)