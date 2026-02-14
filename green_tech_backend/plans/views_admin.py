from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid

from .models import Plan
from .serializers_admin import PlanAdminSerializer


class PlanAdminViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD viewset for managing architectural plans."""

    serializer_class = PlanAdminSerializer
    permission_classes = (permissions.IsAdminUser,)
    queryset = (
        Plan.objects.all()
        .prefetch_related('images', 'features', 'options', 'pricing__region')
        .order_by('-updated_at')
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status') if self.request else None
        if status_filter == 'draft':
            queryset = queryset.filter(is_published=False)
        elif status_filter == 'published':
            queryset = queryset.filter(is_published=True)
        return queryset

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, *args, **kwargs):
        plan = self.get_object()
        plan._current_ip = request.META.get('REMOTE_ADDR')
        plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
        if plan.publish(user=request.user):
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        return Response({'detail': 'Plan is already published.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, *args, **kwargs):
        plan = self.get_object()
        plan._current_ip = request.META.get('REMOTE_ADDR')
        plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
        if plan.unpublish(user=request.user):
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        return Response({'detail': 'Plan is already unpublished.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='upload-image', parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, *args, **kwargs):
        """Upload an image file and return the URL."""
        if 'file' not in request.FILES:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {'detail': f'Invalid file type. Allowed types: {", ".join(allowed_types)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024
        if file.size > max_size:
            return Response(
                {'detail': 'File size exceeds 5MB limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename
        ext = os.path.splitext(file.name)[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = f"plans/images/{filename}"
        
        # Save file
        saved_path = default_storage.save(filepath, file)
        
        # Generate URL
        if settings.DEBUG:
            file_url = f"{settings.MEDIA_URL}{saved_path}"
        else:
            file_url = default_storage.url(saved_path)
        
        return Response({
            'url': file_url,
            'filename': filename,
            'size': file.size
        }, status=status.HTTP_201_CREATED)
