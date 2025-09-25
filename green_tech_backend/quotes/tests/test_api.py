from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from locations.models import Region
from plans.models import Plan, PlanStyle, BuildRequest
from leads.models import Lead, LeadSource, LeadStatus
from leads.services import sync_lead_from_build_request


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture()
def build_request(db) -> BuildRequest:
    region = Region.objects.create(
        slug='accra',
        name='Greater Accra',
        country='Ghana',
        currency_code='GHS',
        cost_multiplier=Decimal('1.20'),
    )
    plan = Plan.objects.create(
        slug='eco-bungalow',
        name='Eco Bungalow',
        summary='Efficient solar-first bungalow.',
        style=PlanStyle.BUNGALOW,
        bedrooms=3,
        bathrooms=2,
        floors=1,
        area_sq_m=Decimal('120.00'),
        base_price=Decimal('100000.00'),
        base_currency='USD',
    )
    request = BuildRequest.objects.create(
        plan=plan,
        region=region,
        contact_name='Jane Customer',
        contact_email='jane@example.com',
        contact_phone='+233555000111',
        budget_currency='USD',
        budget_min=Decimal('95000.00'),
        budget_max=Decimal('130000.00'),
        timeline='Q3 2025',
        customizations='Solar roofing and rain harvesting',
    )
    sync_lead_from_build_request(request)
    return request


def _create_quote(api_client: APIClient, request: BuildRequest) -> dict:
    payload = {
        'build_request': str(request.id),
        'notes': 'Includes smart home and solar equipment.',
        'terms': 'Valid for 30 days. 50% mobilization.',
        'prepared_by_name': 'Ama Agent',
        'items': [
            {
                'kind': 'base',
                'label': 'Base construction',
                'quantity': '1',
                'unit_cost': str(request.plan.base_price),
                'apply_region_multiplier': True,
            },
            {
                'kind': 'allowance',
                'label': 'Green finish allowance',
                'quantity': '1',
                'unit_cost': '5000.00',
                'apply_region_multiplier': False,
            },
            {
                'kind': 'adjustment',
                'label': 'Launch discount',
                'quantity': '1',
                'unit_cost': '-2000.00',
                'apply_region_multiplier': False,
            },
        ],
    }
    response = api_client.post('/api/quotes/', payload, format='json')
    assert response.status_code == 201, response.content
    return response.json()


@pytest.mark.django_db()
def test_quote_lifecycle(api_client: APIClient, build_request: BuildRequest):
    data = _create_quote(api_client, build_request)

    assert data['status'] == 'draft'
    assert pytest.approx(data['subtotal_amount']) == 120000.0
    assert pytest.approx(data['allowance_amount']) == 5000.0
    assert pytest.approx(data['adjustment_amount']) == -2000.0
    assert pytest.approx(data['total_amount']) == 123000.0

    quote_id = data['id']

    send_response = api_client.post(f'/api/quotes/{quote_id}/send/')
    assert send_response.status_code == 200
    assert send_response.json()['status'] == 'sent'

    view_response = api_client.post(f'/api/quotes/{quote_id}/view/')
    assert view_response.status_code == 200
    assert view_response.json()['status'] == 'viewed'

    accept_response = api_client.post(
        f'/api/quotes/{quote_id}/accept/',
        {'signature_name': 'Jane Customer', 'signature_email': 'jane@example.com'},
        format='json',
    )
    assert accept_response.status_code == 200
    detail = accept_response.json()
    assert detail['status'] == 'accepted'
    assert any(entry['status'] == 'accepted' for entry in detail['timeline'])
    assert 'Eco Bungalow' in detail['document_html']

    lead = Lead.objects.get(source_type=LeadSource.BUILD_REQUEST, source_id=str(build_request.id))
    assert lead.status == LeadStatus.CLOSED


@pytest.mark.django_db()
def test_quote_list_filters_by_customer_email(api_client: APIClient, build_request: BuildRequest):
    record = _create_quote(api_client, build_request)
    api_client.post(f"/api/quotes/{record['id']}/send/")

    response = api_client.get(f"/api/quotes/?customer_email={build_request.contact_email}")
    assert response.status_code == 200
    payload = response.json()
    assert payload['count'] == 1
    assert payload['results'][0]['reference'] == record['reference']
