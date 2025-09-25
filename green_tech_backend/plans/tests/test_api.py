from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from plans.models import BuildRequest


class PlanApiTests(TestCase):
    fixtures = [
        'locations/fixtures/default_regions.json',
        'plans/fixtures/sample_plans.json',
        'plans/fixtures/sample_plan_assets.json',
    ]

    def setUp(self):
        self.client = APIClient()

    def test_list_plans_with_filters(self):
        response = self.client.get('/api/plans/', {'style': 'villa', 'max_budget': 200000})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['count'], 1)
        result = payload['results'][0]
        self.assertEqual(result['slug'], 'solar-haven')
        self.assertIn('regional_estimates', result)

    def test_plan_detail_includes_assets(self):
        response = self.client.get('/api/plans/solar-haven/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data['images']), 1)
        self.assertGreaterEqual(len(data['options']), 1)
        self.assertGreaterEqual(len(data['regional_estimates']), 1)

    def test_create_build_request_triggers_tasks(self):
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
        request = BuildRequest.objects.get()
        self.assertEqual(request.plan.slug, 'solar-haven')
        self.assertEqual(request.region.slug, 'greater-accra')
        self.assertEqual(request.contact_name, 'Ama Mensah')

    def test_direct_upload_fallback(self):
        response = self.client.post('/api/build-requests/uploads/', {'filename': 'brief.pdf', 'content_type': 'application/pdf'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['upload_mode'], 'direct')
