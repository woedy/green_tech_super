from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DocumentStatus, SiteDocument, SiteDocumentVersion
from .serializers import (
    SiteDocumentSerializer,
    SiteDocumentUpsertSerializer,
    SiteDocumentVersionCreateSerializer,
    SiteDocumentVersionSerializer,
)


class SiteDocumentViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAdminUser,)
    queryset = SiteDocument.objects.all().prefetch_related('versions', 'current_version')

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return SiteDocumentSerializer
        return SiteDocumentUpsertSerializer

    @action(detail=True, methods=['post'], serializer_class=SiteDocumentVersionCreateSerializer)
    def versions(self, request, *args, **kwargs):
        document = self.get_object()
        serializer = self.get_serializer(data={**request.data, 'document': document.id})
        serializer.is_valid(raise_exception=True)
        version = serializer.save()
        output_serializer = SiteDocumentVersionSerializer(version, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class SiteDocumentVersionViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAdminUser,)
    queryset = SiteDocumentVersion.objects.select_related('document', 'created_by')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SiteDocumentVersionCreateSerializer
        return SiteDocumentVersionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=['post'])
    def publish(self, request, *args, **kwargs):
        version = self.get_object()
        version.status = DocumentStatus.PUBLISHED
        version.save(update_fields=['status'])
        return Response(SiteDocumentVersionSerializer(version, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, *args, **kwargs):
        version = self.get_object()
        version.status = DocumentStatus.ARCHIVED
        version.save(update_fields=['status'])
        return Response(SiteDocumentVersionSerializer(version, context={'request': request}).data)
