from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status, filters, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    CaseStudy, CaseStudyImage, EducationalContent,
    ExpertProfile, ConsultationSlot, ConsultationBooking,
    ProjectShowcase, ProjectGalleryImage
)
from .serializers import (
    CaseStudySerializer, EducationalContentSerializer,
    ExpertProfileSerializer, ConsultationSlotSerializer,
    ConsultationBookingSerializer, ProjectShowcaseSerializer,
    ProjectShowcaseDetailSerializer
)
from accounts.permissions import IsOwnerOrReadOnly, IsAdminOrReadOnly


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CaseStudyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for case studies of completed projects.
    """
    queryset = CaseStudy.objects.filter(published=True)
    serializer_class = CaseStudySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'overview', 'location', 'project_type']
    ordering_fields = ['created_at', 'updated_at', 'project_type', 'featured']
    filterset_fields = ['project_type', 'featured', 'published']
    pagination_class = StandardResultsSetPagination
    lookup_field = 'slug'
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Allow admins to see all case studies, others only see published ones
        if not self.request.user.is_staff:
            queryset = queryset.filter(published=True)
            
        # Filter by project if project_id is provided
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        # Filter by property if property_id is provided
        property_id = self.request.query_params.get('property_id')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
            
        return queryset


class EducationalContentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for educational content about sustainable building in Ghana.
    """
    queryset = EducationalContent.objects.all()
    serializer_class = EducationalContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'summary', 'content', 'author__first_name', 'author__last_name']
    ordering_fields = ['published_date', 'created_at', 'updated_at']
    filterset_fields = ['content_type', 'category', 'published']
    pagination_class = StandardResultsSetPagination
    lookup_field = 'slug'
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Non-authenticated users and non-staff can only see published content
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(published=True, published_date__lte=timezone.now())
            
        # Filter by content type or category if provided
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
            
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset
    
    def perform_create(self, serializer):
        # Set the author to the current user if not provided
        if not serializer.validated_data.get('author'):
            serializer.save(author=self.request.user)
        else:
            serializer.save()


class ExpertProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for expert profiles available for consultation.
    """
    queryset = ExpertProfile.objects.filter(available_for_consultation=True)
    serializer_class = ExpertProfileSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = [
        'user__first_name', 'user__last_name', 'user__email',
        'bio', 'qualifications', 'expertise'
    ]
    ordering_fields = ['is_featured', 'years_experience', 'hourly_rate']
    filterset_fields = ['expertise', 'available_for_consultation', 'is_featured']
    pagination_class = StandardResultsSetPagination
    
    @action(detail=True, methods=['get'])
    def available_slots(self, request, pk=None):
        """Get available consultation slots for this expert."""
        expert = self.get_object()
        now = timezone.now()
        
        # Get available slots that are in the future and not booked
        slots = expert.available_slots.filter(
            start_time__gt=now,
            is_booked=False
        ).order_by('start_time')
        
        # Filter by date if provided
        date = self.request.query_params.get('date')
        if date:
            slots = slots.filter(start_time__date=date)
            
        # Paginate the results
        page = self.paginate_queryset(slots)
        if page is not None:
            serializer = ConsultationSlotSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = ConsultationSlotSerializer(slots, many=True)
        return Response(serializer.data)


class ConsultationSlotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing available consultation slots.
    """
    serializer_class = ConsultationSlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['start_time', 'end_time']
    filterset_fields = ['expert', 'is_booked']
    
    def get_queryset(self):
        now = timezone.now()
        return ConsultationSlot.objects.filter(
            start_time__gt=now,
            is_booked=False
        ).order_by('start_time')


class ConsultationBookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for booking consultations with experts.
    """
    serializer_class = ConsultationBookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['created_at', 'slot__start_time']
    filterset_fields = ['expert', 'status', 'user']
    
    def get_queryset(self):
        # Users can only see their own bookings, staff can see all
        if self.request.user.is_staff:
            return ConsultationBooking.objects.all()
        return ConsultationBooking.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Set the user to the current user
        slot = serializer.validated_data['slot']
        
        # Mark the slot as booked
        slot.is_booked = True
        slot.save()
        
        # Save the booking with the current user
        serializer.save(
            user=self.request.user,
            expert=slot.expert,
            status='pending'
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a consultation booking."""
        booking = self.get_object()
        
        # Only allow the user who made the booking or an admin to cancel
        if booking.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to cancel this booking."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Only allow cancelling if it's not already completed or cancelled
        if booking.status in ['completed', 'cancelled']:
            return Response(
                {"detail": f"This booking is already {booking.status} and cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Free up the slot
        booking.slot.is_booked = False
        booking.slot.save()
        
        # Update the booking status
        booking.status = 'cancelled'
        booking.save()
        
        return Response(
            {"status": "Booking cancelled successfully."},
            status=status.HTTP_200_OK
        )


class ProjectShowcaseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for project showcases in the inspiration gallery.
    """
    queryset = ProjectShowcase.objects.filter(is_published=True)
    serializer_class = ProjectShowcaseSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'description', 'project__name']
    ordering_fields = ['featured_order', 'created_at']
    filterset_fields = ['featured', 'is_published']
    pagination_class = StandardResultsSetPagination
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        # Use the detail serializer for the retrieve action
        if self.action == 'retrieve':
            return ProjectShowcaseDetailSerializer
        return super().get_serializer_class()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Only show published showcases to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
            
        # Filter by featured if specified
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(featured=True)
            
        # Filter by sustainability features if provided
        features = self.request.query_params.get('features')
        if features:
            feature_ids = [int(fid) for fid in features.split(',') if fid.isdigit()]
            if feature_ids:
                queryset = queryset.filter(sustainability_features__id__in=feature_ids).distinct()
                
        return queryset.order_by('featured_order', '-created_at')


class ProjectGalleryImageViewSet(mixins.CreateModelMixin,
                              mixins.RetrieveModelMixin,
                              mixins.UpdateModelMixin,
                              mixins.DestroyModelMixin,
                              viewsets.GenericViewSet):
    """
    API endpoint for managing project gallery images.
    """
    queryset = ProjectGalleryImage.objects.all()
    serializer_class = ProjectShowcaseSerializer.ProjectGalleryImageSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        # Only show images for published showcases to non-staff users
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(showcase__is_published=True)
