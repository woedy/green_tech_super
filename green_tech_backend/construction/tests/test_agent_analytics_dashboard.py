from __future__ import annotations

from decimal import Decimal
import importlib.util
from pathlib import Path
from types import ModuleType
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save

from rest_framework.test import APIRequestFactory, APITestCase

from leads.models import Lead, LeadSource, LeadStatus
from locations.models import Region
from plans.models import BuildRequest, Plan, PlanStyle
from quotes.models import Quote, QuoteStatus
from plans.signals import plan_post_save
from construction.analytics import serialize_dashboard_to_csv


User = get_user_model()


class _StubSerializer:
    def __init__(self, *args, **kwargs):
        pass


# Provide minimal stubs for serializer modules referenced by project views.
import sys

mock_properties_serializers = sys.modules.get('properties.serializers')
if mock_properties_serializers is None:
    mock_properties_serializers = ModuleType('properties.serializers')
    sys.modules['properties.serializers'] = mock_properties_serializers
if not hasattr(mock_properties_serializers, 'PropertySerializer'):
    mock_properties_serializers.PropertySerializer = _StubSerializer
if not hasattr(mock_properties_serializers, 'PropertyDetailSerializer'):
    mock_properties_serializers.PropertyDetailSerializer = _StubSerializer
if not hasattr(mock_properties_serializers, 'PropertyInquirySerializer'):
    mock_properties_serializers.PropertyInquirySerializer = _StubSerializer
if not hasattr(mock_properties_serializers, 'PropertyListSerializer'):
    mock_properties_serializers.PropertyListSerializer = _StubSerializer

mock_ghana_serializers = sys.modules.get('construction.ghana.serializers')
if mock_ghana_serializers is None:
    mock_ghana_serializers = ModuleType('construction.ghana.serializers')
    sys.modules['construction.ghana.serializers'] = mock_ghana_serializers
if not hasattr(mock_ghana_serializers, 'EcoFeatureSerializer'):
    mock_ghana_serializers.EcoFeatureSerializer = _StubSerializer

import construction.models as construction_models  # noqa: E402

if not hasattr(construction_models, 'ConstructionRequestEcoFeature'):
    class _StubEcoFeature:  # pragma: no cover - simple stand-in
        pass

    construction_models.ConstructionRequestEcoFeature = _StubEcoFeature

if not hasattr(construction_models, 'ConstructionRequestStep'):
    class _StubStep:  # pragma: no cover - simple stand-in
        pass

    construction_models.ConstructionRequestStep = _StubStep

analytics_views_path = Path(__file__).resolve().parent.parent / 'api' / 'analytics_views.py'
analytics_spec = importlib.util.spec_from_file_location(
    'construction.api.analytics_views', analytics_views_path
)
analytics_module = importlib.util.module_from_spec(analytics_spec)
analytics_spec.loader.exec_module(analytics_module)  # type: ignore[union-attr]
sys.modules['construction.api.analytics_views'] = analytics_module
AgentAnalyticsDashboardView = analytics_module.AgentAnalyticsDashboardView

from construction.api.analytics_views import AgentAnalyticsDashboardView


