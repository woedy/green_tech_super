"""Utilities for aggregating agent-facing construction analytics."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from io import StringIO
from typing import Dict, Iterable, Mapping
from uuid import UUID

import csv

from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError
from django.db.models import Count, Q, QuerySet, Sum

from leads.models import Lead, LeadSource, LeadStatus
from quotes.models import Quote, QuoteStatus
from construction.models import Project, ProjectStatus


User = get_user_model()


def _apply_date_filters(queryset: QuerySet, *, field: str, start_date: date | None, end_date: date | None) -> QuerySet:
    """Apply optional start/end date filters on ``field`` using date-only comparisons."""

    if start_date:
        queryset = queryset.filter(**{f"{field}__date__gte": start_date})
    if end_date:
        queryset = queryset.filter(**{f"{field}__date__lte": end_date})
    return queryset


def _status_breakdown(queryset: QuerySet, *, field: str) -> Dict[str, int]:
    """Return a ``status -> count`` mapping for a queryset grouped on ``field``."""

    return {
        row[field]: row['count']
        for row in queryset.values(field).order_by(field).annotate(count=Count('id'))
    }


def _uuid_list(values: Iterable[str]) -> list[UUID]:
    """Safely convert an iterable of string identifiers into UUID objects."""

    converted: list[UUID] = []
    for value in values:
        try:
            converted.append(UUID(value))
        except (TypeError, ValueError):
            continue
    return converted


def _safe_ratio(numerator: int, denominator: int) -> float:
    """Return a ratio guarded against divide-by-zero operations."""

    return float(numerator) / denominator if denominator else 0.0


def _format_currency(value: object | None) -> str:
    """Render a decimal value with two fractional digits for currency fields."""

    if value in (None, ''):
        decimal_value = Decimal('0')
    else:
        try:
            decimal_value = Decimal(value)
        except (InvalidOperation, TypeError, ValueError):  # pragma: no cover - defensive fallback
            decimal_value = Decimal('0')
    return str(decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


@dataclass(frozen=True)
class AgentAnalyticsFilters:
    """Explicit filter criteria used when generating analytics payloads."""

    start_date: date | None = None
    end_date: date | None = None

    def as_dict(self) -> Mapping[str, str | None]:
        return {
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
        }


def build_agent_dashboard_metrics(
    user: User,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    """Aggregate pipeline KPIs for the authenticated agent or staff member."""

    filters = AgentAnalyticsFilters(start_date=start_date, end_date=end_date)

    lead_queryset = Lead.objects.all()
    if not (user.is_staff or user.is_superuser):
        lead_queryset = lead_queryset.filter(assigned_to=user)
    lead_queryset = _apply_date_filters(lead_queryset, field='created_at', start_date=start_date, end_date=end_date)

    build_request_ids = _uuid_list(
        lead_queryset.filter(source_type=LeadSource.BUILD_REQUEST).values_list('source_id', flat=True)
    )

    quote_queryset = Quote.objects.all()
    if not (user.is_staff or user.is_superuser):
        quote_filters = Q(prepared_by_email__iexact=user.email)
        if build_request_ids:
            quote_filters |= Q(build_request_id__in=build_request_ids)
        quote_queryset = quote_queryset.filter(quote_filters)
    quote_queryset = _apply_date_filters(quote_queryset, field='created_at', start_date=start_date, end_date=end_date)

    try:
        project_queryset = Project.objects.all()
        if not (user.is_staff or user.is_superuser):
            project_queryset = project_queryset.filter(
                Q(project_manager=user)
                | Q(site_supervisor=user)
                | Q(contractors=user)
                | Q(created_by=user)
            ).distinct()
        project_queryset = _apply_date_filters(
            project_queryset, field='created_at', start_date=start_date, end_date=end_date
        )
        project_status_breakdown = _status_breakdown(project_queryset, field='status')
        total_projects = project_queryset.count()
        active_projects = project_queryset.exclude(status=ProjectStatus.CANCELLED).count()
    except (ProgrammingError, OperationalError):  # pragma: no cover - depends on migration state
        project_queryset = None
        project_status_breakdown = {}
        total_projects = 0
        active_projects = 0

    total_leads = lead_queryset.count()
    leads_with_quote = lead_queryset.filter(status__in=[LeadStatus.QUOTED, LeadStatus.CLOSED]).count()

    total_quotes = quote_queryset.count()
    accepted_quotes = quote_queryset.filter(status=QuoteStatus.ACCEPTED).count()
    quote_totals = quote_queryset.aggregate(total_amount=Sum('total_amount'))
    accepted_quote_totals = quote_queryset.filter(status=QuoteStatus.ACCEPTED).aggregate(total_amount=Sum('total_amount'))

    payload: dict[str, object] = {
        'filters': filters.as_dict(),
        'leads': {
            'total': total_leads,
            'status_breakdown': _status_breakdown(lead_queryset, field='status'),
            'with_quote': leads_with_quote,
        },
        'quotes': {
            'total': total_quotes,
            'status_breakdown': _status_breakdown(quote_queryset, field='status'),
            'total_value': _format_currency(quote_totals['total_amount']),
            'accepted': accepted_quotes,
            'accepted_value': _format_currency(accepted_quote_totals['total_amount']),
        },
        'projects': {
            'total': total_projects,
            'status_breakdown': project_status_breakdown,
            'active': active_projects,
        },
    }

    payload['conversion_rates'] = {
        'lead_to_quote': _safe_ratio(leads_with_quote, total_leads),
        'quote_to_project': _safe_ratio(total_projects, total_quotes),
        'lead_to_project': _safe_ratio(total_projects, total_leads),
        'quote_acceptance': _safe_ratio(accepted_quotes, total_quotes),
    }

    return payload


def serialize_dashboard_to_csv(payload: Mapping[str, object]) -> str:
    """Convert the analytics payload into a CSV document."""

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['category', 'metric', 'value'])

    filters = payload.get('filters', {})
    if isinstance(filters, Mapping):
        for key in ('start_date', 'end_date'):
            writer.writerow(['filters', key, filters.get(key) or ''])

    for section_name in ('leads', 'quotes', 'projects'):
        section = payload.get(section_name, {})
        if not isinstance(section, Mapping):
            continue
        for metric in ('total', 'with_quote', 'active', 'accepted', 'total_value', 'accepted_value'):
            if metric in section:
                writer.writerow([section_name, metric, section[metric]])

        breakdown = section.get('status_breakdown')
        if isinstance(breakdown, Mapping):
            for status, count in breakdown.items():
                writer.writerow([section_name, f'status_{status}', count])

    conversions = payload.get('conversion_rates', {})
    if isinstance(conversions, Mapping):
        for metric, value in conversions.items():
            formatted = f"{float(value):.4f}"
            writer.writerow(['conversion_rates', metric, formatted])

    return output.getvalue()
