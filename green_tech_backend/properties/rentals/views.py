"""
Views for rental property management.
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from properties.models import Property
from .models import (
    RentalProperty, LeaseAgreement, MaintenanceRequest, Payment,
    LeaseType, PaymentFrequency, MaintenanceStatus, MaintenancePriority
)
from .serializers import (
    RentalPropertySerializer, LeaseAgreementSerializer,
    MaintenanceRequestSerializer, PaymentSerializer,
    LeaseAgreementCreateSerializer, LeaseTerminationSerializer
)
from .permissions import (
    IsPropertyOwnerOrAdmin, IsTenantOrAdmin,
    IsMaintenanceStaffOrAdmin, CanManageLease, CanManagePayment
)


class RentalPropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rental properties to be viewed or edited.
    """
    queryset = RentalProperty.objects.select_related('property').all()
    serializer_class = RentalPropertySerializer
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrAdmin]
    filterset_fields = ['is_available', 'available_from']
    search_fields = ['property__title', 'property__address', 'property__city', 'property__region']
    ordering_fields = ['available_from', 'property__price']
    ordering = ['-available_from']

    def get_queryset(self):
        """
        Filter queryset based on user role and query parameters.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Property owners/managers see their own properties
        if not user.is_staff:
            queryset = queryset.filter(
                Q(property__owner=user) |
                Q(property__managers=user)
            ).distinct()
        
        # Filter by availability
        is_available = self.request.query_params.get('is_available')
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        
        # Filter by date range
        available_from = self.request.query_params.get('available_from')
        available_to = self.request.query_params.get('available_to')
        
        if available_from:
            queryset = queryset.filter(available_from__gte=available_from)
        if available_to:
            queryset = queryset.filter(available_from__lte=available_to)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the property owner on create and validate permissions."""
        property_obj = serializer.validated_data['property']
        
        # Check if property is already rented
        if hasattr(property_obj, 'rental_details'):
            raise ValidationError({"property": "This property is already listed for rent."})
        
        # Check if user has permission to rent this property
        if not self.request.user.is_staff and property_obj.owner != self.request.user:
            raise PermissionDenied("You don't have permission to list this property for rent.")
        
        # Set default values
        serializer.save()
        
        # Update property to mark as rental
        property_obj.is_rental = True
        property_obj.save(update_fields=['is_rental'])
    
    @action(detail=True, methods=['post'], url_path='toggle-availability')
    def toggle_availability(self, request, pk=None):
        """
        Toggle the availability of a rental property.
        """
        rental_property = self.get_object()
        rental_property.is_available = not rental_property.is_available
        rental_property.save(update_fields=['is_available', 'updated_at'])
        
        serializer = self.get_serializer(rental_property)
        return Response(serializer.data)


class LeaseAgreementViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows lease agreements to be viewed or edited.
    """
    queryset = LeaseAgreement.objects.select_related('property', 'tenant').all()
    permission_classes = [IsAuthenticated, CanManageLease]
    filterset_fields = ['lease_type', 'is_active', 'start_date', 'end_date']
    search_fields = [
        'property__title', 'property__address',
        'tenant__first_name', 'tenant__last_name', 'tenant__email'
    ]
    ordering_fields = ['start_date', 'end_date', 'monthly_rent']
    ordering = ['-start_date']

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action == 'create':
            return LeaseAgreementCreateSerializer
        return LeaseAgreementSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on user role and query parameters.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Non-staff users can only see their own leases or leases for their properties
        if not user.is_staff:
            queryset = queryset.filter(
                Q(property__owner=user) |
                Q(property__managers=user) |
                Q(tenant=user)
            ).distinct()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by lease type
        lease_type = self.request.query_params.get('lease_type')
        if lease_type:
            queryset = queryset.filter(lease_type=lease_type.upper())
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the lease as active and update property availability.
        """
        property_obj = serializer.validated_data['property']
        
        # Check if property is available for rent
        if hasattr(property_obj, 'rental_details') and not property_obj.rental_details.is_available:
            raise ValidationError({"property": "This property is not available for rent."})
        
        # Set lease as active
        lease = serializer.save(is_active=True)
        
        # Update property availability
        if hasattr(property_obj, 'rental_details'):
            rental_property = property_obj.rental_details
            rental_property.is_available = False
            rental_property.save(update_fields=['is_available', 'updated_at'])
    
    @action(detail=True, methods=['post'], url_path='terminate')
    def terminate_lease(self, request, pk=None):
        """
        Terminate a lease agreement.
        """
        lease = self.get_object()
        serializer = LeaseTerminationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        termination_date = serializer.validated_data['termination_date']
        reason = serializer.validated_data.get('reason', '')
        refund_amount = serializer.validated_data.get('refund_amount', 0)
        
        # Validate termination date
        if termination_date < timezone.now().date():
            raise ValidationError({"termination_date": "Termination date cannot be in the past."})
        
        if termination_date < lease.start_date:
            raise ValidationError({"termination_date": "Termination date cannot be before lease start date."})
        
        # Update lease end date and deactivate
        lease.end_date = termination_date
        lease.is_active = False
        lease.notes = f"{lease.notes or ''}\n\nTerminated on {timezone.now().strftime('%Y-%m-%d')}. {reason}".strip()
        lease.save()
        
        # Update property availability
        if hasattr(lease.property, 'rental_details'):
            rental_property = lease.property.rental_details
            rental_property.is_available = True
            rental_property.available_from = termination_date
            rental_property.save(update_fields=['is_available', 'available_from', 'updated_at'])
        
        # Process refund if applicable
        if refund_amount > 0:
            Payment.objects.create(
                lease=lease,
                amount=-refund_amount,  # Negative amount for refund
                payment_date=timezone.now().date(),
                payment_method='refund',
                reference_number=f"REFUND-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                notes=f"Refund for early lease termination. {reason}",
                received_by=request.user
            )
        
        return Response({'status': 'lease terminated'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='payment-summary')
    def payment_summary(self, request, pk=None):
        """
        Get a summary of payments for a lease agreement.
        """
        lease = self.get_object()
        payments = Payment.objects.filter(lease=lease).order_by('payment_date')
        
        total_paid = payments.aggregate(total=Sum('amount'))['total'] or 0
        payments_count = payments.count()
        
        # Calculate expected payments based on lease terms
        expected_payments = 0
        current_date = lease.start_date
        
        while current_date <= min(lease.end_date or timezone.now().date(), timezone.now().date()):
            expected_payments += 1
            if lease.payment_frequency == 'WEEKLY':
                current_date += timedelta(weeks=1)
            elif lease.payment_frequency == 'BIWEEKLY':
                current_date += timedelta(weeks=2)
            elif lease.payment_frequency == 'MONTHLY':
                # Add approximately one month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            elif lease.payment_frequency == 'QUARTERLY':
                # Add 3 months
                new_month = current_date.month + 3
                new_year = current_date.year
                if new_month > 12:
                    new_month -= 12
                    new_year += 1
                current_date = current_date.replace(year=new_year, month=new_month)
            elif lease.payment_frequency == 'ANNUALLY':
                current_date = current_date.replace(year=current_date.year + 1)
        
        balance = (lease.monthly_rent * expected_payments) - total_paid
        
        return Response({
            'total_paid': total_paid,
            'payments_count': payments_count,
            'expected_payments': expected_payments,
            'monthly_rent': lease.monthly_rent,
            'payment_frequency': lease.payment_frequency,
            'balance': max(0, balance),  # Don't show negative balance
            'is_overdue': balance > 0 and lease.is_active
        })


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows maintenance requests to be viewed or edited.
    """
    queryset = MaintenanceRequest.objects.select_related(
        'property', 'submitted_by', 'assigned_to'
    ).all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'priority', 'property']
    search_fields = ['title', 'description', 'property__title']
    ordering_fields = ['requested_date', 'scheduled_date', 'completed_date', 'priority']
    ordering = ['-requested_date']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'assign', 'complete']:
            permission_classes = [IsAuthenticated, IsMaintenanceStaffOrAdmin | IsPropertyOwnerOrAdmin]
        else:
            permission_classes = [IsAuthenticated, IsMaintenanceStaffOrAdmin | IsPropertyOwnerOrAdmin | IsTenantOrAdmin]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user role and query parameters.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Non-staff users can only see their own requests or requests for their properties
        if not user.is_staff:
            queryset = queryset.filter(
                Q(property__owner=user) |
                Q(property__managers=user) |
                Q(submitted_by=user) |
                Q(assigned_to=user)
            ).distinct()
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status is not None:
            queryset = queryset.filter(status=status.upper())
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority is not None:
            queryset = queryset.filter(priority=priority.upper())
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(requested_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(requested_date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the submitted_by field to the current user when creating a request.
        """
        # Set default status to PENDING
        if 'status' not in serializer.validated_data:
            serializer.validated_data['status'] = MaintenanceStatus.PENDING
        
        # Set the current user as the submitter
        serializer.save(submitted_by=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        """
        Assign a maintenance request to a staff member.
        Expected payload: {"assigned_to": <user_id>}
        """
        maintenance_request = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if not assigned_to_id:
            return Response(
                {"assigned_to": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify the assigned user exists and is a staff member
            assigned_to = User.objects.get(id=assigned_to_id)
            if not assigned_to.is_staff and not assigned_to.groups.filter(name='Maintenance').exists():
                return Response(
                    {"assigned_to": ["The assigned user must be a maintenance staff member."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the maintenance request
            maintenance_request.assigned_to = assigned_to
            maintenance_request.status = MaintenanceStatus.ASSIGNED
            maintenance_request.save(update_fields=['assigned_to', 'status', 'updated_at'])
            
            # Create a note about the assignment
            maintenance_request.notes = (
                f"{maintenance_request.notes or ''}\n\n"
                f"Assigned to {assigned_to.get_full_name() or assigned_to.email} "
                f"on {timezone.now().strftime('%Y-%m-%d %H:%M')} by {request.user.get_full_name() or request.user.email}."
            ).strip()
            maintenance_request.save(update_fields=['notes'])
            
            # TODO: Send notification to the assigned staff member
            
            return Response(
                {"status": "Maintenance request assigned successfully"},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {"assigned_to": ["User not found."]},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='start')
    def start_work(self, request, pk=None):
        """
        Mark a maintenance request as in progress.
        """
        maintenance_request = self.get_object()
        
        # Only the assigned staff or admin can start work
        if (maintenance_request.assigned_to != request.user and 
            not request.user.is_staff and 
            not request.user.groups.filter(name__in=['Admin', 'Maintenance Manager']).exists()):
            raise PermissionDenied("You don't have permission to start work on this request.")
        
        if maintenance_request.status == MaintenanceStatus.COMPLETED:
            return Response(
                {"detail": "Cannot start work on a completed request."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        maintenance_request.status = MaintenanceStatus.IN_PROGRESS
        maintenance_request.started_date = timezone.now()
        maintenance_request.save(update_fields=['status', 'started_date', 'updated_at'])
        
        # Add note about work starting
        maintenance_request.notes = (
            f"{maintenance_request.notes or ''}\n\n"
            f"Work started on {timezone.now().strftime('%Y-%m-%d %H:%M')} by "
            f"{request.user.get_full_name() or request.user.email}."
        ).strip()
        maintenance_request.save(update_fields=['notes'])
        
        return Response(
            {"status": "Work started on maintenance request"},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        """
        Mark a maintenance request as completed.
        Expected payload: {"notes": "<completion notes>", "cost": 0.00}
        """
        maintenance_request = self.get_object()
        
        # Only the assigned staff or admin can complete the request
        if (maintenance_request.assigned_to != request.user and 
            not request.user.is_staff and 
            not request.user.groups.filter(name__in=['Admin', 'Maintenance Manager']).exists()):
            raise PermissionDenied("You don't have permission to complete this request.")
        
        if maintenance_request.status == MaintenanceStatus.COMPLETED:
            return Response(
                {"detail": "This request is already marked as completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the maintenance request
        completion_notes = request.data.get('notes', '')
        cost = request.data.get('cost')
        
        maintenance_request.status = MaintenanceStatus.COMPLETED
        maintenance_request.completed_date = timezone.now()
        
        if cost is not None:
            try:
                maintenance_request.cost = float(cost)
            except (ValueError, TypeError):
                return Response(
                    {"cost": ["Must be a valid number."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        maintenance_request.save(
            update_fields=['status', 'completed_date', 'cost', 'updated_at']
        )
        
        # Add completion notes
        maintenance_request.notes = (
            f"{maintenance_request.notes or ''}\n\n"
            f"Work completed on {timezone.now().strftime('%Y-%m-%d %H:%M')} by "
            f"{request.user.get_full_name() or request.user.email}.\n"
            f"Cost: {maintenance_request.cost or 'N/A'}\n"
            f"Notes: {completion_notes}"
        ).strip()
        maintenance_request.save(update_fields=['notes'])
        
        # TODO: Send notification to the requester and property owner
        
        return Response(
            {"status": "Maintenance request marked as completed"},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Cancel a maintenance request.
        Expected payload: {"reason": "<cancellation reason>"}
        """
        maintenance_request = self.get_object()
        
        # Only the requester, property owner/manager, or admin can cancel
        if (maintenance_request.submitted_by != request.user and 
            maintenance_request.property.owner != request.user and 
            not request.user in maintenance_request.property.managers.all() and 
            not request.user.is_staff):
            raise PermissionDenied("You don't have permission to cancel this request.")
        
        if maintenance_request.status == MaintenanceStatus.COMPLETED:
            return Response(
                {"detail": "Cannot cancel a completed request."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'No reason provided')
        
        # Update the maintenance request
        maintenance_request.status = MaintenanceStatus.CANCELLED
        maintenance_request.completed_date = timezone.now()
        maintenance_request.save(
            update_fields=['status', 'completed_date', 'updated_at']
        )
        
        # Add cancellation note
        maintenance_request.notes = (
            f"{maintenance_request.notes or ''}\n\n"
            f"Request cancelled on {timezone.now().strftime('%Y-%m-%d %H:%M')} by "
            f"{request.user.get_full_name() or request.user.email}.\n"
            f"Reason: {reason}"
        ).strip()
        maintenance_request.save(update_fields=['notes'])
        
        # TODO: Send notification to relevant parties
        
        return Response(
            {"status": "Maintenance request has been cancelled"},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a maintenance request as completed."""
        maintenance_request = self.get_object()
        
        # Only the assigned staff or admin can complete the request
        if not (request.user.is_staff or maintenance_request.assigned_to == request.user):
            raise PermissionDenied("You don't have permission to complete this request.")
            
        cost = request.data.get('cost')
        notes = request.data.get('notes', '')
        
        maintenance_request.status = 'COMPLETED'
        maintenance_request.completed_date = timezone.now()
        if cost is not None:
            maintenance_request.cost = cost
        if notes:
            maintenance_request.notes = notes
            
        maintenance_request.save(
            update_fields=['status', 'completed_date', 'cost', 'notes', 'updated_at']
        )
        
        # TODO: Send notification to property owner/manager
        
        return Response(
            {"detail": "Maintenance request marked as completed."},
            status=status.HTTP_200_OK
        )


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing rental payments."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user role and permissions."""
        queryset = Payment.objects.all()
        user = self.request.user
        
        # Non-admin users can only see payments for their leases or properties they manage
        if not user.is_staff:
            queryset = queryset.filter(
                Q(lease__tenant=user) |
                Q(lease__property__owner=user) |
                Q(lease__property__managers=user)
            ).distinct()
            
        # Filter by lease if specified
        lease_id = self.request.query_params.get('lease')
        if lease_id:
            queryset = queryset.filter(lease_id=lease_id)
            
        # Filter by date range if specified
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
            
        return queryset.select_related('lease__property', 'received_by')
    
    def perform_create(self, serializer):
        """Set the received_by field to the current user."""
        serializer.save(received_by=self.request.user)
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
