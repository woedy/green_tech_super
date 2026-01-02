from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    Quote,
    QuoteLineItem,
    QuoteMessageAttachment,
    QuoteChatMessage,
    QuoteMessageReceipt,
)


class QuoteLineItemInline(admin.TabularInline):
    """Inline admin for quote line items."""
    model = QuoteLineItem
    extra = 0
    fields = ('kind', 'label', 'quantity', 'unit_cost', 'apply_region_multiplier', 'calculated_total', 'position')
    readonly_fields = ('calculated_total',)
    ordering = ('position', 'created_at')


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    """Admin interface for Quote model."""
    
    list_display = (
        'reference',
        'quote_type',
        'status',
        'recipient_name',
        'total_amount',
        'currency_code',
        'region',
        'created_at',
        'sent_at',
    )
    list_filter = (
        'status',
        'quote_type',
        'region',
        'currency_code',
        'created_at',
        'sent_at',
    )
    search_fields = (
        'reference',
        'recipient_name',
        'recipient_email',
        'prepared_by_name',
        'prepared_by_email',
    )
    readonly_fields = (
        'id',
        'reference',
        'created_at',
        'updated_at',
        'subtotal_amount',
        'tax_amount',
        'discount_amount',
        'allowance_amount',
        'adjustment_amount',
        'total_amount',
        'related_request_link',
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id',
                'reference',
                'quote_type',
                'status',
                'version',
                'parent_quote',
            )
        }),
        ('Related Objects', {
            'fields': (
                'build_request',
                'construction_request',
                'related_request_link',
                'region',
            )
        }),
        ('Financial Details', {
            'fields': (
                'currency_code',
                'regional_multiplier',
                'subtotal_amount',
                'tax_amount',
                'discount_amount',
                'allowance_amount',
                'adjustment_amount',
                'total_amount',
            )
        }),
        ('Contact Information', {
            'fields': (
                'prepared_by_name',
                'prepared_by_email',
                'recipient_name',
                'recipient_email',
            )
        }),
        ('Quote Content', {
            'fields': (
                'notes',
                'terms',
            )
        }),
        ('Timeline', {
            'fields': (
                'valid_until',
                'sent_at',
                'viewed_at',
                'accepted_at',
                'declined_at',
            )
        }),
        ('Signature', {
            'fields': (
                'signature_name',
                'signature_email',
                'signature_at',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
    
    inlines = [QuoteLineItemInline]
    
    def related_request_link(self, obj):
        """Display link to related build request or construction request."""
        if obj.quote_type == obj.QuoteType.BUILD_REQUEST and obj.build_request:
            url = reverse('admin:plans_buildrequest_change', args=[obj.build_request.pk])
            return format_html('<a href="{}">{}</a>', url, obj.build_request)
        elif obj.quote_type == obj.QuoteType.CONSTRUCTION_PROJECT and obj.construction_request:
            url = reverse('admin:construction_constructionrequest_change', args=[obj.construction_request.pk])
            return format_html('<a href="{}">{}</a>', url, obj.construction_request)
        return '-'
    related_request_link.short_description = 'Related Request'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'region',
            'build_request',
            'construction_request',
            'parent_quote'
        )


@admin.register(QuoteLineItem)
class QuoteLineItemAdmin(admin.ModelAdmin):
    """Admin interface for QuoteLineItem model."""
    
    list_display = (
        'label',
        'quote_reference',
        'kind',
        'quantity',
        'unit_cost',
        'calculated_total',
        'apply_region_multiplier',
        'position',
    )
    list_filter = (
        'kind',
        'apply_region_multiplier',
        'quote__status',
        'quote__quote_type',
    )
    search_fields = (
        'label',
        'quote__reference',
        'quote__recipient_name',
    )
    readonly_fields = (
        'id',
        'calculated_total',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id',
                'quote',
                'kind',
                'label',
                'position',
            )
        }),
        ('Pricing', {
            'fields': (
                'quantity',
                'unit_cost',
                'apply_region_multiplier',
                'calculated_total',
            )
        }),
        ('Additional Data', {
            'fields': (
                'metadata',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
    
    def quote_reference(self, obj):
        """Display the quote reference."""
        return obj.quote.reference
    quote_reference.short_description = 'Quote Reference'
    quote_reference.admin_order_field = 'quote__reference'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('quote')


@admin.register(QuoteMessageAttachment)
class QuoteMessageAttachmentAdmin(admin.ModelAdmin):
    """Admin interface for QuoteMessageAttachment model."""
    
    list_display = (
        'id',
        'file_name',
        'uploaded_by',
        'uploaded_at',
        'file_size',
    )
    list_filter = (
        'uploaded_at',
    )
    search_fields = (
        'file',
        'uploaded_by__email',
        'uploaded_by__first_name',
        'uploaded_by__last_name',
    )
    readonly_fields = (
        'id',
        'uploaded_at',
        'file_size',
    )
    
    def file_name(self, obj):
        """Display the file name."""
        if obj.file:
            return obj.file.name.split('/')[-1]
        return '-'
    file_name.short_description = 'File Name'
    
    def file_size(self, obj):
        """Display the file size in a human-readable format."""
        if obj.file:
            try:
                size = obj.file.size
                for unit in ['B', 'KB', 'MB', 'GB']:
                    if size < 1024.0:
                        return f"{size:.1f} {unit}"
                    size /= 1024.0
                return f"{size:.1f} TB"
            except (OSError, ValueError):
                return 'Unknown'
        return '-'
    file_size.short_description = 'File Size'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('uploaded_by')


@admin.register(QuoteChatMessage)
class QuoteChatMessageAdmin(admin.ModelAdmin):
    """Admin interface for QuoteChatMessage model."""
    
    list_display = (
        'id',
        'quote_reference',
        'sender',
        'message_preview',
        'attachment_count',
        'created_at',
        'edited_at',
    )
    list_filter = (
        'created_at',
        'edited_at',
        'quote__status',
    )
    search_fields = (
        'body',
        'quote__reference',
        'sender__email',
        'sender__first_name',
        'sender__last_name',
    )
    readonly_fields = (
        'id',
        'created_at',
        'attachment_count',
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id',
                'quote',
                'sender',
                'body',
            )
        }),
        ('Attachments', {
            'fields': (
                'attachments',
                'attachment_count',
            )
        }),
        ('Additional Data', {
            'fields': (
                'metadata',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'edited_at',
            )
        }),
    )
    
    filter_horizontal = ('attachments',)
    
    def quote_reference(self, obj):
        """Display the quote reference."""
        return obj.quote.reference
    quote_reference.short_description = 'Quote Reference'
    quote_reference.admin_order_field = 'quote__reference'
    
    def message_preview(self, obj):
        """Display a preview of the message body."""
        if len(obj.body) > 50:
            return f"{obj.body[:50]}..."
        return obj.body
    message_preview.short_description = 'Message Preview'
    
    def attachment_count(self, obj):
        """Display the number of attachments."""
        return obj.attachments.count()
    attachment_count.short_description = 'Attachments'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'quote',
            'sender'
        ).prefetch_related('attachments')


@admin.register(QuoteMessageReceipt)
class QuoteMessageReceiptAdmin(admin.ModelAdmin):
    """Admin interface for QuoteMessageReceipt model."""
    
    list_display = (
        'message_id',
        'quote_reference',
        'user',
        'read_at',
    )
    list_filter = (
        'read_at',
    )
    search_fields = (
        'message__quote__reference',
        'user__email',
        'user__first_name',
        'user__last_name',
    )
    readonly_fields = (
        'message_preview',
    )
    
    def quote_reference(self, obj):
        """Display the quote reference."""
        return obj.message.quote.reference
    quote_reference.short_description = 'Quote Reference'
    quote_reference.admin_order_field = 'message__quote__reference'
    
    def message_preview(self, obj):
        """Display a preview of the message."""
        body = obj.message.body
        if len(body) > 50:
            return f"{body[:50]}..."
        return body
    message_preview.short_description = 'Message Preview'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'message__quote',
            'user'
        )
