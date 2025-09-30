"""Notification helpers for quote chat events."""
from __future__ import annotations

from typing import Iterable, Optional, Set

from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _

from notifications.models import NotificationType
from notifications.services import notify_users
from plans.models import BuildRequest
from .models import Quote, QuoteChatMessage

User = get_user_model()


def _unique_active_users(users: Iterable[Optional[User]]) -> list[User]:
    seen: Set[int] = set()
    unique: list[User] = []
    for user in users:
        if not user or not user.is_active:
            continue
        if user.id in seen:
            continue
        seen.add(user.id)
        unique.append(user)
    return unique


def _lookup_user_by_email(email: Optional[str]) -> Optional[User]:
    if not email:
        return None
    return User.objects.filter(email__iexact=email).first()


def _quote_participants(quote: Quote, *, exclude_user_id: Optional[int] = None) -> list[User]:
    quote = Quote.objects.select_related('build_request__user').prefetch_related(
        'chat_messages__sender'
    ).get(pk=quote.pk)

    participants: list[Optional[User]] = []

    build_request: Optional[BuildRequest] = getattr(quote, 'build_request', None)
    if build_request and build_request.user:
        participants.append(build_request.user)

    previous_senders = {
        message.sender
        for message in quote.chat_messages.all()
        if message.sender_id and message.sender_id != exclude_user_id
    }
    participants.extend(previous_senders)

    candidate_emails = {
        getattr(quote, 'prepared_by_email', None),
        getattr(quote, 'recipient_email', None),
    }
    if build_request:
        candidate_emails.add(getattr(build_request, 'contact_email', None))

    participants.extend(_lookup_user_by_email(email) for email in candidate_emails)

    if exclude_user_id:
        participants = [
            user for user in participants if getattr(user, 'id', None) != exclude_user_id
        ]

    return _unique_active_users(participants)


def notify_quote_chat_message(message: QuoteChatMessage) -> None:
    recipients = _quote_participants(
        message.quote, exclude_user_id=getattr(message.sender, 'id', None)
    )
    if not recipients:
        return

    quote = message.quote
    subject = _('New message on quote %(reference)s') % {'reference': quote.reference}
    body = message.body.strip()
    if len(body) > 200:
        body = f"{body[:197]}..."

    notify_users(
        recipients,
        subject=subject,
        message=body,
        notification_type=NotificationType.IN_APP,
        content_object=message,
        template_context={
            'category': 'quote_updates',
            'quote_id': str(quote.id),
            'quote_reference': quote.reference,
            'message_id': str(message.id),
            'sender_id': getattr(message.sender, 'id', None),
        },
    )
