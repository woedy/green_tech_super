from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid

from .models import Property
from .serializers_admin import PropertyAdminSerializer


class IsAgentOrAdmin(permissions.BasePermission):
    """Permission for staff or agents."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_staff or 
            request.user.is_superuser or 
            getattr(request.user, 'user_type', None) == 'AGENT'
        )

class PropertyAdminViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyAdminSerializer
    permission_classes = (IsAgentOrAdmin,)
    queryset = Property.objects.all().prefetch_related('images').order_by('-updated_at')

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Agents can only see their own properties
        if not (user.is_staff or user.is_superuser) and getattr(user, 'user_type', None) == 'AGENT':
            queryset = queryset.filter(listed_by=user)

        status_filter = self.request.query_params.get('status') if self.request else None
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        region_slug = self.request.query_params.get('region') if self.request else None
        if region_slug:
            queryset = queryset.filter(region__slug=region_slug)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        # Automatically set listed_by for agents
        if not (user.is_staff or user.is_superuser) and getattr(user, 'user_type', None) == 'AGENT':
            serializer.save(listed_by=user)
        else:
            serializer.save()

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
        filepath = f"properties/images/{filename}"
        
        # Save file
        saved_path = default_storage.save(filepath, file)
        
        # Generate URL
        file_url = request.build_absolute_uri(f"{settings.MEDIA_URL}{saved_path}")
        
        return Response({
            'url': file_url,
            'filename': filename,
            'size': file.size
        }, status=status.HTTP_201_CREATED)
