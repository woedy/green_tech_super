from __future__ import annotations

from rest_framework import serializers

from .models import Region


class RegionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = (
            'id',
            'slug',
            'name',
            'country',
            'currency_code',
            'cost_multiplier',
            'timezone',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
