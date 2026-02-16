from __future__ import annotations

from typing import Sequence

from django.db import transaction
from rest_framework import serializers

from locations.models import Region
from construction.ghana.models import EcoFeature
from .models import Property, PropertyImage, PropertyStatus, PropertyEcoFeature


class PropertyImageAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = PropertyImage
        fields = ('id', 'image_url', 'caption', 'is_primary', 'order')


class PropertyAdminSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)
    images = PropertyImageAdminSerializer(many=True, required=False)
    region = serializers.SlugRelatedField(slug_field='slug', queryset=Region.objects.all())
    eco_features = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text='List of eco feature names'
    )

    class Meta:
        model = Property
        fields = (
            'id',
            'slug',
            'title',
            'summary',
            'description',
            'property_type',
            'listing_type',
            'status',
            'price',
            'currency',
            'bedrooms',
            'bathrooms',
            'area_sq_m',
            'plot_sq_m',
            'year_built',
            'hero_image_url',
            'sustainability_score',
            'energy_rating',
            'water_rating',
            'eco_features',
            'amenities',
            'highlights',
            'city',
            'country',
            'region',
            'address',
            'latitude',
            'longitude',
            'featured',
            'listed_by',
            'created_at',
            'updated_at',
            'images',
        )
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, attrs):
        status_value = attrs.get('status')
        if status_value is None and self.instance is not None:
            status_value = self.instance.status
        hero = attrs.get('hero_image_url')
        if hero is None and self.instance is not None:
            hero = self.instance.hero_image_url
        if status_value == PropertyStatus.PUBLISHED and not hero:
            raise serializers.ValidationError({'hero_image_url': 'Published listings require a hero image.'})
        return super().validate(attrs)

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        eco_features = validated_data.pop('eco_features', [])
        with transaction.atomic():
            property_obj = Property.objects.create(**validated_data)
            self._sync_images(property_obj, images)
            self._sync_eco_features(property_obj, eco_features)
        return property_obj

    def update(self, instance, validated_data):
        images = validated_data.pop('images', None)
        eco_features = validated_data.pop('eco_features', None)
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(instance, field, value)
            instance.save()
            if images is not None:
                self._sync_images(instance, images)
            if eco_features is not None:
                self._sync_eco_features(instance, eco_features)
        return instance

    def _sync_images(self, property_obj: Property, payload: Sequence[dict]) -> None:
        existing = {image.id: image for image in property_obj.images.all()}
        keep: list[int] = []
        for item in payload:
            image_id = item.get('id')
            if image_id and image_id in existing:
                image = existing[image_id]
                for field in ('image_url', 'caption', 'is_primary', 'order'):
                    if field in item:
                        setattr(image, field, item[field])
                image.save()
                keep.append(image_id)
            else:
                image = PropertyImage.objects.create(property=property_obj, **item)
                keep.append(image.id)
        for image_id, image in existing.items():
            if image_id not in keep:
                image.delete()

    def _sync_eco_features(self, property_obj: Property, feature_names: list[str]) -> None:
        """Sync eco features for the property based on feature names."""
        # Clear existing relationships first
        property_obj.property_eco_features.all().delete()
        
        if not feature_names:
            return
        
        # Remove duplicates and empty strings
        unique_names = set()
        for name in feature_names:
            if name and name.strip():
                unique_names.add(name.strip())
        
        # Get or create eco features by name (case-insensitive)
        for name in unique_names:
            # Try to find existing feature (case-insensitive)
            feature = EcoFeature.objects.filter(name__iexact=name).first()
            if not feature:
                # Create new eco feature if it doesn't exist
                feature = EcoFeature.objects.create(
                    name=name,
                    category=EcoFeature.FeatureCategory.MATERIALS,  # Default category
                    description=f'Auto-created eco feature: {name}'
                )
            
            # Create relationship (use get_or_create to avoid duplicates)
            PropertyEcoFeature.objects.get_or_create(
                property=property_obj,
                eco_feature=feature
            )

