from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch
import types

import pytest
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.urls import include, path

from locations.models import Region
from plans.models import BuildRequest, Plan, PlanStyle
from plans.signals import plan_post_save
from quotes.models import Quote, QuoteChatMessage, QuoteMessageReceipt

User = get_user_model()

pytestmark = pytest.mark.django_db()


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture(autouse=True)
def override_urls(settings):
    urlconf = types.ModuleType('test_urls_quotes')
    urlconf.urlpatterns = [
        path('api/', include('quotes.urls')),
    ]
    settings.ROOT_URLCONF = urlconf


@pytest.fixture()
def quote_setup() -> dict[str, object]:
    region = Region.objects.create(
        slug='greater-accra',
        name='Greater Accra',
        country='Ghana',
        currency_code='GHS',
        cost_multiplier=Decimal('1.10'),
    )

    post_save.disconnect(plan_post_save, sender=Plan)
    try:
        plan = Plan.objects.create(
            slug='solar-bungalow',
            name='Solar Bungalow',
            style=PlanStyle.BUNGALOW,
            bedrooms=3,
            bathrooms=2,
            floors=1,
            area_sq_m=Decimal('145.00'),
            base_price=Decimal('120000.00'),
            base_currency='USD',
        )
    finally:
        post_save.connect(plan_post_save, sender=Plan)

    customer = User.objects.create_user(
        email='customer@example.com', password='testpass', first_name='Customer'
    )
    agent = User.objects.create_user(
        email='agent@example.com', password='testpass', first_name='Agent'
    )
    outsider = User.objects.create_user(
        email='unrelated@example.com', password='testpass', first_name='Other'
    )

    request = BuildRequest.objects.create(
        plan=plan,
        region=region,
        user=customer,
        contact_name='Customer Name',
        contact_email=customer.email,
        contact_phone='+233555000000',
        budget_currency='USD',
    )

    quote = Quote.objects.create(build_request=request, region=region)
    quote.prepared_by_email = agent.email
    quote.save(update_fields=['prepared_by_email'])

    QuoteChatMessage.objects.create(
        quote=quote,
        sender=agent,
        body='Initial quote discussion.',
    )

    return {
        'quote': quote,
        'customer': customer,
        'agent': agent,
        'outsider': outsider,
    }


def _chat_url(quote: Quote) -> str:
    return f'/api/quotes/{quote.pk}/messages/'


def test_quote_chat_list_for_customer(api_client: APIClient, quote_setup: dict[str, object]):
    api_client.force_authenticate(quote_setup['customer'])
    response = api_client.get(_chat_url(quote_setup['quote']))
    assert response.status_code == 200
    payload = response.json()
    assert payload['count'] == 1
    assert payload['results'][0]['body'] == 'Initial quote discussion.'


def test_quote_chat_rejects_unrelated_user(api_client: APIClient, quote_setup: dict[str, object]):
    api_client.force_authenticate(quote_setup['outsider'])
    response = api_client.get(_chat_url(quote_setup['quote']))
    assert response.status_code == 403


@patch('quotes.views.broadcast_quote_message')
def test_quote_chat_create_records_receipt(
    mock_broadcast,
    api_client: APIClient,
    quote_setup: dict[str, object],
):
    api_client.force_authenticate(quote_setup['customer'])
    response = api_client.post(
        _chat_url(quote_setup['quote']),
        {'body': 'Customer has a question about pricing.'},
        format='json',
    )
    assert response.status_code == 201
    data = response.json()
    assert data['body'] == 'Customer has a question about pricing.'
    assert QuoteMessageReceipt.objects.filter(
        message_id=data['id'],
        user=quote_setup['customer'],
    ).exists()
    mock_broadcast.assert_called_once()
