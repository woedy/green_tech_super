"""
Admin views for property transactions.
"""
from __future__ import annotations

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import PropertyTransaction, TransactionStatus
from .serializers_transactions import (
    PropertyTransactionListSerializer,
    PropertyTransactionDetailSerializer,
    PropertyTransactionAdminUpdateSerializer,
    TransactionNoteSerializer
)


class PropertyTransactionAdminFilter(FilterSet):
    transaction_type = CharFilter(field_name='transaction_type', lookup_expr='iexact')
    status = CharFilter(field_name='status', lookup_expr='iexact')
    assigned_agent = CharFilter(field_name='assigned_agent__id')

    class Meta:
        model = PropertyTransaction
        fields = ()


class PropertyTransactionAdminViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing property transactions.
    """
    permission_classes = (IsAdminUser,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter)
    filterset_class = PropertyTransactionAdminFilter
    ordering_fields = ('created_at', 'updated_at', 'submitted_at', 'status')
    ordering = ('-created_at',)
    search_fields = (
        'property_ref__title',
        'contact_name',
        'contact_email',
        'client__email',
        'client__first_name',
        'client__last_name'
    )

    def get_queryset(self):
        """Get all transactions for admin."""
        return PropertyTransaction.objects.select_related(
            'property_ref',
            'property_ref__region',
            'client',
            'assigned_agent'
        ).prefetch_related('documents', 'notes')

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return PropertyTransactionAdminUpdateSerializer
        elif self.action == 'retrieve':
            return PropertyTransactionDetailSerializer
        return PropertyTransactionListSerializer

    @action(detail=True, methods=['post'], url_path='assign-agent')
    def assign_agent(self, request, pk=None):
        """
        Assign an agent to a transaction.
        """
        transaction = self.get_object()
        agent_id = request.data.get('agent_id')

        if not agent_id:
            return Response(
                {'detail': 'agent_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from accounts.models import User
        try:
            agent = User.objects.get(id=agent_id)
            if not (agent.is_staff or agent.groups.filter(name='Agent').exists()):
                return Response(
                    {'detail': 'User must be a staff member or agent.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response(
                {'detail': 'Agent not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        transaction.assigned_agent = agent
        transaction.save(update_fields=['assigned_agent', 'updated_at'])

        # Add note about assignment
        from .models_transactions import TransactionNote
        TransactionNote.objects.create(
            transaction=transaction,
            author=request.user,
            content=f"Transaction assigned to {agent.get_full_name() or agent.email}",
            is_internal=True
        )

        # TODO: Send notification to agent

        serializer = PropertyTransactionDetailSerializer(
            transaction,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """
        Approve a transaction.
        """
        transaction = self.get_object()

        if transaction.status not in [TransactionStatus.SUBMITTED, TransactionStatus.UNDER_REVIEW]:
            return Response(
                {'detail': 'Only submitted or under review transactions can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.status = TransactionStatus.APPROVED
        transaction.reviewed_at = timezone.now()
        transaction.save(update_fields=['status', 'reviewed_at', 'updated_at'])

        # Add approval note
        from .models_transactions import TransactionNote
        TransactionNote.objects.create(
            transaction=transaction,
            author=request.user,
            content=f"Transaction approved by {request.user.get_full_name() or request.user.email}",
            is_internal=False
        )

        # TODO: Send notification to client

        serializer = PropertyTransactionDetailSerializer(
            transaction,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """
        Reject a transaction.
        """
        transaction = self.get_object()
        reason = request.data.get('reason', '')

        if not reason:
            return Response(
                {'detail': 'Rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if transaction.status not in [TransactionStatus.SUBMITTED, TransactionStatus.UNDER_REVIEW]:
            return Response(
                {'detail': 'Only submitted or under review transactions can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.status = TransactionStatus.REJECTED
        transaction.rejection_reason = reason
        transaction.reviewed_at = timezone.now()
        transaction.save(update_fields=['status', 'rejection_reason', 'reviewed_at', 'updated_at'])

        # Add rejection note
        from .models_transactions import TransactionNote
        TransactionNote.objects.create(
            transaction=transaction,
            author=request.user,
            content=f"Transaction rejected by {request.user.get_full_name() or request.user.email}. Reason: {reason}",
            is_internal=False
        )

        # TODO: Send notification to client

        serializer = PropertyTransactionDetailSerializer(
            transaction,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='mark-completed')
    def mark_completed(self, request, pk=None):
        """
        Mark a transaction as completed.
        """
        transaction = self.get_object()

        if transaction.status == TransactionStatus.COMPLETED:
            return Response(
                {'detail': 'Transaction is already completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.status = TransactionStatus.COMPLETED
        transaction.completed_at = timezone.now()
        transaction.save(update_fields=['status', 'completed_at', 'updated_at'])

        # Add completion note
        from .models_transactions import TransactionNote
        TransactionNote.objects.create(
            transaction=transaction,
            author=request.user,
            content=f"Transaction marked as completed by {request.user.get_full_name() or request.user.email}",
            is_internal=False
        )

        # TODO: Send notification to client

        serializer = PropertyTransactionDetailSerializer(
            transaction,
            context={'request': request}
        )
        return Response(serializer.data)
