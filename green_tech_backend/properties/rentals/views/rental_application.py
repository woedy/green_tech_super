"""
Views for rental application and tenant screening.
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.utils import timezone

from accounts.models import User
from properties.models import Property
from ..models.rental_application import (
    RentalApplication, ApplicationDocument, TenantScreening,
    RentalApplicationStatus
)
from ..serializers.rental_application import (
    RentalApplicationSerializer, ApplicationDocumentSerializer,
    TenantScreeningSerializer, RentalApplicationActionSerializer,
    RentalApplicationListSerializer
)
from .base import BaseViewSet


class RentalApplicationViewSet(BaseViewSet):
    """
    API endpoint for managing rental applications.
    """
    serializer_class = RentalApplicationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'property', 'applicant']
    search_fields = [
        'property__title', 'applicant__first_name', 'applicant__last_name',
        'applicant__email', 'status'
    ]
    ordering_fields = [
        'application_date', 'submitted_at', 'reviewed_at', 'status'
    ]
    ordering = ['-submitted_at', '-created_at']

    def get_queryset(self):
        """
        Filter queryset based on user role and permissions.
        ""
        queryset = RentalApplication.objects.select_related(
            'property', 'applicant', 'reviewed_by'
        ).prefetch_related('documents', 'screening')
        
        user = self.request.user
        
        # Non-staff users can only see their own applications or applications for their properties
        if not user.is_staff:
            queryset = queryset.filter(
                Q(applicant=user) |
                Q(property__owner=user) |
                Q(property__managers=user)
            ).distinct()
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())
        
        # Filter by property if provided
        property_id = self.request.query_params.get('property_id')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(application_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(application_date__lte=end_date)
        
        return queryset

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action == 'list':
            return RentalApplicationListSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """
        Set the applicant to the current user and handle initial status.
        ""
        # Only allow creating applications for available properties
        property_obj = serializer.validated_data.get('property')
        if not property_obj.rental_details.is_available:
            raise ValidationError({
                'property': 'This property is not available for rent.'
            })
        
        # Set applicant to current user if not set
        if 'applicant' not in serializer.validated_data:
            serializer.validated_data['applicant'] = self.request.user
        
        # Set initial status to DRAFT if not provided
        if 'status' not in serializer.validated_data:
            serializer.validated_data['status'] = RentalApplicationStatus.DRAFT
        
        # Set application date
        serializer.validated_data['application_date'] = timezone.now()
        
        # Save the application
        application = serializer.save()
        
        # Create an empty screening record
        TenantScreening.objects.create(application=application)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit a draft application for review.
        ""
        application = self.get_object()
        
        # Check permissions
        if application.applicant != request.user:
            raise PermissionDenied("You can only submit your own applications.")
        
        if application.status != RentalApplicationStatus.DRAFT:
            raise ValidationError({
                'status': 'Only draft applications can be submitted.'
            })
        
        # Validate required fields
        required_fields = [
            'move_in_date', 'lease_term_months', 'monthly_income',
            'income_type', 'employer_name', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relation'
        ]
        
        missing_fields = [
            field for field in required_fields 
            if not getattr(application, field, None)
        ]
        
        if missing_fields:
            raise ValidationError({
                'required_fields': f'Missing required fields: {", ".join(missing_fields)}'
            })
        
        # Update status to SUBMITTED
        application.status = RentalApplicationStatus.SUBMITTED
        application.submitted_at = timezone.now()
        application.save(update_fields=['status', 'submitted_at', 'updated_at'])
        
        # TODO: Send notification to property owner/manager
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start_review(self, request, pk=None):
        """
        Start reviewing an application (change status to UNDER_REVIEW).
        """
        application = self.get_object()
        
        # Check permissions
        if not request.user.has_perm('rentals.review_rental_application'):
            raise PermissionDenied(
                "You don't have permission to review applications."
            )
        
        if application.status != RentalApplicationStatus.SUBMITTED:
            raise ValidationError({
                'status': 'Only submitted applications can be reviewed.'
            })
        
        # Update status to UNDER_REVIEW
        application.status = RentalApplicationStatus.UNDER_REVIEW
        application.save(update_fields=['status', 'updated_at'])
        
        # TODO: Send notification to applicant
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a rental application.
        """
        return self._process_application_action(
            request, pk, RentalApplicationStatus.APPROVED)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a rental application.
        """
        return self._process_application_action(
            request, pk, RentalApplicationStatus.REJECTED)
    
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """
        Withdraw a rental application (for applicants).
        """
        application = self.get_object()
        
        # Check permissions
        if application.applicant != request.user:
            raise PermissionDenied("You can only withdraw your own applications.")
        
        if application.status not in [
            RentalApplicationStatus.DRAFT,
            RentalApplicationStatus.SUBMITTED,
            RentalApplicationStatus.UNDER_REVIEW
        ]:
            raise ValidationError({
                'status': 'This application cannot be withdrawn.'
            })
        
        # Update status to WITHDRAWN
        application.status = RentalApplicationStatus.WITHDRAWN
        application.save(update_fields=['status', 'updated_at'])
        
        # TODO: Send notification to property owner/manager
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    def _process_application_action(self, request, pk, new_status):
        """
        Helper method to process application actions (approve/reject).
        ""
        application = self.get_object()
        
        # Check permissions
        if not request.user.has_perm('rentals.approve_rental_application'):
            raise PermissionDenied(
                "You don't have permission to approve/reject applications."
            )
        
        # Validate current status
        if application.status not in [
            RentalApplicationStatus.SUBMITTED,
            RentalApplicationStatus.UNDER_REVIEW
        ]:
            raise ValidationError({
                'status': f'Application must be submitted or under review to be {new_status.lower()}.'
            })
        
        # Validate request data
        serializer = RentalApplicationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update application
        application.status = new_status
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.review_notes = serializer.validated_data.get('notes', '')
        application.save(
            update_fields=[
                'status', 'reviewed_by', 'reviewed_at', 
                'review_notes', 'updated_at'
            ]
        )
        
        # If approved, mark property as not available
        if new_status == RentalApplicationStatus.APPROVED:
            rental_property = application.property.rental_details
            rental_property.is_available = False
            rental_property.save(update_fields=['is_available', 'updated_at'])
            
            # TODO: Create lease agreement
            
        # TODO: Send notification to applicant
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)


class ApplicationDocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing application documents.
    """
    serializer_class = ApplicationDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter documents based on user permissions.
        ""
        queryset = ApplicationDocument.objects.select_related('application')
        
        # Non-staff users can only see documents for their own applications
        # or applications for their properties
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(application__applicant=self.request.user) |
                Q(application__property__owner=self.request.user) |
                Q(application__property__managers=self.request.user)
            ).distinct()
        
        # Filter by application if provided
        application_id = self.request.query_params.get('application')
        if application_id:
            queryset = queryset.filter(application_id=application_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the file metadata and check permissions.
        """
        application = serializer.validated_data['application']
        
        # Check permissions
        if (not self.request.user.is_staff and 
            application.applicant != self.request.user and
            application.property.owner != self.request.user and
            not application.property.managers.filter(id=self.request.user.id).exists()):
            raise PermissionDenied(
                "You don't have permission to add documents to this application."
            )
        
        # Set file metadata
        file_obj = serializer.validated_data['file']
        serializer.validated_data['original_filename'] = file_obj.name
        serializer.validated_data['file_size'] = file_obj.size
        
        # Save the document
        serializer.save()


class TenantScreeningViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    API endpoint for managing tenant screening.
    """
    serializer_class = TenantScreeningSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter screenings based on user permissions.
        ""
        queryset = TenantScreening.objects.select_related(
            'application', 'application__property', 'screened_by'
        )
        
        # Non-staff users can only see screenings for their own applications
        # or applications for their properties
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(application__applicant=self.request.user) |
                Q(application__property__owner=self.request.user) |
                Q(application__property__managers=self.request.user)
            ).distinct()
        
        # Filter by application if provided
        application_id = self.request.query_params.get('application')
        if application_id:
            queryset = queryset.filter(application_id=application_id)
        
        return queryset
    
    def perform_update(self, serializer):
        """
        Update screening and set screened_by if not set.
        """
        screening = self.get_object()
        
        # Check permissions
        if (not self.request.user.is_staff and 
            screening.application.property.owner != self.request.user and
            not screening.application.property.managers.filter(
                id=self.request.user.id
            ).exists()):
            raise PermissionDenied(
                "You don't have permission to update this screening."
            )
        
        # Set screened_by if not set
        if not screening.screened_by:
            serializer.validated_data['screened_by'] = self.request.user
        
        # Update the screening
        serializer.save()
        
        # If screening is complete, update the application status if needed
        if screening.is_complete and screening.application.status in [
            RentalApplicationStatus.SUBMITTED,
            RentalApplicationStatus.UNDER_REVIEW
        ]:
            application = screening.application
            application.status = RentalApplicationStatus.UNDER_REVIEW
            application.save(update_fields=['status', 'updated_at'])
