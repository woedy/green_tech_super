from rest_framework import serializers
from django.contrib.auth import get_user_model
from properties.models import Property, Project, EcoFeature
from .models import (
    CaseStudy, CaseStudyImage, EducationalContent,
    ExpertProfile, ConsultationSlot, ConsultationBooking,
    ProjectShowcase, ProjectGalleryImage
)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'profile_picture')

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ('id', 'name', 'address', 'city', 'region', 'property_type')

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'status', 'start_date', 'completion_date')

class EcoFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcoFeature
        fields = ('id', 'name', 'description', 'category', 'icon')

class CaseStudyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseStudyImage
        fields = ('id', 'image', 'caption', 'is_primary', 'created_at')
        read_only_fields = ('created_at',)

class CaseStudySerializer(serializers.ModelSerializer):
    property_data = PropertySerializer(source='property', read_only=True)
    project_data = ProjectSerializer(source='project', read_only=True)
    images = CaseStudyImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = CaseStudy
        fields = (
            'id', 'title', 'slug', 'project', 'project_data', 'property', 'property_data',
            'location', 'project_type', 'overview', 'challenge', 'solution', 'results',
            'energy_savings', 'water_savings', 'cost_savings', 'co2_reduction',
            'featured', 'published', 'created_at', 'updated_at', 'images'
        )
        read_only_fields = ('slug', 'created_at', 'updated_at')
        extra_kwargs = {
            'project': {'write_only': True, 'required': False},
            'property': {'write_only': True, 'required': False}
        }

class EducationalContentSerializer(serializers.ModelSerializer):
    author_data = UserSerializer(source='author', read_only=True)
    
    class Meta:
        model = EducationalContent
        fields = (
            'id', 'title', 'slug', 'content_type', 'category', 'author', 'author_data',
            'featured_image', 'summary', 'content', 'external_url', 'duration_minutes',
            'published', 'published_date', 'created_at', 'updated_at'
        )
        read_only_fields = ('slug', 'author', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        # Set the current user as the author if not provided
        if 'author' not in validated_data:
            validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class ExpertProfileSerializer(serializers.ModelSerializer):
    user_data = UserSerializer(source='user', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpertProfile
        fields = (
            'id', 'user', 'user_data', 'full_name', 'bio', 'expertise', 'years_experience',
            'qualifications', 'languages', 'hourly_rate', 'available_for_consultation',
            'is_featured', 'profile_picture', 'linkedin_url', 'website_url',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()

class ConsultationSlotSerializer(serializers.ModelSerializer):
    expert_data = ExpertProfileSerializer(source='expert', read_only=True)
    
    class Meta:
        model = ConsultationSlot
        fields = ('id', 'expert', 'expert_data', 'start_time', 'end_time', 'is_booked', 'created_at', 'updated_at')
        read_only_fields = ('is_booked', 'created_at', 'updated_at')

class ConsultationBookingSerializer(serializers.ModelSerializer):
    user_data = UserSerializer(source='user', read_only=True)
    expert_data = ExpertProfileSerializer(source='expert', read_only=True)
    slot_data = ConsultationSlotSerializer(source='slot', read_only=True)
    project_data = ProjectSerializer(source='project', read_only=True)
    
    class Meta:
        model = ConsultationBooking
        fields = (
            'id', 'user', 'user_data', 'expert', 'expert_data', 'slot', 'slot_data',
            'project', 'project_data', 'topic', 'notes', 'status', 'meeting_link',
            'created_at', 'updated_at'
        )
        read_only_fields = ('user', 'status', 'created_at', 'updated_at')
    
    def validate(self, data):
        # Ensure the slot is available
        if 'slot' in data and data['slot'].is_booked:
            raise serializers.ValidationError("This time slot is already booked.")
        
        # Set the current user if not provided
        if 'user' not in data:
            data['user'] = self.context['request'].user
            
        # Set the expert from the slot if not provided
        if 'expert' not in data and 'slot' in data:
            data['expert'] = data['slot'].expert
            
        return data

class ProjectGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectGalleryImage
        fields = ('id', 'image', 'caption', 'is_primary', 'order', 'created_at')
        read_only_fields = ('created_at',)

class ProjectShowcaseSerializer(serializers.ModelSerializer):
    project_data = ProjectSerializer(source='project', read_only=True)
    sustainability_features_data = EcoFeatureSerializer(
        source='sustainability_features', 
        many=True, 
        read_only=True
    )
    gallery_images = ProjectGalleryImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProjectShowcase
        fields = (
            'id', 'project', 'project_data', 'title', 'slug', 'description',
            'featured', 'featured_order', 'sustainability_features',
            'sustainability_features_data', 'is_published', 'created_at',
            'updated_at', 'gallery_images'
        )
        read_only_fields = ('slug', 'created_at', 'updated_at')
        extra_kwargs = {
            'sustainability_features': {'write_only': True}
        }

class ProjectShowcaseDetailSerializer(ProjectShowcaseSerializer):
    """
    Extended serializer for project showcase detail view with additional related data
    """
    case_study = CaseStudySerializer(source='project.case_study', read_only=True)
    
    class Meta:
        model = ProjectShowcase
        fields = ProjectShowcaseSerializer.Meta.fields + ('case_study',)
        read_only_fields = ProjectShowcaseSerializer.Meta.read_only_fields
        extra_kwargs = ProjectShowcaseSerializer.Meta.extra_kwargs
