from __future__ import annotations

from typing import Sequence

from django.db import transaction
from rest_framework import serializers

from locations.models import Region
from .models import Property, PropertyImage, PropertyStatus


class PropertyImageAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = PropertyImage
        fields = ('id', 'image_url', 'caption', 'is_primary', 'order')


class PropertyAdminSerializer(serializers.ModelSerializer):
    images = PropertyImageAdminSerializer(many=True, required=False)
    region = serializers.SlugRelatedField(slug_field='slug', queryset=Region.objects.all())

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
        with transaction.atomic():
            property_obj = Property.objects.create(**validated_data)
            self._sync_images(property_obj, images)
        return property_obj

    def update(self, instance, validated_data):
        images = validated_data.pop('images', None)
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(instance, field, value)
            instance.save()
            if images is not None:
                self._sync_images(instance, images)
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
