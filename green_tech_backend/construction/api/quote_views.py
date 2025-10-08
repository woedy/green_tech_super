"""
API views for managing construction quotes.
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied

from django.db import transaction
from django.shortcuts import get_object_or_404

from construction.models.quote import (
    Quote, 
    QuoteItem, 
    QuoteChangeLog,
    QuoteStatus
)
from construction.serializers.quote_serializers import (
    QuoteSerializer,
    QuoteDetailSerializer,
    QuoteItemSerializer,
    QuoteChangeLogSerializer
)
from construction.permissions import (
    IsQuoteOwnerOrStaff,
    IsQuoteItemOwnerOrStaff
)


class QuoteViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    API endpoint for managing construction quotes.
    """
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated, IsQuoteOwnerOrStaff]
    
    def get_queryset(self):
        """Return quotes for the current user or all quotes for staff."""
        if self.request.user.is_staff:
            return Quote.objects.all().select_related(
                'construction_request', 'created_by', 'approved_by'
            )
        return Quote.objects.filter(
            construction_request__client=self.request.user
        ).select_related('construction_request', 'created_by', 'approved_by')
    
    def get_serializer_class(self):
        """Use a different serializer for detail view."""
        if self.action == 'retrieve':
            return QuoteDetailSerializer
        return QuoteSerializer
    
    def perform_create(self, serializer):
        """Set the created_by user and log the creation."""
        quote = serializer.save(created_by=self.request.user)
        
        # Log the creation
        QuoteChangeLog.log_action(
            quote=quote,
            action=QuoteChangeLog.ACTION_CREATE,
            changed_by=self.request.user,
            notes='Quote created.'
        )
    
    def perform_update(self, serializer):
        """Log updates to the quote."""
        old_instance = self.get_object()
        new_instance = serializer.save()
        
        # Log the update
        changes = {}
        for field in ['status', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount']:
            old_value = getattr(old_instance, field)
            new_value = getattr(new_instance, field)
            if old_value != new_value:
                changes[field] = {'from': old_value, 'to': new_value}
        
        QuoteChangeLog.log_action(
            quote=new_instance,
            action=QuoteChangeLog.ACTION_UPDATE,
            changed_by=self.request.user,
            changes=changes,
            notes='Quote updated.'
        )
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a quote for approval."""
        quote = self.get_object()
        
        # Check permissions
        if quote.created_by != request.user and not request.user.is_staff:
            raise PermissionDenied("You don't have permission to submit this quote.")
        
        try:
            with transaction.atomic():
                quote.submit_for_approval()
                
                # Log the submission
                QuoteChangeLog.log_action(
                    quote=quote,
                    action=QuoteChangeLog.ACTION_SUBMIT,
                    changed_by=request.user,
                    notes=request.data.get('notes', '')
                )
                
                return Response(
                    {'status': 'Quote submitted for approval'},
                    status=status.HTTP_200_OK
                )
                
        except ValueError as e:
            raise ValidationError({'error': str(e)})
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a quote (staff only)."""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can approve quotes.")
        
        quote = self.get_object()
        
        try:
            with transaction.atomic():
                quote.approve(approved_by=request.user)
                
                # Log the approval
                QuoteChangeLog.log_action(
                    quote=quote,
                    action=QuoteChangeLog.ACTION_APPROVE,
                    changed_by=request.user,
                    notes=request.data.get('notes', '')
                )
                
                return Response(
                    {'status': 'Quote approved'},
                    status=status.HTTP_200_OK
                )
                
        except ValueError as e:
            raise ValidationError({'error': str(e)})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a quote (staff only)."""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can reject quotes.")
        
        quote = self.get_object()
        rejection_reason = request.data.get('rejection_reason', '')
        
        if not rejection_reason:
            raise ValidationError({'rejection_reason': 'This field is required.'})
        
        try:
            with transaction.atomic():
                quote.reject(rejection_reason=rejection_reason)
                
                # Log the rejection
                QuoteChangeLog.log_action(
                    quote=quote,
                    action=QuoteChangeLog.ACTION_REJECT,
                    changed_by=request.user,
                    notes=f"Rejection reason: {rejection_reason}"
                )
                
                return Response(
                    {'status': 'Quote rejected'},
                    status=status.HTTP_200_OK
                )
                
        except ValueError as e:
            raise ValidationError({'error': str(e)})
    
    @action(detail=True, methods=['post'])
    def create_revision(self, request, pk=None):
        """Create a new revision of this quote."""
        quote = self.get_object()
        change_reason = request.data.get('change_reason', '')
        
        try:
            with transaction.atomic():
                new_quote = quote.create_revision(
                    changed_by=request.user,
                    change_reason=change_reason
                )
                
                # Log the revision
                QuoteChangeLog.log_action(
                    quote=new_quote,
                    action=QuoteChangeLog.ACTION_REVISE,
                    changed_by=request.user,
                    notes=f"Revision created. {change_reason}"
                )
                
                serializer = self.get_serializer(new_quote)
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )
                
        except ValueError as e:
            raise ValidationError({'error': str(e)})
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get the change history for this quote."""
        quote = self.get_object()
        logs = quote.change_logs.all().select_related('changed_by')
        serializer = QuoteChangeLogSerializer(logs, many=True)
        return Response(serializer.data)


class QuoteItemViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    API endpoint for managing quote items.
    """
    serializer_class = QuoteItemSerializer
    permission_classes = [IsAuthenticated, IsQuoteItemOwnerOrStaff]
    
    def get_queryset(self):
        """Return quote items for the current user or all for staff."""
        quote_id = self.kwargs.get('quote_pk')
        quote = get_object_or_404(Quote, pk=quote_id)
        
        # Check permissions
        if not (quote.created_by == self.request.user or self.request.user.is_staff):
            raise PermissionDenied("You don't have permission to view these quote items.")
        
        return QuoteItem.objects.filter(quote=quote).select_related('quote')
    
    def perform_create(self, serializer):
        """Set the quote and validate permissions."""
        quote_id = self.kwargs.get('quote_pk')
        quote = get_object_or_404(Quote, pk=quote_id)
        
        # Check if the quote can be modified
        if quote.status != QuoteStatus.DRAFT:
            raise ValidationError("Can only add items to draft quotes.")
        
        # Check permissions
        if quote.created_by != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You don't have permission to add items to this quote.")
        
        serializer.save(quote=quote)
        
        # Log the addition
        QuoteChangeLog.log_action(
            quote=quote,
            action=QuoteChangeLog.ACTION_UPDATE,
            changed_by=self.request.user,
            changes={'added_item': serializer.data},
            notes='Item added to quote.'
        )
    
    def perform_update(self, serializer):
        """Log updates to quote items."""
        instance = self.get_object()
        old_data = QuoteItemSerializer(instance).data
        
        # Check if the quote can be modified
        if instance.quote.status != QuoteStatus.DRAFT:
            raise ValidationError("Can only modify items in draft quotes.")
        
        new_instance = serializer.save()
        
        # Log the update
        changes = {}
        for field in ['description', 'quantity', 'unit_price', 'tax_rate', 'discount_amount']:
            old_value = getattr(instance, field)
            new_value = getattr(new_instance, field)
            if old_value != new_value:
                changes[field] = {'from': old_value, 'to': new_value}
        
        QuoteChangeLog.log_action(
            quote=new_instance.quote,
            action=QuoteChangeLog.ACTION_UPDATE,
            changed_by=self.request.user,
            changes={'updated_item': changes},
            notes='Quote item updated.'
        )
    
    def perform_destroy(self, instance):
        """Log deletion of quote items."""
        # Check if the quote can be modified
        if instance.quote.status != QuoteStatus.DRAFT:
            raise ValidationError("Can only delete items from draft quotes.")
        
        quote = instance.quote
        item_data = QuoteItemSerializer(instance).data
        
        instance.delete()
        
        # Log the deletion
        QuoteChangeLog.log_action(
            quote=quote,
            action=QuoteChangeLog.ACTION_UPDATE,
            changed_by=self.request.user,
            changes={'removed_item': item_data},
            notes='Item removed from quote.'
        )
