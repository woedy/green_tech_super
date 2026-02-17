from __future__ import annotations

from typing import Literal

from django.utils.translation import gettext

from .models import Quote


QuoteEvent = Literal['sent', 'viewed', 'accepted', 'declined']


def _notify_customer(quote: Quote, event: QuoteEvent) -> None:
    """Trigger in-app notifications when the customer has an account."""

    build_request = quote.build_request
    if not build_request.user_id:
        return

    from notifications.models import NotificationType
    from notifications.services import GhanaNotificationService

    service = GhanaNotificationService()
    verbs = {
        'sent': gettext('has been sent'),
        'viewed': gettext('was viewed'),
        'accepted': gettext('was accepted'),
        'declined': gettext('was declined'),
    }
    message = gettext('Quote %(reference)s %(verb)s for %(plan)s.') % {
        'reference': quote.reference,
        'verb': verbs[event],
        'plan': build_request.plan.name,
    }
    service.create_notification(
        recipient=build_request.user,
        subject=gettext('Update on quote %(reference)s') % {'reference': quote.reference},
        message=message,
        content_object=quote,
        template_context={
            'quote_id': str(quote.id),
            'quote_reference': quote.reference,
            'status': quote.status,
            'total': str(quote.total_amount),
            'currency': quote.currency_code,
            'plan_name': build_request.plan.name,
        },
    )


def _sync_lead(quote: Quote, event: QuoteEvent) -> None:
    from leads.services import handle_quote_event_for_lead

    handle_quote_event_for_lead(quote, event)


def _create_construction_request(quote: Quote) -> None:
    """Create a ConstructionRequest from an accepted BUILD_REQUEST quote."""
    if quote.quote_type != 'BUILD_REQUEST' or not quote.build_request:
        return

    if quote.construction_request:
        # Already linked
        return

    from construction.models import ConstructionRequest, ConstructionStatus, ConstructionType
    from construction.models import ConstructionRequestEcoFeature

    build_request = quote.build_request
    
    # Create the construction request
    construction_request = ConstructionRequest.objects.create(
        title=f"Project for {build_request.plan.name} - {build_request.contact_name}",
        description=f"Automated project created from accepted quote {quote.reference}.\n\nPlan: {build_request.plan.name}\nRegion: {build_request.region.name}\nTimeline: {build_request.timeline}\nCustomizations: {build_request.customizations}",
        construction_type=ConstructionType.NEW_CONSTRUCTION,
        status=ConstructionStatus.APPROVED,
        client=build_request.user,
        region=build_request.region.name,
        budget=quote.total_amount,
        currency=quote.currency_code,
        estimated_cost=quote.total_amount,
        target_energy_rating=build_request.plan.energy_rating,
        target_water_rating=build_request.plan.water_rating,
        target_sustainability_score=build_request.plan.sustainability_score,
    )

    # Link quote to new construction request
    quote.construction_request = construction_request
    quote.save(update_fields=['construction_request'])

    # Sync eco features if possible
    # (Note: This depends on how eco features are tracked in the quote items vs BuildRequest)
    # For now, we at least have the project record created and approved.


def handle_quote_event(quote: Quote, event: QuoteEvent) -> None:
    """Coordinate downstream side-effects when a quote transitions."""

    _sync_lead(quote, event)
    _notify_customer(quote, event)
    
    if event == 'accepted':
        _create_construction_request(quote)
