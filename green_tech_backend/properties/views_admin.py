from __future__ import annotations

from rest_framework import permissions, viewsets

from .models import Property
from .serializers_admin import PropertyAdminSerializer


class PropertyAdminViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyAdminSerializer
    permission_classes = (permissions.IsAdminUser,)
    queryset = Property.objects.all().prefetch_related('images').order_by('-updated_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status') if self.request else None
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        region_slug = self.request.query_params.get('region') if self.request else None
        if region_slug:
            queryset = queryset.filter(region__slug=region_slug)
        return queryset
