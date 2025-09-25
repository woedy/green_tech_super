from __future__ import annotations

import json
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from django.conf import settings
from django.core.files.storage import default_storage
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter, CharFilter
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from locations.models import Region
from .models import BuildRequest, BuildRequestAttachment, Plan
from .serializers import (
    BuildRequestSerializer,
    DirectUploadSerializer,
    PlanDetailSerializer,
    PlanListSerializer,
    RegionSerializer,
    PresignedUploadSerializer,
)
from .tasks import (
    dispatch_build_request_confirmation,
    dispatch_build_request_internal_alert,
)
from leads.services import sync_lead_from_build_request

from .realtime import notify_new_build_request


class PlanFilter(FilterSet):
    style = CharFilter(field_name='style', lookup_expr='iexact')
    bedrooms = NumberFilter(field_name='bedrooms')
    bathrooms = NumberFilter(field_name='bathrooms')
    floors = NumberFilter(field_name='floors')
    min_area = NumberFilter(field_name='area_sq_m', lookup_expr='gte')
    max_area = NumberFilter(field_name='area_sq_m', lookup_expr='lte')
    max_budget = NumberFilter(field_name='base_price', lookup_expr='lte')
    min_budget = NumberFilter(field_name='base_price', lookup_expr='gte')

    class Meta:
        model = Plan
        fields = (
            'style',
            'bedrooms',
            'bathrooms',
            'floors',
        )


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Plan.objects.filter(is_published=True)
        .prefetch_related('images', 'features', 'options', 'pricing__region')
    )
    serializer_class = PlanListSerializer
    lookup_field = 'slug'
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_class = PlanFilter
    search_fields = ('name', 'summary', 'description', 'tags')
    ordering_fields = ('base_price', 'area_sq_m', 'bedrooms', 'bathrooms', 'sustainability_score')
    ordering = ('name',)
    permission_classes = (AllowAny,)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PlanDetailSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def filters(self, request):
        regions = RegionSerializer(Region.objects.active(), many=True).data
        styles = [
            {'value': choice[0], 'label': choice[1]} for choice in Plan._meta.get_field('style').choices
        ]
        max_price_value = (
            Plan.objects.filter(is_published=True)
            .order_by('-base_price')
            .values_list('base_price', flat=True)
            .first()
        )
        return Response(
            {
                'styles': styles,
                'regions': regions,
                'max_price': str(max_price_value) if max_price_value is not None else None,
            }
        )


class BuildRequestViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = BuildRequest.objects.select_related('plan', 'region').prefetch_related('attachments', 'plan__options')
    serializer_class = BuildRequestSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        self._attach_files(instance, request.data.get('attachments'))
        dispatch_build_request_confirmation.delay(str(instance.id))
        dispatch_build_request_internal_alert.delay(str(instance.id))
        notify_new_build_request(instance)
        sync_lead_from_build_request(instance)
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)

    def _attach_files(self, instance: BuildRequest, attachments_data):
        if not attachments_data:
            return
        if isinstance(attachments_data, str):
            try:
                attachments_data = json.loads(attachments_data)
            except json.JSONDecodeError:
                attachments_data = []
        for payload in attachments_data or []:
            storage_key = payload.get('storage_key')
            original_name = payload.get('original_name') or payload.get('filename')
            if not storage_key or not original_name:
                continue
            attachment = BuildRequestAttachment.objects.create(
                request=instance,
                storage_key=storage_key,
                original_name=original_name,
            )
            # Ensure the FileField references the stored file if available
            if storage_key and default_storage.exists(storage_key):
                attachment.file.name = storage_key
                attachment.save(update_fields=('file',))


class BuildRequestUploadView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = PresignedUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        filename = serializer.validated_data['filename']
        content_type = serializer.validated_data['content_type']
        response = self._try_presigned(filename, content_type)
        if response:
            return Response(response)
        return self._direct_upload_fallback(filename)

    def _try_presigned(self, filename: str, content_type: str):
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        if not bucket:
            return None
        key = f"build_requests/{uuid4()}_{filename}"
        try:
            client = boto3.client('s3')
            presigned = client.generate_presigned_post(
                Bucket=bucket,
                Key=key,
                Fields={'Content-Type': content_type},
                Conditions=[{'Content-Type': content_type}],
                ExpiresIn=900,
            )
        except (BotoCoreError, NoCredentialsError):
            return None
        return {
            'upload_mode': 's3',
            'bucket': bucket,
            'key': key,
            'fields': presigned['fields'],
            'url': presigned['url'],
            'storage_key': key,
            'original_name': filename,
        }

    def _direct_upload_fallback(self, filename: str):
        upload_url = reverse('plans:build-request-direct-upload')
        return Response(
            {
                'upload_mode': 'direct',
                'upload_url': upload_url,
                'storage_key': None,
                'original_name': filename,
            }
        )


class BuildRequestDirectUploadView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = DirectUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.save()
        filename = uploaded_file.name
        storage_path = f"build_requests/{uuid4()}_{filename}"
        stored_path = default_storage.save(storage_path, uploaded_file)
        url = None
        try:
            url = default_storage.url(stored_path)
        except Exception:  # pragma: no cover
            url = None
        return Response(
            {
                'storage_key': stored_path,
                'original_name': filename,
                'url': url,
            },
            status=status.HTTP_201_CREATED,
        )
