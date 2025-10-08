"""
Serializers for Ghana-specific construction features.
"""
from rest_framework import serializers
from .models import EcoFeature, GhanaRegion, GhanaPricing


class EcoFeatureSerializer(serializers.ModelSerializer):
    """Serializer for eco-friendly features available in Ghana."""
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    
    class Meta:
        model = EcoFeature
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'icon', 'is_available', 'requires_specialist',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class GhanaRegionSerializer(serializers.ModelSerializer):
    """Serializer for Ghana regions with cost multipliers."""
    name_display = serializers.CharField(
        source='get_name_display',
        read_only=True
    )
    
    class Meta:
        model = GhanaRegion
        fields = [
            'id', 'name', 'name_display', 'capital', 'cost_multiplier',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class GhanaPricingSerializer(serializers.ModelSerializer):
    """Serializer for regional pricing variations in Ghana."""
    region_details = GhanaRegionSerializer(source='region', read_only=True)
    eco_feature_details = EcoFeatureSerializer(source='eco_feature', read_only=True)
    currency_display = serializers.CharField(
        source='get_currency_display',
        read_only=True
    )
    adjusted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = GhanaPricing
        fields = [
            'id', 'region', 'region_details', 'eco_feature', 'eco_feature_details',
            'base_price', 'currency', 'currency_display', 'adjusted_price',
            'is_active', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'adjusted_price', 'created_at', 'updated_at')
    
    def get_adjusted_price(self, obj):
        """Get the price adjusted by the region's cost multiplier."""
        return obj.get_adjusted_price()