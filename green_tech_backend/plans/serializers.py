from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from locations.models import Region
from .models import (
    Plan,
    PlanImage,
    PlanFeature,
    PlanOption,
    PlanRegionalPricing,
    BuildRequest,
    BuildRequestAttachment,
)


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ('slug', 'name', 'country', 'currency_code', 'cost_multiplier')


class PlanImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanImage
        fields = ('id', 'image_url', 'caption', 'is_primary', 'order')


class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = ('id', 'name', 'description', 'category', 'is_sustainable')


class PlanOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanOption
        fields = ('id', 'name', 'description', 'price_delta')


class PlanListSerializer(serializers.ModelSerializer):
    hero_image = serializers.CharField(source='hero_image_url', read_only=True)
    regional_estimates = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = (
            'id',
            'slug',
            'name',
            'summary',
            'style',
            'bedrooms',
            'bathrooms',
            'floors',
            'area_sq_m',
            'base_price',
            'base_currency',
            'hero_image',
            'sustainability_score',
            'regional_estimates',
        )

    def get_regional_estimates(self, obj: Plan):
        return obj.regional_estimates()


class PlanDetailSerializer(serializers.ModelSerializer):
    hero_image = serializers.CharField(source='hero_image_url')
    images = PlanImageSerializer(many=True)
    features = PlanFeatureSerializer(many=True)
    options = PlanOptionSerializer(many=True)
    regional_estimates = serializers.SerializerMethodField()
    regions = RegionSerializer(source='pricing', many=True, read_only=True)

    class Meta:
        model = Plan
        fields = (
            'id',
            'slug',
            'name',
            'summary',
            'description',
            'style',
            'bedrooms',
            'bathrooms',
            'floors',
            'area_sq_m',
            'base_price',
            'base_currency',
            'hero_image',
            'has_garage',
            'energy_rating',
            'water_rating',
            'sustainability_score',
            'specs',
            'tags',
            'images',
            'features',
            'options',
            'regional_estimates',
        )

    def get_regional_estimates(self, obj: Plan):
        return obj.regional_estimates()


class BuildRequestAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildRequestAttachment
        fields = ('id', 'storage_key', 'original_name', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class BuildRequestSerializer(serializers.ModelSerializer):
    attachments = BuildRequestAttachmentSerializer(many=True, read_only=True)
    plan = serializers.SlugRelatedField(slug_field='slug', queryset=Plan.objects.filter(is_published=True))
    region = serializers.SlugRelatedField(slug_field='slug', queryset=Region.objects.active())
    options = serializers.ListField(child=serializers.CharField(), required=False)
    plan_details = serializers.SerializerMethodField()
    region_details = serializers.SerializerMethodField()

    class Meta:
        model = BuildRequest
        fields = (
            'id',
            'plan',
            'region',
            'plan_details',
            'region_details',
            'contact_name',
            'contact_email',
            'contact_phone',
            'budget_currency',
            'budget_min',
            'budget_max',
            'timeline',
            'customizations',
            'options',
            'intake_data',
            'attachments',
            'submitted_at',
        )
        read_only_fields = ('id', 'submitted_at', 'attachments', 'plan_details', 'region_details')

    def validate(self, attrs: dict[str, Any]):
        min_budget = attrs.get('budget_min')
        max_budget = attrs.get('budget_max')
        if min_budget and max_budget and Decimal(min_budget) > Decimal(max_budget):
            raise serializers.ValidationError('budget_min cannot be greater than budget_max')
        return attrs

    def create(self, validated_data: dict[str, Any]):
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        validated_data['user'] = user
        return super().create(validated_data)

    def get_plan_details(self, obj: BuildRequest) -> dict[str, object]:
        plan = obj.plan
        return {
            'name': plan.name,
            'slug': plan.slug,
            'base_price': str(plan.base_price),
            'currency': plan.base_currency,
            'options': [
                {
                    'id': option.id,
                    'name': option.name,
                    'price_delta': str(option.price_delta),
                }
                for option in plan.options.all()
            ],
        }

    def get_region_details(self, obj: BuildRequest) -> dict[str, object]:
        region = obj.region
        return {
            'name': region.name,
            'slug': region.slug,
            'country': region.country,
            'currency_code': region.currency_code,
            'cost_multiplier': str(region.cost_multiplier),
        }


class PresignedUploadSerializer(serializers.Serializer):
    filename = serializers.CharField()
    content_type = serializers.CharField()


class DirectUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    filename = serializers.CharField(required=False)

    def save(self, **kwargs):
        uploaded: UploadedFile = self.validated_data['file']
        uploaded.name = self.validated_data.get('filename') or uploaded.name
        return uploaded
