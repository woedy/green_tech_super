from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient

from leads.models import Lead, LeadActivityKind, LeadPriority, LeadStatus


class LeadApiTests(TestCase):
    fixtures = [
        'locations/fixtures/default_regions.json',
        'plans/fixtures/sample_plans.json',
        'plans/fixtures/sample_plan_assets.json',
        'properties/fixtures/sample_properties.json',
        'properties/fixtures/sample_property_images.json',
    ]

    def setUp(self):
        self.client = APIClient()

    def _create_build_request(self):
        payload = {
            'plan': 'solar-haven',
            'region': 'greater-accra',
            'contact_name': 'Ama Mensah',
            'contact_email': 'ama@example.com',
            'contact_phone': '+233200000000',
            'budget_currency': 'USD',
            'budget_min': '150000',
            'budget_max': '220000',
            'timeline': 'Q1 2025',
            'customizations': 'Add outdoor kitchen',
            'options': ['Smart home automation'],
        }
        response = self.client.post('/api/build-requests/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        return response.json()

    def _create_property_inquiry(self):
        payload = {
            'property': 1,
            'name': 'Kofi Boateng',
            'email': 'kofi@example.com',
            'phone': '+233244000000',
            'message': 'Interested in weekend viewing',
            'scheduled_viewing': '2025-02-01T09:00:00Z',
        }
        response = self.client.post('/api/properties/inquiries/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        return response.json()

    def test_build_request_creates_lead(self):
        data = self._create_build_request()
        lead = Lead.objects.get()
        self.assertEqual(lead.contact_email, 'ama@example.com')
        self.assertEqual(lead.status, LeadStatus.NEW)
        self.assertEqual(lead.priority, LeadPriority.MEDIUM)
        list_response = self.client.get('/api/leads/')
        self.assertEqual(list_response.status_code, 200)
        payload = list_response.json()
        self.assertEqual(payload['count'], 1)
        self.assertEqual(payload['results'][0]['contact_email'], 'ama@example.com')

        detail_response = self.client.patch(
            f"/api/leads/{lead.id}/",
            {'status': LeadStatus.CONTACTED, 'priority': LeadPriority.HIGH},
            format='json',
        )
        self.assertEqual(detail_response.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.status, LeadStatus.CONTACTED)
        self.assertEqual(lead.priority, LeadPriority.HIGH)
        self.assertFalse(lead.is_unread)
        activity = lead.activities.first()
        self.assertIn(activity.kind, {LeadActivityKind.STATUS_CHANGED, LeadActivityKind.PRIORITY_CHANGED})

    def test_property_inquiry_creates_lead_and_notes(self):
        inquiry = self._create_property_inquiry()
        lead = Lead.objects.get()
        self.assertIn('Inquiry', lead.title)
        notes_response = self.client.post(
            f"/api/leads/{lead.id}/notes/",
            {'body': 'Called customer, left voicemail.'},
            format='json',
        )
        self.assertEqual(notes_response.status_code, 201)
        notes_list = self.client.get(f"/api/leads/{lead.id}/notes/")
        self.assertEqual(notes_list.status_code, 200)
        self.assertEqual(len(notes_list.json()), 1)
        activity_response = self.client.get(f"/api/leads/{lead.id}/activity/")
        self.assertEqual(activity_response.status_code, 200)
        activity_payload = activity_response.json()
        self.assertGreaterEqual(len(activity_payload), 2)
