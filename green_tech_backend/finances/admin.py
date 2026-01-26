"""
Admin configuration for the finances app.
"""
from django.contrib import admin
from .models import (
    FinancingOption,
    GovernmentIncentive,
    BankIntegration,
    PaymentPlan,
    ROICalculation
)


@admin.register(FinancingOption)
class FinancingOptionAdmin(admin.ModelAdmin):
    """Admin configuration for FinancingOption model."""
    list_display = ('name', 'interest_rate', 'min_loan_amount', 'max_loan_amount', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(GovernmentIncentive)
class GovernmentIncentiveAdmin(admin.ModelAdmin):
    """Admin configuration for GovernmentIncentive model."""
    list_display = ('name', 'incentive_type', 'amount', 'is_percentage', 'is_active')
    list_filter = ('incentive_type', 'is_active')
    search_fields = ('name', 'description')
    filter_horizontal = ('eligible_eco_features',)
    ordering = ('name',)


@admin.register(BankIntegration)
class BankIntegrationAdmin(admin.ModelAdmin):
    """Admin configuration for BankIntegration model."""
    list_display = ('name', 'api_base_url', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'api_base_url')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    """Admin configuration for PaymentPlan model."""
    list_display = ('name', 'interest_rate', 'term_months', 'payment_frequency', 'is_active')
    list_filter = ('is_active', 'payment_frequency')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(ROICalculation)
class ROICalculationAdmin(admin.ModelAdmin):
    """Admin configuration for ROICalculation model."""
    list_display = ('name', 'initial_cost', 'annual_savings', 'lifespan_years', 'roi_percentage')
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    
    def roi_percentage(self, obj):
        """Display ROI as a percentage."""
        return f"{obj.calculate_roi():.1f}%"
    roi_percentage.short_description = 'ROI'
