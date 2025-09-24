"""
Serializers for the quote models.
"""
from rest_framework import serializers
from construction.models.quote import (
    Quote, 
    QuoteItem, 
    QuoteChangeLog,
    QuoteStatus
)
from construction.serializers import UserSerializer


class QuoteItemSerializer(serializers.ModelSerializer):
    """Serializer for quote items."""
    total_amount = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = QuoteItem
        fields = [
            'id', 'description', 'quantity', 'unit_price', 
            'tax_rate', 'discount_amount', 'total_amount',
            'metadata', 'created', 'modified'
        ]
        read_only_fields = ['created', 'modified']


class QuoteChangeLogSerializer(serializers.ModelSerializer):
    """Serializer for quote change logs."""
    changed_by = UserSerializer(read_only=True)
    action_display = serializers.CharField(
        source='get_action_display', 
        read_only=True
    )
    
    class Meta:
        model = QuoteChangeLog
        fields = [
            'id', 'action', 'action_display', 'changed_by',
            'changes', 'notes', 'created'
        ]
        read_only_fields = ['created']


class QuoteSerializer(serializers.ModelSerializer):
    """Base serializer for quotes."""
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    created_by = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    item_count = serializers.IntegerField(
        source='items.count', 
        read_only=True
    )
    
    class Meta:
        model = Quote
        fields = [
            'id', 'quote_number', 'version', 'status', 'status_display',
            'construction_request', 'parent_quote', 'valid_until',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'created_by', 'approved_by', 'approved_at', 'item_count',
            'created', 'modified'
        ]
        read_only_fields = [
            'id', 'quote_number', 'version', 'created_by', 'approved_by',
            'approved_at', 'created', 'modified', 'total_amount'
        ]
    
    def validate(self, data):
        """Validate the quote data."""
        # Ensure valid_until is in the future
        if 'valid_until' in data and data['valid_until']:
            from django.utils import timezone
            if data['valid_until'] < timezone.now().date():
                raise serializers.ValidationError({
                    'valid_until': 'Must be a future date.'
                })
        
        # Ensure discount is not greater than subtotal + tax
        if 'discount_amount' in data and 'subtotal' in data:
            if data['discount_amount'] > data['subtotal']:
                raise serializers.ValidationError({
                    'discount_amount': 'Discount cannot be greater than subtotal.'
                })
        
        return data


class QuoteDetailSerializer(QuoteSerializer):
    """Detailed serializer for quotes with nested items and history."""
    items = QuoteItemSerializer(many=True, read_only=True)
    change_logs = QuoteChangeLogSerializer(
        source='change_logs.all', 
        many=True,
        read_only=True
    )
    
    class Meta(QuoteSerializer.Meta):
        fields = QuoteSerializer.Meta.fields + [
            'notes', 'terms_and_conditions', 'items', 'change_logs'
        ]
        read_only_fields = QuoteSerializer.Meta.read_only_fields + [
            'change_logs'
        ]


class QuoteCreateSerializer(QuoteSerializer):
    """Serializer for creating quotes."""
    class Meta(QuoteSerializer.Meta):
        read_only_fields = [
            'id', 'quote_number', 'version', 'created_by', 'approved_by',
            'approved_at', 'created', 'modified', 'total_amount', 'status'
        ]


class QuoteUpdateSerializer(QuoteSerializer):
    """Serializer for updating quotes."""
    class Meta(QuoteSerializer.Meta):
        read_only_fields = [
            'id', 'quote_number', 'version', 'created_by', 'approved_by',
            'approved_at', 'created', 'modified', 'total_amount',
            'construction_request', 'parent_quote'
        ]
    
    def validate_status(self, value):
        """Validate status transitions."""
        instance = self.instance
        
        # Only allow specific status transitions
        if instance and instance.status != value:
            valid_transitions = {
                QuoteStatus.DRAFT: [QuoteStatus.PENDING_APPROVAL],
                QuoteStatus.PENDING_APPROVAL: [QuoteStatus.APPROVED, QuoteStatus.REJECTED],
                QuoteStatus.REJECTED: [QuoteStatus.REVISED],
                QuoteStatus.REVISED: [QuoteStatus.PENDING_APPROVAL],
            }
            
            current_status = instance.status
            if current_status in valid_transitions and value not in valid_transitions[current_status]:
                raise serializers.ValidationError(
                    f"Cannot change status from {current_status} to {value}."
                )
        
        return value


class QuoteItemCreateSerializer(QuoteItemSerializer):
    """Serializer for creating quote items."""
    class Meta(QuoteItemSerializer.Meta):
        read_only_fields = QuoteItemSerializer.Meta.readonly_fields + [
            'total_amount'
        ]


class QuoteItemUpdateSerializer(QuoteItemSerializer):
    """Serializer for updating quote items."""
    class Meta(QuoteItemSerializer.Meta):
        read_only_fields = QuoteItemSerializer.Meta.readonly_fields + [
            'total_amount', 'quote'
        ]
