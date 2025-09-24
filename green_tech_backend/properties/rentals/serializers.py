"""
Serializers for rental property management.
"""
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

from accounts.serializers import UserSerializer
from properties.serializers import PropertySerializer
from .models import (
    RentalProperty,
    LeaseAgreement,
    MaintenanceRequest,
    Payment,
    LeaseType,
    PaymentFrequency,
    MaintenanceStatus,
    MaintenancePriority
)


class RentalPropertySerializer(serializers.ModelSerializer):
    """Serializer for RentalProperty model."""
    property = PropertySerializer(read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        source='property',
        write_only=True
    )
    
    class Meta:
        model = RentalProperty
        fields = [
            'id', 'property', 'property_id', 'is_available', 'available_from',
            'minimum_lease_months', 'security_deposit', 'maintenance_contact',
            'maintenance_phone', 'special_terms', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate(self, data):
        """Validate rental property data."""
        if data.get('available_from') and data['available_from'] < timezone.now().date():
            raise ValidationError({"available_from": "Available from date cannot be in the past."})
        return data


class LeaseAgreementSerializer(serializers.ModelSerializer):
    """Serializer for LeaseAgreement model."""
    property = serializers.StringRelatedField()
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        source='property',
        write_only=True
    )
    tenant = UserSerializer(read_only=True)
    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='tenant',
        write_only=True
    )
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaseAgreement
        fields = [
            'id', 'property', 'property_id', 'tenant', 'tenant_id', 'lease_type',
            'start_date', 'end_date', 'monthly_rent', 'payment_frequency',
            'security_deposit', 'is_active', 'notes', 'status', 'signed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'status', 'signed_at', 'created_at', 'updated_at')
    
    def get_status(self, obj):
        """Get the status of the lease agreement."""
        return obj.status
    
    def validate(self, data):
        """Validate lease agreement data."""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise ValidationError({"end_date": "End date must be after start date."})
            
        if start_date and start_date < timezone.now().date():
            raise ValidationError({"start_date": "Start date cannot be in the past."})
            
        return data


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for MaintenanceRequest model."""
    property = serializers.StringRelatedField()
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        source='property',
        write_only=True
    )
    submitted_by = UserSerializer(read_only=True)
    submitted_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='submitted_by',
        write_only=True,
        required=False
    )
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(groups__name='Maintenance'),
        source='assigned_to',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'property', 'property_id', 'submitted_by', 'submitted_by_id',
            'assigned_to', 'assigned_to_id', 'title', 'description', 'status',
            'priority', 'requested_date', 'scheduled_date', 'completed_date',
            'cost', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'requested_date', 'created_at', 'updated_at')
    
    def validate(self, data):
        """Validate maintenance request data."""
        scheduled_date = data.get('scheduled_date')
        completed_date = data.get('completed_date')
        status = data.get('status')
        
        if scheduled_date and scheduled_date < timezone.now():
            raise ValidationError({"scheduled_date": "Scheduled date cannot be in the past."})
            
        if completed_date and completed_date > timezone.now():
            raise ValidationError({"completed_date": "Completion date cannot be in the future."})
            
        if status == MaintenanceStatus.COMPLETED and not completed_date:
            data['completed_date'] = timezone.now()
            
        return data


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    lease = serializers.StringRelatedField()
    lease_id = serializers.PrimaryKeyRelatedField(
        queryset=LeaseAgreement.objects.all(),
        source='lease',
        write_only=True
    )
    received_by = UserSerializer(read_only=True)
    received_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='received_by',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'lease', 'lease_id', 'amount', 'payment_date',
            'payment_method', 'reference_number', 'notes', 'received_by',
            'received_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate(self, data):
        """Validate payment data."""
        payment_date = data.get('payment_date')
        
        if payment_date and payment_date > timezone.now().date():
            raise ValidationError({"payment_date": "Payment date cannot be in the future."})
            
        return data


class LeaseAgreementCreateSerializer(LeaseAgreementSerializer):
    """Serializer for creating lease agreements with initial payment."""
    initial_payment = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        write_only=True,
        required=False
    )
    
    class Meta(LeaseAgreementSerializer.Meta):
        fields = LeaseAgreementSerializer.Meta.fields + ['initial_payment']
    
    def create(self, validated_data):
        """Create a new lease agreement with initial payment if provided."""
        initial_payment = validated_data.pop('initial_payment', None)
        lease = super().create(validated_data)
        
        if initial_payment and initial_payment > 0:
            Payment.objects.create(
                lease=lease,
                amount=initial_payment,
                payment_date=timezone.now().date(),
                payment_method='Initial Payment',
                received_by=self.context['request'].user
            )
        
        return lease
