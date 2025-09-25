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
    from notifications.services import NotificationService

    service = NotificationService(NotificationType.IN_APP)
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
    service.send_notification(
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


def handle_quote_event(quote: Quote, event: QuoteEvent) -> None:
    """Coordinate downstream side-effects when a quote transitions."""

    _sync_lead(quote, event)
    _notify_customer(quote, event)
