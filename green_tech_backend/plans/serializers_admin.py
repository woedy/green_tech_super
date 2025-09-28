from __future__ import annotations

from typing import Iterable, Sequence

from django.db import transaction
from rest_framework import serializers

from locations.models import Region
from .models import (
    Plan,
    PlanFeature,
    PlanImage,
    PlanOption,
    PlanRegionalPricing,
)


class PlanImageAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = PlanImage
        fields = ('id', 'image_url', 'caption', 'is_primary', 'order')


class PlanFeatureAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = PlanFeature
        fields = ('id', 'name', 'description', 'category', 'is_sustainable', 'price_delta')


class PlanOptionAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = PlanOption
        fields = ('id', 'name', 'description', 'price_delta')


class PlanRegionalPricingAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    region = serializers.SlugRelatedField(slug_field='slug', queryset=Region.objects.all())

    class Meta:
        model = PlanRegionalPricing
        fields = ('id', 'region', 'cost_multiplier', 'currency_code')


class PlanAdminSerializer(serializers.ModelSerializer):
    images = PlanImageAdminSerializer(many=True, required=False)
    features = PlanFeatureAdminSerializer(many=True, required=False)
    options = PlanOptionAdminSerializer(many=True, required=False)
    pricing = PlanRegionalPricingAdminSerializer(many=True, required=False)

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
            'has_garage',
            'energy_rating',
            'water_rating',
            'sustainability_score',
            'hero_image_url',
            'specs',
            'tags',
            'is_published',
            'published_at',
            'created_at',
            'updated_at',
            'images',
            'features',
            'options',
            'pricing',
        )
        read_only_fields = ('published_at', 'created_at', 'updated_at')

    def validate(self, attrs):
        is_published = attrs.get('is_published')
        if is_published is None and self.instance is not None:
            is_published = self.instance.is_published
        hero_image = attrs.get('hero_image_url')
        if hero_image is None and self.instance is not None:
            hero_image = self.instance.hero_image_url
        if is_published and not hero_image:
            raise serializers.ValidationError({'hero_image_url': 'Published plans require a hero image.'})
        return super().validate(attrs)

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        features = validated_data.pop('features', [])
        options = validated_data.pop('options', [])
        pricing = validated_data.pop('pricing', [])

        with transaction.atomic():
            plan = Plan(**validated_data)
            self._attach_request_metadata(plan)
            plan.save()
            self._sync_images(plan, images)
            self._sync_features(plan, features)
            self._sync_options(plan, options)
            self._sync_pricing(plan, pricing)
        return plan

    def update(self, instance, validated_data):
        images = validated_data.pop('images', None)
        features = validated_data.pop('features', None)
        options = validated_data.pop('options', None)
        pricing = validated_data.pop('pricing', None)

        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(instance, field, value)
            self._attach_request_metadata(instance)
            instance.save()
            if images is not None:
                self._sync_images(instance, images)
            if features is not None:
                self._sync_features(instance, features)
            if options is not None:
                self._sync_options(instance, options)
            if pricing is not None:
                self._sync_pricing(instance, pricing)
        return instance

    # --- helpers ---------------------------------------------------------
    def _attach_request_metadata(self, plan: Plan) -> None:
        request = self.context.get('request') if self.context else None
        if request:
            if getattr(request, 'user', None) and request.user.is_authenticated:
                plan._current_user = request.user
            plan._current_ip = request.META.get('REMOTE_ADDR')
            plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')

    def _sync_images(self, plan: Plan, payload: Sequence[dict]) -> None:
        existing = {img.id: img for img in plan.images.all()}
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
                image = PlanImage.objects.create(plan=plan, **item)
                keep.append(image.id)
        for image_id, image in existing.items():
            if image_id not in keep:
                image.delete()

    def _sync_features(self, plan: Plan, payload: Sequence[dict]) -> None:
        existing = {feature.id: feature for feature in plan.features.all()}
        keep: list[int] = []
        for item in payload:
            feature_id = item.get('id')
            if feature_id and feature_id in existing:
                feature = existing[feature_id]
                for field in ('name', 'description', 'category', 'is_sustainable', 'price_delta'):
                    if field in item:
                        setattr(feature, field, item[field])
                feature.save()
                keep.append(feature_id)
            else:
                feature = PlanFeature.objects.create(plan=plan, **item)
                keep.append(feature.id)
        for feature_id, feature in existing.items():
            if feature_id not in keep:
                feature.delete()

    def _sync_options(self, plan: Plan, payload: Sequence[dict]) -> None:
        existing = {option.id: option for option in plan.options.all()}
        keep: list[int] = []
        for item in payload:
            option_id = item.get('id')
            if option_id and option_id in existing:
                option = existing[option_id]
                for field in ('name', 'description', 'price_delta'):
                    if field in item:
                        setattr(option, field, item[field])
                option.save()
                keep.append(option_id)
            else:
                option = PlanOption.objects.create(plan=plan, **item)
                keep.append(option.id)
        for option_id, option in existing.items():
            if option_id not in keep:
                option.delete()

    def _sync_pricing(self, plan: Plan, payload: Sequence[dict]) -> None:
        existing = {pricing.id: pricing for pricing in plan.pricing.select_related('region')}
        keep: list[int] = []
        for item in payload:
            pricing_id = item.get('id')
            region = item.get('region')
            if isinstance(region, Region):
                region_obj = region
            else:
                region_obj = Region.objects.get(slug=region)
            data = {
                'region': region_obj,
                'cost_multiplier': item.get('cost_multiplier'),
                'currency_code': item.get('currency_code', ''),
            }
            if pricing_id and pricing_id in existing:
                pricing_instance = existing[pricing_id]
                for field, value in data.items():
                    setattr(pricing_instance, field, value)
                pricing_instance.save()
                keep.append(pricing_id)
            else:
                pricing_instance = PlanRegionalPricing.objects.create(plan=plan, **data)
                keep.append(pricing_instance.id)
        for pricing_id, pricing_instance in existing.items():
            if pricing_id not in keep:
                pricing_instance.delete()
