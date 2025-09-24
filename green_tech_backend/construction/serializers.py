from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from accounts.serializers import UserSerializer
from properties.serializers import PropertySerializer
from construction.ghana.serializers import EcoFeatureSerializer
from .models import (
    ConstructionRequest, ConstructionMilestone, 
    ConstructionDocument, Project, ProjectStatus,
    ConstructionRequestEcoFeature, ConstructionRequestStep
)


class ConstructionMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for construction milestones."""
    class Meta:
        model = ConstructionMilestone
        fields = [
            'id', 'title', 'description', 'due_date', 
            'completed_date', 'is_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class ConstructionDocumentSerializer(serializers.ModelSerializer):
    """Serializer for construction documents."""
    document_type_display = serializers.CharField(
        source='get_document_type_display', 
        read_only=True
    )
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ConstructionDocument
        fields = [
            'id', 'title', 'description', 'document_type', 
            'document_type_display', 'file', 'file_url', 'uploaded_by', 
            'uploaded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at', 'created_at', 'updated_at')
    
    def get_file_url(self, obj):
        """Get the absolute URL for the file."""
        if obj.file:
            return self.context['request'].build_absolute_uri(obj.file.url)
        return None


class ConstructionRequestEcoFeatureSerializer(serializers.ModelSerializer):
    """Serializer for eco-features selected in a construction request."""
    eco_feature_details = EcoFeatureSerializer(source='eco_feature', read_only=True)
    
    class Meta:
        model = ConstructionRequestEcoFeature
        fields = [
            'id', 'eco_feature', 'eco_feature_details', 'quantity', 
            'customizations', 'estimated_cost', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'estimated_cost')


class ConstructionRequestSerializer(serializers.ModelSerializer):
    """Serializer for construction requests with multi-step support."""
    construction_type_display = serializers.CharField(
        source='get_construction_type_display', 
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    current_step_display = serializers.CharField(
        source='get_current_step_display',
        read_only=True
    )
    selected_eco_features = ConstructionRequestEcoFeatureSerializer(
        many=True, 
        read_only=True,
        source='selected_eco_features.all'
    )
    
    class Meta:
        model = ConstructionRequest
        fields = [
            'id', 'title', 'description', 'construction_type', 'construction_type_display',
            'status', 'status_display', 'current_step', 'current_step_display',
            'is_completed', 'customization_data', 'property', 'address', 'city',
            'region', 'start_date', 'estimated_end_date', 'actual_end_date',
            'budget', 'currency', 'estimated_cost', 'target_energy_rating',
            'target_water_rating', 'target_sustainability_score', 'client',
            'project_manager', 'contractors', 'selected_eco_features',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'estimated_cost')
    
    def validate(self, data):
        """
        Validate the construction request data based on the current step.
        """
        current_step = self.instance.current_step if self.instance else data.get('current_step')
        
        if current_step == ConstructionRequestStep.PROJECT_DETAILS:
            required_fields = ['title', 'description', 'construction_type']
            for field in required_fields:
                if field not in data:
                    raise serializers.ValidationError({field: _('This field is required.')})
        
        elif current_step == ConstructionRequestStep.LOCATION:
            if 'property' not in data and ('address' not in data or 'city' not in data or 'region' not in data):
                raise serializers.ValidationError({
                    'property': _('Either select an existing property or provide address details.')
                })
        
        return data
    
    def update(self, instance, validated_data):
        """Update the construction request instance with the validated data."""
        # Handle step completion
        current_step = validated_data.get('current_step', instance.current_step)
        if current_step != instance.current_step:
            instance.current_step = current_step
            
            # Mark as completed if we've reached the final step
            if current_step == ConstructionRequestStep.REVIEW:
                instance.is_completed = True
        
        return super().update(instance, validated_data)
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    client = UserSerializer(read_only=True)
    project_manager = UserSerializer(read_only=True)
    contractors = UserSerializer(many=True, read_only=True)
    milestones = ConstructionMilestoneSerializer(many=True, read_only=True)
    documents = ConstructionDocumentSerializer(many=True, read_only=True)
    property_data = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = ConstructionRequest
        fields = [
            'id', 'title', 'description', 'construction_type', 
            'construction_type_display', 'status', 'status_display',
            'property', 'property_data', 'address', 'city', 'region',
            'start_date', 'estimated_end_date', 'actual_end_date',
            'budget', 'currency', 'target_energy_rating', 
            'target_water_rating', 'target_sustainability_score',
            'client', 'project_manager', 'contractors',
            'milestones', 'documents', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        """Create a new construction request with the current user as client if not provided."""
        request = self.context.get('request')
        if request and request.user.is_authenticated and 'client' not in validated_data:
            validated_data['client'] = request.user
        return super().create(validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for construction projects with sustainability tracking."""
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'status_display', 
            'construction_request', 'start_date', 'estimated_end_date', 
            'actual_end_date', 'estimated_budget', 'actual_cost', 'currency',
            'energy_efficiency_rating', 'water_efficiency_rating', 
            'sustainability_score', 'co2_emissions_saved', 'water_saved',
            'project_manager', 'site_supervisor', 'contractors', 'location',
            'gps_coordinates', 'region', 'district', 'notes', 'created_at',
            'updated_at', 'created_by', 'duration_days'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'duration_days')
    
    def get_duration_days(self, obj):
        """Calculate the project duration in days."""
        if obj.start_date and obj.actual_end_date:
            return (obj.actual_end_date - obj.start_date).days
        elif obj.start_date and obj.estimated_end_date:
            return (obj.estimated_end_date - obj.start_date).days
        return None
    created_by = UserSerializer(read_only=True)
    project_manager = UserSerializer(read_only=True)
    site_supervisor = UserSerializer(read_only=True)
    contractors = UserSerializer(many=True, read_only=True)
    construction_request = ConstructionRequestSerializer(read_only=True)
    sustainability_score = serializers.ReadOnlyField()
    duration_days = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'status_display',
            'construction_request', 'start_date', 'estimated_end_date',
            'actual_end_date', 'estimated_budget', 'actual_cost', 'currency',
            'energy_efficiency_rating', 'water_efficiency_rating',
            'sustainability_score', 'co2_emissions_saved', 'water_saved',
            'project_manager', 'site_supervisor', 'contractors',
            'location', 'gps_coordinates', 'region', 'district',
            'notes', 'created_by', 'created_at', 'updated_at',
            'duration_days', 'is_active'
        ]
        read_only_fields = (
            'id', 'sustainability_score', 'created_at', 'updated_at',
            'duration_days', 'is_active'
        )
    
    def create(self, validated_data):
        """
        Create a new project.
        Sets the created_by to the current user if not provided.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated and 'created_by' not in validated_data:
            validated_data['created_by'] = request.user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Update a project.
        Recalculates the sustainability score if relevant fields are updated.
        """
        # Fields that affect sustainability score
        sustainability_fields = [
            'energy_efficiency_rating', 'water_efficiency_rating',
            'co2_emissions_saved', 'water_saved'
        ]
        
        # Check if any sustainability-related fields are being updated
        recalculate_score = any(
            field in validated_data 
            for field in sustainability_fields
        )
        
        # Perform the update
        instance = super().update(instance, validated_data)
        
        # Recalculate sustainability score if needed
        if recalculate_score:
            instance.calculate_sustainability_score()
            instance.save(update_fields=['sustainability_score'])
        
        return instance
