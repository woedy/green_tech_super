from django.contrib import admin
from .models import (
    Property,
    PropertyImage,
    PropertyInquiry,
    ViewingAppointment,
    PropertyTransaction,
    TransactionDocument,
    TransactionNote
)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ('image_url', 'caption', 'is_primary', 'order')
    ordering = ('order',)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'property_type', 'listing_type', 'status', 'price', 'currency', 'city', 'region', 'featured')
    list_filter = ('property_type', 'listing_type', 'status', 'featured', 'region')
    search_fields = ('title', 'summary', 'description', 'city')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PropertyImageInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    list_display = ('property', 'name', 'email', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'property__title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ViewingAppointment)
class ViewingAppointmentAdmin(admin.ModelAdmin):
    list_display = ('property', 'scheduled_for', 'agent', 'status')
    list_filter = ('status', 'scheduled_for')
    search_fields = ('property__title', 'agent__email')
    readonly_fields = ('created_at', 'updated_at')


class TransactionDocumentInline(admin.TabularInline):
    model = TransactionDocument
    extra = 0
    fields = ('title', 'document_type', 'file_url', 'uploaded_by', 'created_at')
    readonly_fields = ('uploaded_by', 'created_at')


class TransactionNoteInline(admin.TabularInline):
    model = TransactionNote
    extra = 0
    fields = ('author', 'content', 'is_internal', 'created_at')
    readonly_fields = ('author', 'created_at')


@admin.register(PropertyTransaction)
class PropertyTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'property_ref',
        'client',
        'transaction_type',
        'status',
        'contact_name',
        'assigned_agent',
        'created_at'
    )
    list_filter = ('transaction_type', 'status', 'created_at', 'assigned_agent')
    search_fields = (
        'property_ref__title',
        'client__email',
        'client__first_name',
        'client__last_name',
        'contact_name',
        'contact_email'
    )
    readonly_fields = ('id', 'created_at', 'updated_at', 'submitted_at', 'reviewed_at', 'completed_at')
    inlines = [TransactionDocumentInline, TransactionNoteInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'property_ref', 'client', 'transaction_type', 'status')
        }),
        ('Contact Details', {
            'fields': ('contact_name', 'contact_email', 'contact_phone')
        }),
        ('Transaction Details', {
            'fields': (
                'proposed_price',
                'proposed_rent',
                'lease_duration_months',
                'move_in_date',
                'budget',
                'financing_required'
            )
        }),
        ('Messages & Notes', {
            'fields': ('message', 'admin_notes', 'rejection_reason')
        }),
        ('Assignment', {
            'fields': ('assigned_agent',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'submitted_at', 'reviewed_at', 'completed_at')
        }),
    )


@admin.register(TransactionDocument)
class TransactionDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'transaction', 'document_type', 'uploaded_by', 'created_at')
    list_filter = ('document_type', 'created_at')
    search_fields = ('title', 'transaction__property_ref__title', 'transaction__contact_name')
    readonly_fields = ('uploaded_by', 'created_at')


@admin.register(TransactionNote)
class TransactionNoteAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'author', 'is_internal', 'created_at')
    list_filter = ('is_internal', 'created_at')
    search_fields = ('transaction__property_ref__title', 'content', 'author__email')
    readonly_fields = ('author', 'created_at', 'updated_at')
