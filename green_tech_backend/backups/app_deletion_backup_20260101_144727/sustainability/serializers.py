from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from properties.serializers import PropertySerializer as BasePropertySerializer
from .models import (
    SustainabilityScore, CertificationStandard, PropertyCertification,
    SustainabilityFeatureImpact, PropertyComparison, CostSavingsEstimate
)
from construction.ghana.serializers import EcoFeatureSerializer


class CertificationLevelSerializer(serializers.Serializer):
    """Serializer for certification level information."""
    level = serializers.ChoiceField(
        choices=[
            ('PLATINUM', 'Platinum'),
            ('GOLD', 'Gold'),
            ('SILVER', 'Silver'),
            ('BRONZE', 'Bronze'),
            (None, 'Uncertified')
        ]
    )
    min_score = serializers.FloatField(min_value=0, max_value=100)
    max_score = serializers.FloatField(min_value=0, max_value=100)
    next_level = serializers.CharField(allow_null=True)
    points_to_next = serializers.FloatField(allow_null=True)
    progress = serializers.FloatField(min_value=0, max_value=100)


class SustainabilityScoreSerializer(serializers.ModelSerializer):
    """
    Serializer for SustainabilityScore model with certification level information.
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    certification_level = serializers.SerializerMethodField()
    certification_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SustainabilityScore
        fields = [
            'id', 'property', 'category', 'category_display', 'score', 'max_possible', 
            'details', 'last_updated', 'certification_level', 'certification_info'
        ]
        read_only_fields = ['last_updated', 'certification_level', 'certification_info']
    
    def get_certification_level(self, obj):
        """Get the certification level for this score if it's an overall score."""
        if obj.category == 'OVERALL':
            return SustainabilityScore.get_certification_level(obj.score)
        return None
    
    def get_certification_info(self, obj):
        """Get detailed certification information."""
        if obj.category != 'OVERALL':
            return None
            
        score = obj.score
        levels = [
            {'level': 'PLATINUM', 'min': 90, 'max': 100},
            {'level': 'GOLD', 'min': 80, 'max': 89.99},
            {'level': 'SILVER', 'min': 65, 'max': 79.99},
            {'level': 'BRONZE', 'min': 50, 'max': 64.99},
            {'level': None, 'min': 0, 'max': 49.99}
        ]
        
        current_level = None
        next_level = None
        
        for i, level in enumerate(levels):
            if level['min'] <= score <= level['max']:
                current_level = level
                if i > 0:
                    next_level = levels[i-1]
                break
        
        if not current_level:
            return None
            
        points_to_next = next_level['min'] - score if next_level and score < next_level['min'] else 0
        progress = min(100, max(0, (score - current_level['min']) / 
                      (current_level['max'] - current_level['min']) * 100)) if current_level['level'] else 0
        
        return {
            'level': current_level['level'],
            'min_score': current_level['min'],
            'max_score': current_level['max'],
            'next_level': next_level['level'] if next_level else None,
            'points_to_next': round(points_to_next, 2) if points_to_next > 0 else None,
            'progress': round(progress, 2)
        }


class CertificationStandardSerializer(serializers.ModelSerializer):
    """Serializer for CertificationStandard model."""
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CertificationStandard
        fields = [
            'id', 'name', 'description', 'issuing_organization', 'logo', 'logo_url',
            'website', 'is_active', 'minimum_score', 'required_categories'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class PropertyCertificationSerializer(serializers.ModelSerializer):
    """Serializer for PropertyCertification model."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    standard_name = serializers.CharField(source='standard.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PropertyCertification
        fields = [
            'id', 'property', 'standard', 'standard_name', 'status', 'status_display',
            'certificate_number', 'issue_date', 'expiry_date', 'verified_by',
            'verification_notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_active']


class SustainabilityFeatureImpactSerializer(serializers.ModelSerializer):
    """Serializer for SustainabilityFeatureImpact model."""
    eco_feature_detail = EcoFeatureSerializer(source='eco_feature', read_only=True)
    
    class Meta:
        model = SustainabilityFeatureImpact
        fields = [
            'id', 'eco_feature', 'eco_feature_detail', 'energy_impact', 'water_impact',
            'materials_impact', 'waste_impact', 'co2_reduction', 'water_savings', 'cost_savings'
        ]


class PropertyComparisonSerializer(serializers.ModelSerializer):
    """Serializer for PropertyComparison model."""
    properties_count = serializers.IntegerField(read_only=True)
    properties = BasePropertySerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyComparison
        fields = [
            'id', 'name', 'description', 'properties', 'properties_count',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'properties_count']
    
    def create(self, validated_data):
        # Set the created_by user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CostSavingsEstimateSerializer(serializers.ModelSerializer):
    """Serializer for CostSavingsEstimate model."""
    eco_feature_detail = EcoFeatureSerializer(source='eco_feature', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True)
    
    class Meta:
        model = CostSavingsEstimate
        fields = [
            'id', 'property', 'property_title', 'eco_feature', 'eco_feature_detail',
            'installation_cost', 'annual_savings', 'payback_period', 'annual_co2_reduction',
            'annual_water_savings', 'is_installed', 'installation_date', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'payback_period']
    
    def validate(self, data):
        """
        Validate that installation date is provided if is_installed is True.
        """
        if data.get('is_installed') and not data.get('installation_date'):
            raise serializers.ValidationError({
                'installation_date': _('Installation date is required when marking as installed.')
            })
        return data


class PropertyWithScoresSerializer(BasePropertySerializer):
    """
    Extended property serializer that includes detailed sustainability scores.
    Provides comprehensive scoring information including certification levels and progress.
    """
    sustainability_scores = SustainabilityScoreSerializer(
        source='sustainability_scores.all',
        many=True,
        read_only=True
    )
    overall_score = serializers.SerializerMethodField()
    certification_level = serializers.SerializerMethodField()
    
    class Meta(BasePropertySerializer.Meta):
        fields = BasePropertySerializer.Meta.fields + [
            'sustainability_scores', 'overall_score', 'certification_level'
        ]
    
    def get_overall_score(self, obj):
        """Get the overall sustainability score if available."""
        try:
            return obj.sustainability_scores.get(category='OVERALL').score
        except SustainabilityScore.DoesNotExist:
            return None
    
    def get_certification_level(self, obj):
        """Get the certification level based on the overall score."""
        try:
            overall_score = obj.sustainability_scores.get(category='OVERALL')
            return SustainabilityScore.get_certification_level(overall_score.score)
        except SustainabilityScore.DoesNotExist:
            return None


class PropertyComparisonDetailSerializer(PropertyComparisonSerializer):
    """
    Detailed serializer for property comparison with full property details and scores.
    """
    properties = PropertyWithScoresSerializer(many=True, read_only=True)
    
    def to_representation(self, instance):
        """
        Add sustainability scores to each property in the comparison.
        """
        data = super().to_representation(instance)
        
        # Get all properties with their sustainability scores in one query
        properties = instance.properties.prefetch_related('sustainability_scores').all()
        
        # Update the properties in the response with their scores
        property_serializer = PropertyWithScoresSerializer(
            properties,
            many=True,
            context=self.context
        )
        
        data['properties'] = property_serializer.data
        return data