class AgentAnalyticsDashboardViewTests(APITestCase):
    endpoint = '/api/construction/analytics/agent-dashboard'

    def setUp(self):
        self._ensure_property_serializer_stub()
        self.factory = APIRequestFactory()
        self.view = AgentAnalyticsDashboardView.as_view()
        self.agent = User.objects.create_user(
            email='agent@example.com',
            password='password123',
            first_name='Ava',
            user_type=User.UserType.AGENT,
        )
        self.other_agent = User.objects.create_user(
            email='other-agent@example.com',
            password='password123',
            first_name='Omar',
            user_type=User.UserType.AGENT,
        )
        self.staff_user = User.objects.create_user(
            email='staff@example.com',
            password='password123',
            first_name='Stella',
            user_type=User.UserType.ADMIN,
        )
        self.staff_user.is_staff = True
        self.staff_user.save(update_fields=['is_staff'])

        self.customer = User.objects.create_user(
            email='customer@example.com',
            password='password123',
            first_name='Chidi',
            user_type=User.UserType.CUSTOMER,
        )

        self.region = Region.objects.create(
            slug='greater-accra',
            name='Greater Accra',
            country='Ghana',
            currency_code='GHS',
            cost_multiplier=Decimal('1.10'),
        )

        post_save.disconnect(plan_post_save, sender=Plan)
        self.addCleanup(post_save.connect, plan_post_save, sender=Plan)

        self.plan = Plan.objects.create(
            slug='solar-bungalow',
            name='Solar Bungalow',
            style=PlanStyle.BUNGALOW,
            bedrooms=3,
            bathrooms=2,
            floors=1,
            area_sq_m=Decimal('140.00'),
            base_price=Decimal('120000.00'),
            base_currency='USD',
        )

        self.primary_request = BuildRequest.objects.create(
            plan=self.plan,
            region=self.region,
            user=self.customer,
            contact_name='Customer One',
            contact_email='customer1@example.com',
            contact_phone='+233555000000',
            budget_currency='USD',
        )
        self.secondary_request = BuildRequest.objects.create(
            plan=self.plan,
            region=self.region,
            user=self.customer,
            contact_name='Customer Two',
            contact_email='customer2@example.com',
            contact_phone='+233555000001',
            budget_currency='USD',
        )

        # Leads assigned to the primary agent
        self.primary_lead = Lead.objects.create(
            source_type=LeadSource.BUILD_REQUEST,
            source_id=str(self.primary_request.id),
            title='Solar build request',
            contact_name='Customer One',
            contact_email='customer1@example.com',
            contact_phone='+233555000000',
            status=LeadStatus.QUOTED,
            assigned_to=self.agent,
        )
        self.secondary_lead = Lead.objects.create(
            source_type=LeadSource.PROPERTY_INQUIRY,
            source_id=str(uuid4()),
            title='Eco property inquiry',
            contact_name='Customer One',
            contact_email='customer1@example.com',
            contact_phone='+233555000000',
            status=LeadStatus.NEW,
            assigned_to=self.agent,
        )

        # Lead for a different agent to verify filtering
        Lead.objects.create(
            source_type=LeadSource.BUILD_REQUEST,
            source_id=str(self.secondary_request.id),
            title='Secondary request',
            contact_name='Customer Two',
            contact_email='customer2@example.com',
            contact_phone='+233555000001',
            status=LeadStatus.CONTACTED,
            assigned_to=self.other_agent,
        )

        # Quotes associated with the leads
        self.agent_quote = Quote.objects.create(
            build_request=self.primary_request,
            region=self.region,
            status=QuoteStatus.ACCEPTED,
            total_amount=Decimal('250000.00'),
        )
        self.agent_quote.prepared_by_email = self.agent.email
        self.agent_quote.recipient_email = 'customer1@example.com'
        self.agent_quote.save(update_fields=['prepared_by_email', 'recipient_email'])

        Quote.objects.create(
            build_request=self.secondary_request,
            region=self.region,
            status=QuoteStatus.SENT,
            total_amount=Decimal('180000.00'),
            prepared_by_email=self.other_agent.email,
            recipient_email='customer2@example.com',
        )

        # Project metrics are expected to gracefully handle missing schema; no project records created.

    def test_returns_pipeline_metrics_for_agent(self):
        request = self.factory.get(self.endpoint)
        request.user = self.agent
        request.auth = None
        response = self.view(request)
        response.render()
        self.assertEqual(response.status_code, 200)
        payload = response.data

        self.assertEqual(payload['leads']['total'], 2)
        self.assertEqual(payload['leads']['with_quote'], 1)
        self.assertEqual(payload['quotes']['total'], 1)
        self.assertEqual(payload['quotes']['accepted'], 1)
        self.assertEqual(payload['quotes']['total_value'], '250000.00')
        self.assertEqual(payload['quotes']['accepted_value'], '250000.00')
        self.assertEqual(payload['projects']['total'], 0)
        self.assertEqual(payload['projects']['active'], 0)
        self.assertAlmostEqual(payload['conversion_rates']['lead_to_quote'], 0.5)
        self.assertAlmostEqual(payload['conversion_rates']['quote_to_project'], 0.0)
        self.assertAlmostEqual(payload['conversion_rates']['lead_to_project'], 0.0)

        lead_breakdown = payload['leads']['status_breakdown']
        self.assertEqual(lead_breakdown[LeadStatus.QUOTED], 1)
        self.assertEqual(lead_breakdown[LeadStatus.NEW], 1)

    def test_staff_user_sees_all_records(self):
        request = self.factory.get(self.endpoint)
        request.user = self.staff_user
        request.auth = None
        response = self.view(request)
        response.render()
        self.assertEqual(response.status_code, 200)
        payload = response.data

        self.assertEqual(payload['leads']['total'], 3)
        self.assertEqual(payload['quotes']['total'], 2)
        self.assertEqual(payload['projects']['total'], 0)
        self.assertAlmostEqual(payload['conversion_rates']['lead_to_quote'], 1 / 3)

    def test_csv_export_returns_attachment(self):
        request = self.factory.get(self.endpoint)
        request.user = self.agent
        request.auth = None
        response = self.view(request)
        response.render()
        payload = response.data
        body = serialize_dashboard_to_csv(payload)
        self.assertIn('leads,total,2', body)
        self.assertIn('quotes,total_value,250000.00', body)
        self.assertIn('conversion_rates,lead_to_quote,0.5000', body)

    def test_rejects_invalid_date_range(self):
        request = self.factory.get(
            self.endpoint, {'start_date': '2024-05-10', 'end_date': '2024-04-01'}
        )
        request.user = self.agent
        request.auth = None
        response = self.view(request)
        response.render()
        self.assertEqual(response.status_code, 400)
        self.assertIn('end_date', response.data)

    def _ensure_property_serializer_stub(self):
        import sys

        module = sys.modules.get('properties.serializers')
        if module is None:
            module = ModuleType('properties.serializers')
            sys.modules['properties.serializers'] = module
            original = None
        else:
            original = getattr(module, 'PropertySerializer', None)
        module.PropertySerializer = _StubSerializer

        def restore():
            if original is None:
                sys.modules.pop('properties.serializers', None)
            else:
                module.PropertySerializer = original

        self.addCleanup(restore)
