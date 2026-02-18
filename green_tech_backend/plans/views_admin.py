"""
Admin views for Plans app - Plan and Build Request management
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from django.core.files.storage import default_storage
from uuid import uuid4

from .models import BuildRequest, Plan
from .serializers import BuildRequestSerializer
from .serializers_admin import PlanAdminSerializer, BuildRequestAdminSerializer
from construction.models.request import ConstructionRequest, ConstructionType


class PlanAdminViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing plans with full CRUD operations.
    """
    queryset = Plan.objects.prefetch_related('images', 'features', 'options', 'pricing__region').order_by('-created_at')
    serializer_class = PlanAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Return all plans for admin with optional filtering."""
        queryset = super().get_queryset()
        
        # Filter by published status if provided
        is_published = self.request.query_params.get('is_published')
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == 'true')
        
        # Filter by style if provided
        style = self.request.query_params.get('style')
        if style:
            queryset = queryset.filter(style=style)
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='upload-image')
    def upload_image(self, request):
        """
        Upload an image file and return the URL.
        Used for hero images and plan images.
        """
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename
        ext = file.name.split('.')[-1] if '.' in file.name else 'jpg'
        filename = f"plans/{uuid4()}.{ext}"
        
        # Save file
        path = default_storage.save(filename, file)
        
        # Get URL
        try:
            url = default_storage.url(path)
        except Exception:
            url = f"/media/{path}"
        
        return Response({
            'url': url,
            'filename': file.name,
            'size': file.size,
        }, status=status.HTTP_201_CREATED)


class BuildRequestAdminViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing build requests with conversion capability.
    """
    queryset = BuildRequest.objects.select_related('plan', 'region', 'user').prefetch_related('attachments')
    serializer_class = BuildRequestAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('status', 'region', 'plan')
    search_fields = ('contact_name', 'contact_email', 'contact_phone', 'plan__name')
    ordering = ('-submitted_at',)
    
    def get_queryset(self):
        """Return all build requests for admin."""
        queryset = super().get_queryset()
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-submitted_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get build request statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {
                'new': queryset.filter(status='new').count(),
                'in_review': queryset.filter(status='in_review').count(),
                'contacted': queryset.filter(status='contacted').count(),
                'archived': queryset.filter(status='archived').count(),
            },
            'recent': queryset.order_by('-submitted_at')[:5].values(
                'id', 'contact_name', 'plan__name', 'status', 'submitted_at'
            ),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update build request status."""
        build_request = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if not new_status:
            return Response(
                {'error': _('status is required')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = build_request.status
        build_request.status = new_status
        build_request.save(update_fields=['status', 'updated_at'])
        
        # Send notification to user if they exist
        if build_request.user:
            from notifications.models import Notification, NotificationType, NotificationPriority
            
            status_labels = {
                'new': 'New',
                'in_review': 'In Review',
                'contacted': 'Contacted',
                'archived': 'Archived',
            }
            
            subject = f'Build Request Status Update: {status_labels.get(new_status, new_status)}'
            message = f'Your build request for {build_request.plan.name} has been updated to {status_labels.get(new_status, new_status)}.'
            
            if notes:
                message += f'\n\nNotes: {notes}'
            
            try:
                Notification.objects.create(
                    recipient=build_request.user,
                    subject=subject,
                    message=message,
                    notification_type=NotificationType.SYSTEM,
                    priority=NotificationPriority.MEDIUM,
                    metadata={
                        'build_request_id': str(build_request.id),
                        'plan_name': build_request.plan.name,
                        'old_status': old_status,
                        'new_status': new_status,
                    }
                )
            except Exception as e:
                # Log error but don't fail the status update
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to create notification: {e}')
        
        serializer = self.get_serializer(build_request)
        return Response({
            'message': _('Status updated successfully'),
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def convert_to_construction_request(self, request, pk=None):
        """
        Convert a build request to a construction request.
        
        This creates a new ConstructionRequest based on the BuildRequest data
        and updates the BuildRequest status to 'archived'.
        """
        build_request = self.get_object()
        
        # Check if already converted
        if hasattr(build_request, 'construction_request'):
            return Response(
                {
                    'error': _('This build request has already been converted.'),
                    'construction_request_id': build_request.construction_request.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        if not build_request.user:
            return Response(
                {'error': _('Build request must have an associated user before conversion.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get additional data from request body
        data = request.data
        title = data.get('title', f"Construction Request for {build_request.plan.name}")
        description = data.get('description', build_request.customizations or '')
        
        # Create construction request
        construction_request = ConstructionRequest.objects.create(
            title=title,
            description=description,
            construction_type=ConstructionType.NEW_CONSTRUCTION,
            status='DRAFT',
            client=build_request.user,
            region=build_request.region.name if build_request.region else '',
            budget=build_request.budget_max or build_request.budget_min,
            currency=build_request.budget_currency,
            customization_data={
                'source': 'build_request',
                'build_request_id': str(build_request.id),
                'plan_id': build_request.plan.id,
                'plan_name': build_request.plan.name,
                'selected_options': build_request.options,
                'customizations': build_request.customizations,
                'timeline': build_request.timeline,
                'intake_data': build_request.intake_data,
            }
        )
        
        # Link build request to construction request
        build_request.status = 'archived'
        build_request.save(update_fields=['status'])
        
        # Import here to avoid circular dependency
        from construction.serializers import ConstructionRequestSerializer
        serializer = ConstructionRequestSerializer(construction_request)
        
        return Response({
            'message': _('Build request successfully converted to construction request.'),
            'construction_request': serializer.data,
            'build_request_id': str(build_request.id),
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics about build requests."""
        from django.db.models import Count
        
        stats = {
            'total': self.get_queryset().count(),
            'by_status': dict(
                self.get_queryset()
                .values('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
            ),
            'recent': self.get_queryset()[:5].values(
                'id', 'plan__name', 'contact_name', 'status', 'submitted_at'
            )
        }
        
        return Response(stats)
