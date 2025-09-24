from rest_framework import serializers
from .models import Property, PropertyImage, PropertyFeature
from construction.ghana.models import GhanaRegion
from construction.models import EcoFeature


class PropertyFeatureSerializer(serializers.ModelSerializer):
    """Serializer for PropertyFeature model."""
    class Meta:
        model = PropertyFeature
        fields = ['id', 'name', 'description', 'is_eco_friendly']
        read_only_fields = ['id']


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for PropertyImage model."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'image_url', 'caption', 'is_primary', 'order']
        read_only_fields = ['id', 'image_url']
        extra_kwargs = {
            'image': {'write_only': True}
        }
    
    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None


class PropertySerializer(serializers.ModelSerializer):
    """Main serializer for Property model."""
    images = PropertyImageSerializer(many=True, read_only=True)
    features = PropertyFeatureSerializer(many=True, required=False)
    region_name = serializers.SerializerMethodField()
    eco_features = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=EcoFeature.objects.all(),
        required=False
    )
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'property_type', 'status',
            'price', 'currency', 'area', 'bedrooms', 'bathrooms', 'year_built',
            'address', 'city', 'region', 'region_name', 'postal_code',
            'latitude', 'longitude', 'energy_efficiency_rating',
            'water_efficiency_rating', 'sustainability_score',
            'created_at', 'updated_at', 'published_at',
            'images', 'features', 'eco_features'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'published_at', 'created_by']
    
    def get_region_name(self, obj):
        try:
            return GhanaRegion.objects.get(name=obj.region).get_name_display()
        except GhanaRegion.DoesNotExist:
            return obj.region
    
    def create(self, validated_data):
        features_data = validated_data.pop('features', [])
        eco_features = validated_data.pop('eco_features', [])
        
        # Set the created_by user
        validated_data['created_by'] = self.context['request'].user
        
        # Create the property
        property = Property.objects.create(**validated_data)
        
        # Add features
        for feature_data in features_data:
            PropertyFeature.objects.create(property=property, **feature_data)
        
        # Add eco features
        property.eco_features.set(eco_features)
        
        return property
    
    def update(self, instance, validated_data):
        features_data = validated_data.pop('features', None)
        eco_features = validated_data.pop('eco_features', None)
        
        # Update the property
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update features if provided
        if features_data is not None:
            instance.features.all().delete()
            for feature_data in features_data:
                PropertyFeature.objects.create(property=instance, **feature_data)
        
        # Update eco features if provided
        if eco_features is not None:
            instance.eco_features.set(eco_features)
        
        return instance
