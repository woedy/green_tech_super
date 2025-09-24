from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import (
    SustainabilityScore, CertificationStandard, PropertyCertification,
    SustainabilityFeatureImpact, PropertyComparison, CostSavingsEstimate
)


class SustainabilityScoreAdmin(admin.ModelAdmin):
    list_display = ('property', 'category', 'score_display', 'last_updated')
    list_filter = ('category', 'last_updated')
    search_fields = ('property__title', 'property__address')
    readonly_fields = ('last_updated',)
    date_hierarchy = 'last_updated'

    def score_display(self, obj):
        return f"{obj.score}/{obj.max_possible}"
    score_display.short_description = 'Score'
    score_display.admin_order_field = 'score'


class CertificationStandardAdmin(admin.ModelAdmin):
    list_display = ('name', 'issuing_organization', 'minimum_score', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'issuing_organization', 'description')
    prepopulated_fields = {}
    readonly_fields = ()  # Remove created_at and updated_at from readonly_fields as they are not in the model
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'issuing_organization', 'logo', 'website', 'is_active')
        }),
        (_('Scoring'), {
            'fields': ('minimum_score', 'required_categories')
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class PropertyCertificationAdmin(admin.ModelAdmin):
    list_display = ('property_display', 'standard', 'status', 'issue_date', 'expiry_date', 'is_active')
    list_filter = ('status', 'standard', 'issue_date')
    search_fields = ('property_obj__title', 'standard__name', 'certificate_number')
    readonly_fields = ('created_at', 'updated_at', 'is_active')
    date_hierarchy = 'issue_date'
    raw_id_fields = ('property_obj', 'standard', 'verified_by')
    list_select_related = ('property_obj', 'standard')
    
    def property_display(self, obj):
        return obj.property_obj
    property_display.short_description = 'Property'


class SustainabilityFeatureImpactAdmin(admin.ModelAdmin):
    list_display = ('eco_feature', 'energy_impact', 'water_impact', 'materials_impact', 'waste_impact')
    list_filter = ('eco_feature__category',)
    search_fields = ('eco_feature__name', 'eco_feature__description')
    raw_id_fields = ('eco_feature',)


class PropertyComparisonAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at', 'properties_count')
    list_filter = ('created_at',)
    search_fields = ('name', 'description', 'created_by__email')
    filter_horizontal = ('properties',)
    raw_id_fields = ('created_by',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')

    def properties_count(self, obj):
        return obj.properties.count()
    properties_count.short_description = 'Properties'


class CostSavingsEstimateAdmin(admin.ModelAdmin):
    list_display = ('property', 'eco_feature', 'installation_cost', 'annual_savings', 'payback_period', 'is_installed')
    list_filter = ('is_installed', 'eco_feature__category')
    search_fields = ('property__title', 'eco_feature__name', 'notes')
    raw_id_fields = ('property', 'eco_feature')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('property', 'eco_feature')


# Register models with their admin classes
admin.site.register(SustainabilityScore, SustainabilityScoreAdmin)
admin.site.register(CertificationStandard, CertificationStandardAdmin)
admin.site.register(PropertyCertification, PropertyCertificationAdmin)
admin.site.register(SustainabilityFeatureImpact, SustainabilityFeatureImpactAdmin)
admin.site.register(PropertyComparison, PropertyComparisonAdmin)
admin.site.register(CostSavingsEstimate, CostSavingsEstimateAdmin)
