"""
Views for property transactions (rent/lease/buy requests).
"""
from __future__ import annotations

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    PropertyTransaction,
    TransactionDocument,
    TransactionNote,
    TransactionStatus
)
from .serializers_transactions import (
    PropertyTransactionListSerializer,
    PropertyTransactionDetailSerializer,
    PropertyTransactionCreateSerializer,
    PropertyTransactionUpdateSerializer,
    PropertyTransactionSubmitSerializer,
    TransactionDocumentSerializer,
    TransactionNoteSerializer
)


class PropertyTransactionFilter(FilterSet):
    transaction_type = CharFilter(field_name='transaction_type', lookup_expr='iexact')
    status = CharFilter(field_name='status', lookup_expr='iexact')

    class Meta:
        model = PropertyTransaction
        fields = ()


class PropertyTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for property transactions (rent/lease/buy requests).
    Clients can create and manage their own transaction requests.
    """
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter)
    filterset_class = PropertyTransactionFilter
    ordering_fields = ('created_at', 'updated_at', 'submitted_at')
    ordering = ('-created_at',)
    search_fields = ('property_ref__title', 'contact_name', 'contact_email')

    def get_queryset(self):
        """Filter transactions based on user role."""
        user = self.request.user
        qs = PropertyTransaction.objects.select_related(
            'property_ref',
            'property_ref__region',
            'client',
            'assigned_agent'
        ).prefetch_related('documents', 'notes')

        # Staff can see all transactions
        if user.is_staff or user.is_superuser:
            return qs

        # Regular users can only see their own transactions
        return qs.filter(client=user)
    
    @action(detail=False, methods=['get'], url_path='check-property/(?P<property_id>[^/.]+)')
    def check_property(self, request, property_id=None):
        """
        Check if the current user has any active transactions for a specific property.
        Returns the most recent active transaction if exists.
        """
        active_statuses = [
            TransactionStatus.DRAFT,
            TransactionStatus.SUBMITTED,
            TransactionStatus.UNDER_REVIEW,
            TransactionStatus.APPROVED,
            TransactionStatus.NEGOTIATING,
            TransactionStatus.CONTRACT_PENDING,
            TransactionStatus.CONTRACT_SIGNED,
            TransactionStatus.PAYMENT_PENDING,
        ]
        
        transaction = PropertyTransaction.objects.filter(
            client=request.user,
            property_ref_id=property_id,
            status__in=active_statuses
        ).select_related(
            'property_ref',
            'property_ref__region'
        ).order_by('-created_at').first()
        
        if transaction:
            serializer = PropertyTransactionListSerializer(transaction, context={'request': request})
            return Response({
                'has_active_transaction': True,
                'transaction': serializer.data
            })
        
        return Response({
            'has_active_transaction': False,
            'transaction': None
        })

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyTransactionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyTransactionUpdateSerializer
        elif self.action == 'retrieve':
            return PropertyTransactionDetailSerializer
        return PropertyTransactionListSerializer

    def perform_create(self, serializer):
        """Create a new transaction."""
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        """Override create to return detailed response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detailed serializer response
        instance = serializer.instance
        detail_serializer = PropertyTransactionDetailSerializer(
            instance,
            context={'request': request}
        )
        headers = self.get_success_headers(detail_serializer.data)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """
        Submit a transaction for review.
        Changes status from DRAFT to SUBMITTED.
        """
        transaction = self.get_object()

        # Check if user owns this transaction
        if transaction.client != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to submit this transaction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if transaction is in draft status
        if transaction.status != TransactionStatus.DRAFT:
            return Response(
                {'detail': 'Only draft transactions can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status and timestamp
        transaction.status = TransactionStatus.SUBMITTED
        transaction.submitted_at = timezone.now()
        transaction.save(update_fields=['status', 'submitted_at', 'updated_at'])

        # TODO: Send notification to admins/agents

        serializer = PropertyTransactionDetailSerializer(
            transaction,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Cancel a transaction.
        """
        transaction = self.get_object()

        # Check if user owns this transaction
        if transaction.client != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to cancel this transaction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if transaction can be cancelled
        if not transaction.can_be_cancelled:
            return Response(
                {'detail': 'This transaction cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status
        transaction.status = TransactionStatus.CANCELLED
        transaction.save(update_fields=['status', 'updated_at'])

        # Add cancellation note
        TransactionNote.objects.create(
            transaction=transaction,
            author=request.user,
            content=f"Transaction cancelled by {request.user.get_full_name() or request.user.email}",
            is_internal=False
        )

        # TODO: Send notification

        serializer = PropertyTransactionDetailSerializer(
            transaction,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='documents')
    def documents(self, request, pk=None):
        """Get all documents for a transaction."""
        transaction = self.get_object()
        documents = transaction.documents.all()
        serializer = TransactionDocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='documents')
    def upload_document(self, request, pk=None):
        """Upload a document for a transaction."""
        transaction = self.get_object()

        # Check permissions
        if transaction.client != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to upload documents for this transaction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TransactionDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                transaction=transaction,
                uploaded_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='notes')
    def notes(self, request, pk=None):
        """Get all notes for a transaction."""
        transaction = self.get_object()
        notes = transaction.notes.all()

        # Filter internal notes for non-staff users
        if not request.user.is_staff:
            notes = notes.filter(is_internal=False)

        serializer = TransactionNoteSerializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='notes')
    def add_note(self, request, pk=None):
        """Add a note to a transaction."""
        transaction = self.get_object()

        # Check permissions
        if transaction.client != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to add notes to this transaction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TransactionNoteSerializer(data=request.data)
        if serializer.is_valid():
            # Only staff can create internal notes
            is_internal = serializer.validated_data.get('is_internal', False)
            if is_internal and not request.user.is_staff:
                return Response(
                    {'detail': 'Only staff can create internal notes.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer.save(
                transaction=transaction,
                author=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
