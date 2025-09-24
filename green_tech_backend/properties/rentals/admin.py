"""
Admin interface for rental property management.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from .models import (
    RentalProperty, 
    LeaseAgreement, 
    MaintenanceRequest, 
    Payment
)


@admin.register(RentalProperty)
class RentalPropertyAdmin(admin.ModelAdmin):
    """Admin interface for RentalProperty model."""
    list_display = (
        'property_title', 
        'is_available', 
        'available_from', 
        'monthly_rent',
        'security_deposit_display'
    )
    list_filter = ('is_available', 'available_from')
    search_fields = ('property__title', 'property__address')
    raw_id_fields = ('property',)
    date_hierarchy = 'available_from'
    
    def property_title(self, obj):
        return obj.property.title
    property_title.short_description = _('Property')
    property_title.admin_order_field = 'property__title'
    
    def monthly_rent(self, obj):
        return f"{obj.property.price} {obj.property.currency}"
    monthly_rent.short_description = _('Monthly Rent')
    
    def security_deposit_display(self, obj):
        return f"{obj.security_deposit} {obj.property.currency}"
    security_deposit_display.short_description = _('Security Deposit')


class PaymentInline(admin.TabularInline):
    """Inline admin for payments related to a lease."""
    model = Payment
    extra = 0
    fields = ('payment_date', 'amount', 'payment_method', 'reference_number', 'status')
    readonly_fields = ('status',)
    
    def status(self, obj):
        return "Paid" if obj.pk else "Pending"
    status.short_description = _('Status')


@admin.register(LeaseAgreement)
class LeaseAgreementAdmin(admin.ModelAdmin):
    """Admin interface for LeaseAgreement model."""
    list_display = (
        'property_title', 
        'tenant_name', 
        'lease_type', 
        'start_date', 
        'end_date', 
        'status',
        'monthly_rent_display'
    )
    list_filter = ('lease_type', 'is_active', 'start_date', 'end_date')
    search_fields = (
        'property__title', 
        'tenant__first_name', 
        'tenant__last_name',
        'tenant__email'
    )
    raw_id_fields = ('property', 'tenant')
    date_hierarchy = 'start_date'
    inlines = [PaymentInline]
    
    def property_title(self, obj):
        url = reverse('admin:properties_property_change', args=[obj.property.id])
        return format_html('<a href="{}">{}</a>', url, obj.property.title)
    property_title.short_description = _('Property')
    property_title.admin_order_field = 'property__title'
    
    def tenant_name(self, obj):
        return obj.tenant.get_full_name() or obj.tenant.email
    tenant_name.short_description = _('Tenant')
    tenant_name.admin_order_field = 'tenant__last_name'
    
    def monthly_rent_display(self, obj):
        return f"{obj.monthly_rent} {obj.property.currency}"
    monthly_rent_display.short_description = _('Monthly Rent')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('property', 'tenant')


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    """Admin interface for MaintenanceRequest model."""
    list_display = (
        'title', 
        'property_title',
        'status',
        'priority',
        'requested_date',
        'scheduled_date',
        'assigned_to_display'
    )
    list_filter = ('status', 'priority', 'requested_date')
    search_fields = ('title', 'property__title', 'description')
    raw_id_fields = ('property', 'submitted_by', 'assigned_to')
    date_hierarchy = 'requested_date'
    
    def property_title(self, obj):
        return obj.property.title
    property_title.short_description = _('Property')
    property_title.admin_order_field = 'property__title'
    
    def assigned_to_display(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else "-"
    assigned_to_display.short_description = _('Assigned To')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('property', 'assigned_to', 'submitted_by')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment model."""
    list_display = (
        'lease_display',
        'amount_display',
        'payment_date',
        'payment_method',
        'reference_number'
    )
    list_filter = ('payment_method', 'payment_date')
    search_fields = (
        'lease__property__title',
        'lease__tenant__first_name',
        'lease__tenant__last_name',
        'reference_number'
    )
    date_hierarchy = 'payment_date'
    
    def lease_display(self, obj):
        return f"{obj.lease.property.title} - {obj.lease.tenant.get_full_name() or obj.lease.tenant.email}"
    lease_display.short_description = _('Lease')
    
    def amount_display(self, obj):
        return f"{obj.amount} {obj.lease.property.currency}"
    amount_display.short_description = _('Amount')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'lease__property', 
            'lease__tenant',
            'received_by'
        )
