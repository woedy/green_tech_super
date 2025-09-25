from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient

from properties.models import PropertyInquiry, ViewingAppointment


class PropertyApiTests(TestCase):
    fixtures = [
        'locations/fixtures/default_regions.json',
        'properties/fixtures/sample_properties.json',
        'properties/fixtures/sample_property_images.json',
    ]

    def setUp(self):
        self.client = APIClient()

    def test_list_properties_filters(self):
        response = self.client.get('/api/properties/', {'region': 'greater-accra'})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['count'], 1)
        result = payload['results'][0]
        self.assertEqual(result['slug'], 'east-legon-eco-villa')
        self.assertIn('eco_features', result)

    def test_property_detail(self):
        response = self.client.get('/api/properties/east-legon-eco-villa/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['slug'], 'east-legon-eco-villa')
        self.assertGreater(len(data['images']), 0)
        self.assertEqual(data['region']['slug'], 'greater-accra')

    def test_create_inquiry_creates_viewing(self):
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
        inquiry = PropertyInquiry.objects.get()
        self.assertEqual(inquiry.name, 'Kofi Boateng')
        appointment = ViewingAppointment.objects.get()
        self.assertEqual(appointment.inquiry, inquiry)
        self.assertEqual(str(appointment.scheduled_for), '2025-02-01 09:00:00+00:00')
