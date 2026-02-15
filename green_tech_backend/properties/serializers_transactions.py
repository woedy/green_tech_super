"""
Serializers for property transactions (rent/lease/buy requests).
"""
from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from accounts.serializers import UserSerializer
from properties.models import Property
from properties.serializers import PropertyListSerializer
from .models import (
    PropertyTransaction,
    TransactionDocument,
    TransactionNote,
    TransactionStatus,
    TransactionType
)


class TransactionDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = TransactionDocument
        fields = (
            'id',
            'title',
            'document_type',
            'file_url',
            'uploaded_by',
            'uploaded_by_name',
            'notes',
            'created_at'
        )
        read_only_fields = ('id', 'uploaded_by', 'created_at')


class TransactionNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source='author.get_full_name',
        read_only=True
    )

    class Meta:
        model = TransactionNote
        fields = (
            'id',
            'author',
            'author_name',
            'content',
            'is_internal',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'author', 'created_at', 'updated_at')


class PropertyTransactionListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property_ref.title', read_only=True)
    property_slug = serializers.CharField(source='property_ref.slug', read_only=True)
    property_image = serializers.CharField(source='property_ref.primary_image', read_only=True)
    property_location = serializers.SerializerMethodField()
    assigned_agent_name = serializers.CharField(
        source='assigned_agent.get_full_name',
        read_only=True
    )

    class Meta:
        model = PropertyTransaction
        fields = (
            'id',
            'property_ref',
            'property_title',
            'property_slug',
            'property_image',
            'property_location',
            'transaction_type',
            'status',
            'contact_name',
            'contact_email',
            'contact_phone',
            'proposed_price',
            'proposed_rent',
            'lease_duration_months',
            'move_in_date',
            'assigned_agent',
            'assigned_agent_name',
            'created_at',
            'updated_at',
            'submitted_at'
        )
        read_only_fields = (
            'id',
            'property_ref',
            'created_at',
            'updated_at',
            'submitted_at'
        )

    def get_property_location(self, obj):
        return {
            'city': obj.property_ref.city,
            'country': obj.property_ref.country,
            'region': obj.property_ref.region.name if obj.property_ref.region else None
        }


class PropertyTransactionDetailSerializer(serializers.ModelSerializer):
    property_ref = PropertyListSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    assigned_agent = UserSerializer(read_only=True)
    documents = TransactionDocumentSerializer(many=True, read_only=True)
    notes = serializers.SerializerMethodField()
    is_editable = serializers.BooleanField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)

    class Meta:
        model = PropertyTransaction
        fields = (
            'id',
            'property_ref',
            'client',
            'transaction_type',
            'status',
            'contact_name',
            'contact_email',
            'contact_phone',
            'proposed_price',
            'proposed_rent',
            'lease_duration_months',
            'move_in_date',
            'message',
            'budget',
            'financing_required',
            'admin_notes',
            'rejection_reason',
            'assigned_agent',
            'documents',
            'notes',
            'is_editable',
            'can_be_cancelled',
            'created_at',
            'updated_at',
            'submitted_at',
            'reviewed_at',
            'completed_at'
        )
        read_only_fields = (
            'id',
            'client',
            'admin_notes',
            'rejection_reason',
            'assigned_agent',
            'created_at',
            'updated_at',
            'submitted_at',
            'reviewed_at',
            'completed_at'
        )

    def get_notes(self, obj):
        """Filter notes based on user permissions."""
        request = self.context.get('request')
        notes = obj.notes.all()
        
        # Non-staff users can only see non-internal notes
        if request and not request.user.is_staff:
            notes = notes.filter(is_internal=False)
        
        return TransactionNoteSerializer(notes, many=True).data


class PropertyTransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating property transactions."""
    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        source='property_ref',
        write_only=True,
        required=True,
        allow_null=False
    )
    
    class Meta:
        model = PropertyTransaction
        fields = (
            'property',
            'transaction_type',
            'contact_name',
            'contact_email',
            'contact_phone',
            'proposed_price',
            'proposed_rent',
            'lease_duration_months',
            'move_in_date',
            'message',
            'budget',
            'financing_required'
        )

    def validate_property(self, value):
        """Validate that the property exists and is available."""
        if not value:
            raise serializers.ValidationError("Property is required.")
        return value

    def validate(self, attrs):
        transaction_type = attrs.get('transaction_type')
        
        # Ensure property is provided
        if 'property_ref' not in attrs or attrs['property_ref'] is None:
            raise serializers.ValidationError({
                'property': 'Property is required.'
            })
        
        # Validate required fields based on transaction type
        if transaction_type == TransactionType.BUY:
            if not attrs.get('proposed_price') and not attrs.get('budget'):
                raise serializers.ValidationError({
                    'proposed_price': 'Proposed price or budget is required for buy transactions.'
                })
        
        elif transaction_type in [TransactionType.RENT, TransactionType.LEASE]:
            if not attrs.get('lease_duration_months'):
                raise serializers.ValidationError({
                    'lease_duration_months': 'Lease duration is required for rent/lease transactions.'
                })
        
        return attrs

    def create(self, validated_data):
        # Set client from request user
        request = self.context.get('request')
        validated_data['client'] = request.user
        validated_data['status'] = TransactionStatus.DRAFT
        
        return super().create(validated_data)


class PropertyTransactionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating property transactions by clients."""
    
    class Meta:
        model = PropertyTransaction
        fields = (
            'contact_name',
            'contact_email',
            'contact_phone',
            'proposed_price',
            'proposed_rent',
            'lease_duration_months',
            'move_in_date',
            'message',
            'budget',
            'financing_required'
        )

    def validate(self, attrs):
        # Check if transaction is editable
        if not self.instance.is_editable:
            raise serializers.ValidationError(
                'This transaction cannot be edited in its current status.'
            )
        
        return attrs


class PropertyTransactionSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a transaction."""
    pass


class PropertyTransactionAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updates to transactions."""
    
    class Meta:
        model = PropertyTransaction
        fields = (
            'status',
            'admin_notes',
            'rejection_reason',
            'assigned_agent',
            'proposed_price',
            'proposed_rent',
            'lease_duration_months'
        )

    def validate(self, attrs):
        status = attrs.get('status', self.instance.status if self.instance else None)
        
        # Require rejection reason when rejecting
        if status == TransactionStatus.REJECTED:
            if not attrs.get('rejection_reason') and not (
                self.instance and self.instance.rejection_reason
            ):
                raise serializers.ValidationError({
                    'rejection_reason': 'Rejection reason is required when rejecting a transaction.'
                })
        
        return attrs

    def update(self, instance, validated_data):
        status = validated_data.get('status')
        
        # Update timestamps based on status changes
        if status and status != instance.status:
            if status == TransactionStatus.UNDER_REVIEW:
                instance.reviewed_at = timezone.now()
            elif status == TransactionStatus.COMPLETED:
                instance.completed_at = timezone.now()
        
        return super().update(instance, validated_data)
