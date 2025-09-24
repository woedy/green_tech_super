"""
Serializers for rental application and tenant screening.
"""
from rest_framework import serializers
from django.utils import timezone
from properties.serializers import PropertySerializer
from ..models.rental_application import (
    RentalApplication, ApplicationDocument, TenantScreening,
    RentalApplicationStatus, ApplicationDocumentType, IncomeType
)


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    """Serializer for application documents."""
    document_type_display = serializers.CharField(
        source='get_document_type_display',
        read_only=True
    )
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationDocument
        fields = [
            'id', 'document_type', 'document_type_display', 'file', 'file_url',
            'file_size', 'file_size_mb', 'original_filename', 'uploaded_at', 'notes'
        ]
        read_only_fields = ['id', 'file_size', 'original_filename', 'uploaded_at']
        extra_kwargs = {
            'file': {'write_only': True}
        }

    def get_file_url(self, obj):
        """Get the full URL of the file."""
        if obj.file and hasattr(obj.file, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_mb(self, obj):
        """Get file size in MB."""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0


class TenantScreeningSerializer(serializers.ModelSerializer):
    """Serializer for tenant screening results."""
    screened_by_name = serializers.SerializerMethodField()
    is_complete = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = TenantScreening
        fields = [
            'id', 'credit_score', 'credit_check_date', 'criminal_background_check',
            'eviction_history', 'eviction_details', 'income_verification',
            'employment_verification', 'previous_landlord_comments', 'risk_score',
            'screening_notes', 'screened_by', 'screened_by_name', 'screened_at',
            'is_complete', 'is_approved', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'screened_by', 'screened_at', 'created_at', 'updated_at']

    def get_screened_by_name(self, obj):
        """Get the full name of the user who performed the screening."""
        if obj.screened_by:
            return obj.screened_by.get_full_name()
        return None

    def validate(self, data):
        """Validate screening data."""
        if 'credit_score' in data and data['credit_score'] is not None:
            if data['credit_score'] < 300 or data['credit_score'] > 850:
                raise serializers.ValidationError({
                    'credit_score': 'Credit score must be between 300 and 850.'
                })
        
        if 'risk_score' in data and data['risk_score'] is not None:
            if data['risk_score'] < 1 or data['risk_score'] > 10:
                raise serializers.ValidationError({
                    'risk_score': 'Risk score must be between 1 and 10.'
                })
        
        return data


class RentalApplicationSerializer(serializers.ModelSerializer):
    """Serializer for rental applications."""
    applicant_id = serializers.IntegerField(source='applicant.id', read_only=True)
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.EmailField(source='applicant.email', read_only=True)
    property = PropertySerializer(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    income_type_display = serializers.CharField(
        source='get_income_type_display',
        read_only=True
    )
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
    screening = TenantScreeningSerializer(read_only=True)
    is_pending_review = serializers.BooleanField(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    can_approve = serializers.SerializerMethodField()
    can_reject = serializers.SerializerMethodField()
    can_withdraw = serializers.SerializerMethodField()

    class Meta:
        model = RentalApplication
        fields = [
            'id', 'property', 'applicant_id', 'applicant_name', 'applicant_email', 'status', 'status_display',
            'move_in_date', 'lease_term_months', 'monthly_income',
            'income_type', 'income_type_display', 'employer_name',
            'employer_phone', 'employer_years', 'has_pets', 'pet_description',
            'has_vehicle', 'vehicle_description', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relation',
            'previous_address', 'previous_landlord_name',
            'previous_landlord_phone', 'reason_for_moving', 'additional_notes',
            'application_date', 'submitted_at', 'reviewed_at', 'reviewed_by',
            'review_notes', 'documents', 'screening', 'is_pending_review',
            'can_edit', 'can_review', 'can_approve', 'can_reject', 'can_withdraw',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'property', 'application_date', 'submitted_at',
            'reviewed_at', 'reviewed_by', 'created_at', 'updated_at'
        ]

    def get_applicant_name(self, obj):
        user = getattr(obj, 'applicant', None)
        if not user:
            return None
        return user.get_full_name() or user.email

    def get_can_edit(self, obj):
        """Check if the current user can edit this application."""
        request = self.context.get('request')
        if not request:
            return False
        
        user = request.user
        return (
            user == obj.applicant and 
            obj.status in [
                RentalApplicationStatus.DRAFT,
                RentalApplicationStatus.SUBMITTED
            ]
        )

    def get_can_review(self, obj):
        """Check if the current user can review this application."""
        request = self.context.get('request')
        if not request:
            return False
        
        user = request.user
        return (
            user.has_perm('rentals.review_rental_application') and
            obj.status in [
                RentalApplicationStatus.SUBMITTED,
                RentalApplicationStatus.UNDER_REVIEW
            ]
        )

    def get_can_approve(self, obj):
        """Check if the current user can approve this application."""
        request = self.context.get('request')
        if not request:
            return False
        
        user = request.user
        return (
            user.has_perm('rentals.approve_rental_application') and
            obj.status in [
                RentalApplicationStatus.SUBMITTED,
                RentalApplicationStatus.UNDER_REVIEW
            ]
        )

    def get_can_reject(self, obj):
        """Check if the current user can reject this application."""
        return self.get_can_approve(obj)

    def get_can_withdraw(self, obj):
        """Check if the current user can withdraw this application."""
        request = self.context.get('request')
        if not request:
            return False
        
        user = request.user
        return (
            user == obj.applicant and
            obj.status in [
                RentalApplicationStatus.DRAFT,
                RentalApplicationStatus.SUBMITTED,
                RentalApplicationStatus.UNDER_REVIEW
            ]
        )

    def validate(self, data):
        """Validate application data."""
        if self.instance and self.instance.status != RentalApplicationStatus.DRAFT:
            # Only allow certain fields to be updated after submission
            allowed_updates = {'status'}
            if set(data.keys()) - allowed_updates:
                raise serializers.ValidationError({
                    'non_field_errors': 'Only certain fields can be updated after submission.'
                })
        
        if 'move_in_date' in data and data.get('move_in_date'):
            if data['move_in_date'] < timezone.now().date():
                raise serializers.ValidationError({
                    'move_in_date': 'Move-in date cannot be in the past.'
                })
        
        if 'monthly_income' in data and data.get('monthly_income') is not None:
            if data['monthly_income'] < 0:
                raise serializers.ValidationError({
                    'monthly_income': 'Monthly income cannot be negative.'
                })
        
        return data

    def create(self, validated_data):
        """Create a new rental application."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['applicant'] = request.user
        
        return super().create(validated_data)


class RentalApplicationActionSerializer(serializers.Serializer):
    """Serializer for rental application actions (approve, reject, etc.)."""
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_notes(self, value):
        """Validate notes field."""
        return value.strip() if value else ''


class RentalApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing rental applications."""
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    property_title = serializers.CharField(
        source='property.title',
        read_only=True
    )
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.EmailField(
        source='applicant.email',
        read_only=True
    )
    has_screening = serializers.BooleanField(
        source='screening.is_complete',
        read_only=True
    )
    screening_approved = serializers.BooleanField(
        source='screening.is_approved',
        read_only=True
    )

    class Meta:
        model = RentalApplication
        fields = [
            'id', 'status', 'status_display', 'property', 'property_title',
            'applicant', 'applicant_name', 'applicant_email', 'move_in_date',
            'monthly_income', 'has_screening', 'screening_approved',
            'application_date', 'submitted_at', 'reviewed_at'
        ]
        read_only = True

    def get_applicant_name(self, obj):
        """Get the applicant's full name or email."""
        return obj.applicant.get_full_name() or obj.applicant.email
