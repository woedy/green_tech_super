from __future__ import annotations

from typing import Iterable, TYPE_CHECKING

from django.db import transaction

from plans.models import BuildRequest
from properties.models import PropertyInquiry

from .models import Lead, LeadActivityKind, LeadSource, LeadStatus
from .realtime import broadcast_lead_event

if TYPE_CHECKING:  # pragma: no cover
    from quotes.models import Quote


@transaction.atomic
def sync_lead_from_build_request(request: BuildRequest) -> Lead:
    defaults = {
        'title': f"Build: {request.plan.name}",
        'contact_name': request.contact_name,
        'contact_email': request.contact_email,
        'contact_phone': request.contact_phone,
        'metadata': {
            'plan': {
                'id': request.plan_id,
                'name': request.plan.name,
                'slug': request.plan.slug,
            },
            'region': request.region.name,
            'budget': {
                'currency': request.budget_currency,
                'min': str(request.budget_min) if request.budget_min is not None else None,
                'max': str(request.budget_max) if request.budget_max is not None else None,
            },
            'timeline': request.timeline,
            'customizations': request.customizations,
            'options': list(request.options or []),
            'submitted_at': request.submitted_at.isoformat(),
        },
    }
    lead, created = Lead.objects.update_or_create(
        source_type=LeadSource.BUILD_REQUEST,
        source_id=str(request.id),
        defaults=defaults,
    )
    if created:
        lead.log_activity(
            LeadActivityKind.CREATED,
            'New build request received',
        )
        broadcast_lead_event('lead.created', lead)
    else:
        lead.log_activity(LeadActivityKind.UPDATED, 'Build request updated')
        broadcast_lead_event('lead.updated', lead)
    return lead


@transaction.atomic
def sync_lead_from_property_inquiry(inquiry: PropertyInquiry) -> Lead:
    defaults = {
        'title': f"Inquiry: {inquiry.property.title}",
        'contact_name': inquiry.name,
        'contact_email': inquiry.email,
        'contact_phone': inquiry.phone,
        'metadata': {
            'property': {
                'id': inquiry.property_id,
                'title': inquiry.property.title,
                'slug': inquiry.property.slug,
            },
            'message': inquiry.message,
            'scheduled_viewing': inquiry.appointments.first().scheduled_for.isoformat()
            if inquiry.appointments.exists()
            else None,
            'created_at': inquiry.created_at.isoformat(),
        },
    }
    lead, created = Lead.objects.update_or_create(
        source_type=LeadSource.PROPERTY_INQUIRY,
        source_id=str(inquiry.id),
        defaults=defaults,
    )
    if created:
        lead.log_activity(LeadActivityKind.CREATED, 'New property inquiry received')
        broadcast_lead_event('lead.created', lead)
    else:
        lead.log_activity(LeadActivityKind.UPDATED, 'Property inquiry updated')
        broadcast_lead_event('lead.updated', lead)
    return lead


def bulk_sync_leads(requests: Iterable[BuildRequest], inquiries: Iterable[PropertyInquiry]):
    for request in requests:
        sync_lead_from_build_request(request)
    for inquiry in inquiries:
        sync_lead_from_property_inquiry(inquiry)


def handle_quote_event_for_lead(quote: 'Quote', event: str) -> Lead | None:
    try:
        lead = Lead.objects.get(
            source_type=LeadSource.BUILD_REQUEST,
            source_id=str(quote.build_request_id),
        )
    except Lead.DoesNotExist:
        return None

    message_map = {
        'sent': f'Quote {quote.reference} sent to customer',
        'viewed': f'Customer viewed quote {quote.reference}',
        'accepted': f'Quote {quote.reference} accepted',
        'declined': f'Quote {quote.reference} declined',
    }
    metadata = {
        'quote_id': str(quote.id),
        'quote_reference': quote.reference,
        'event': event,
    }

    target_status = {
        'sent': LeadStatus.QUOTED,
        'accepted': LeadStatus.CLOSED,
    }.get(event)

    if target_status and lead.status != target_status:
        previous = lead.status
        lead.status = target_status
        lead.is_unread = True
        lead.save(update_fields=('status', 'is_unread', 'updated_at'))
        lead.log_activity(
            LeadActivityKind.STATUS_CHANGED,
            message_map.get(event, 'Quote update'),
            metadata={**metadata, 'from': previous, 'to': target_status},
        )
    else:
        lead.log_activity(
            LeadActivityKind.UPDATED,
            message_map.get(event, 'Quote update'),
            metadata=metadata,
        )

    broadcast_lead_event('lead.updated', lead)
    return lead
