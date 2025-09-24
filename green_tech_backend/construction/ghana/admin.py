from django.contrib import admin
from .models import GhanaRegion, EcoFeature, GhanaPricing


@admin.register(GhanaRegion)
class GhanaRegionAdmin(admin.ModelAdmin):
    """Admin interface for Ghana regions."""
    list_display = ('name', 'capital', 'cost_multiplier', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'capital')
    ordering = ('name',)


@admin.register(EcoFeature)
class EcoFeatureAdmin(admin.ModelAdmin):
    """Admin interface for eco features."""
    list_display = ('name', 'category', 'is_available', 'requires_specialist')
    list_filter = ('category', 'is_available', 'requires_specialist')
    search_fields = ('name', 'description')
    list_editable = ('is_available', 'requires_specialist')
    ordering = ('category', 'name')


@admin.register(GhanaPricing)
class GhanaPricingAdmin(admin.ModelAdmin):
    """Admin interface for Ghana pricing."""
    list_display = ('eco_feature', 'region', 'base_price', 'currency', 'get_adjusted_price', 'is_active')
    list_filter = ('is_active', 'currency', 'region')
    search_fields = ('eco_feature__name', 'region__name')
    list_select_related = ('eco_feature', 'region')
    ordering = ('eco_feature__name', 'region__name')
    
    def get_adjusted_price(self, obj):
        return f"{obj.get_adjusted_price():.2f}"
    get_adjusted_price.short_description = 'Adjusted Price'
