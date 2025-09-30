"""Analytics API views for construction agent dashboards."""

from __future__ import annotations

from datetime import datetime

from django.http import HttpResponse

from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from construction.analytics import build_agent_dashboard_metrics, serialize_dashboard_to_csv


class AgentAnalyticsDashboardView(APIView):
    """Expose aggregated pipeline KPIs for agents and project managers."""

    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):  # noqa: D401 - DRF signature
        """Return analytics data or a CSV export based on request query parameters."""

        start_date = self._parse_date(request.query_params.get('start_date'), 'start_date')
        end_date = self._parse_date(request.query_params.get('end_date'), 'end_date')

        if start_date and end_date and end_date < start_date:
            raise ValidationError({'end_date': 'End date must be on or after the start date.'})

        payload = build_agent_dashboard_metrics(
            request.user,
            start_date=start_date,
            end_date=end_date,
        )

        if request.query_params.get('format') == 'csv':
            csv_content = serialize_dashboard_to_csv(payload)
            response = HttpResponse(csv_content, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="agent-dashboard-analytics.csv"'
            return response

        return Response(payload)

    @staticmethod
    def _parse_date(value: str | None, field_name: str):
        if not value:
            return None
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError as exc:  # pragma: no cover - defensive guard
            raise ValidationError({field_name: 'Invalid date format. Use YYYY-MM-DD.'}) from exc
