from __future__ import annotations

from rest_framework import permissions, viewsets

from .models import Region
from .serializers import RegionAdminSerializer


class RegionAdminViewSet(viewsets.ModelViewSet):
    serializer_class = RegionAdminSerializer
    permission_classes = (permissions.IsAdminUser,)
    queryset = Region.objects.all().order_by('name')
