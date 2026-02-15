from __future__ import annotations

from rest_framework import permissions, viewsets

from .models import Region
from .serializers import RegionPublicSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only endpoint for active regions."""
    serializer_class = RegionPublicSerializer
    permission_classes = (permissions.AllowAny,)
    queryset = Region.objects.active().order_by('name')
    lookup_field = 'slug'
