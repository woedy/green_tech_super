"""Permission helpers for quote chat access control."""
from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission

if TYPE_CHECKING:  # pragma: no cover - typing helpers
    from django.contrib.auth.models import AbstractBaseUser
    from .models import Quote

User = get_user_model()


def user_can_access_quote_chat(quote: 'Quote', user: 'AbstractBaseUser') -> bool:
    """Return True when the user can interact with the quote chat thread."""

    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True

    build_request = getattr(quote, 'build_request', None)
    if build_request and getattr(build_request, 'user_id', None) == user.id:
        return True

    email = (getattr(user, 'email', '') or '').lower()
    if not email:
        return False

    candidate_emails = [
        getattr(quote, 'prepared_by_email', None),
        getattr(quote, 'recipient_email', None),
        getattr(build_request, 'contact_email', None) if build_request else None,
    ]
    return any(candidate and candidate.lower() == email for candidate in candidate_emails)


class QuoteChatAccessPermission(BasePermission):
    """DRF permission ensuring the requester can access a quote chat."""

    message = 'You do not have permission to interact with this quote chat.'

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        from .models import Quote  # Imported lazily to avoid circular imports.

        if isinstance(obj, Quote):
            quote = obj
        else:
            quote = getattr(obj, 'quote', None)
        if quote is None:
            return False
        return user_can_access_quote_chat(quote, request.user)
