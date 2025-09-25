from __future__ import annotations

from typing import Any

from django.utils import timezone
from rest_framework import serializers

from locations.models import Region
from .models import Property, PropertyImage, PropertyInquiry, ViewingAppointment


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ('id', 'image_url', 'caption', 'is_primary', 'order')


class RegionSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ('slug', 'name', 'country', 'currency_code', 'cost_multiplier')


class PropertyListSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    eco_features = serializers.ListField(child=serializers.CharField(), source='eco_features', read_only=True)

    class Meta:
        model = Property
        fields = (
            'id',
            'slug',
            'title',
            'summary',
            'property_type',
            'listing_type',
            'status',
            'price',
            'currency',
            'bedrooms',
            'bathrooms',
            'area_sq_m',
            'sustainability_score',
            'eco_features',
            'featured',
            'image',
            'location',
        )

    def get_image(self, obj: Property):
        return obj.primary_image

    def get_location(self, obj: Property):
        return {
            'city': obj.city,
            'country': obj.country,
            'region': obj.region.name,
        }


class PropertyDetailSerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True)
    region = RegionSummarySerializer()
    eco_features = serializers.ListField(child=serializers.CharField())
    amenities = serializers.ListField(child=serializers.CharField())

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
            'images',
        )


class PropertyInquirySerializer(serializers.ModelSerializer):
    scheduled_viewing = serializers.DateTimeField(write_only=True, required=False)

    class Meta:
        model = PropertyInquiry
        fields = ('id', 'property', 'name', 'email', 'phone', 'message', 'scheduled_viewing', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')
        extra_kwargs = {
            'property': {'write_only': True},
        }

    def create(self, validated_data: dict[str, Any]):
        scheduled = validated_data.pop('scheduled_viewing', None)
        inquiry = super().create(validated_data)
        if scheduled:
            ViewingAppointment.objects.create(
                inquiry=inquiry,
                property=inquiry.property,
                scheduled_for=scheduled,
                agent=inquiry.property.listed_by,
            )
        return inquiry
