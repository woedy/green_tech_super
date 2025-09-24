""
Admin interface for the notifications app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import Notification, NotificationTemplate, UserNotificationPreference


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin interface for NotificationTemplate model."""
    list_display = ('name', 'notification_type', 'subject', 'is_active', 'created_at')
    list_filter = ('notification_type', 'is_active')
    search_fields = ('name', 'subject', 'template')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'is_active')
        }),
        ('Content', {
            'fields': ('notification_type', 'subject', 'template')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model."""
    list_display = ('recipient', 'truncated_subject', 'notification_type', 'status', 'created_at', 'sent_at')
    list_filter = ('notification_type', 'status', 'priority', 'created_at')
    search_fields = ('recipient__email', 'recipient__first_name', 'recipient__last_name', 'subject', 'message')
    readonly_fields = ('created_at', 'updated_at', 'sent_at', 'read_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Recipient', {
            'fields': ('recipient',)
        }),
        ('Content', {
            'fields': ('notification_type', 'subject', 'message', 'template', 'template_context')
        }),
        ('Status', {
            'fields': ('status', 'priority', 'content_type', 'object_id', 'content_object')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'sent_at', 'read_at'),
            'classes': ('collapse',)
        }),
    )
    
    def truncated_subject(self, obj):
        """Display a truncated version of the subject."""
        return obj.subject[:50] + '...' if len(obj.subject) > 50 else obj.subject
    truncated_subject.short_description = _('Subject')
    truncated_subject.admin_order_field = 'subject'


@admin.register(UserNotificationPreference)
class UserNotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin interface for UserNotificationPreference model."""
    list_display = ('user', 'email_notifications', 'sms_notifications', 'push_notifications', 'in_app_notifications')
    list_filter = (
        'email_notifications', 'sms_notifications', 'push_notifications', 
        'in_app_notifications', 'project_updates', 'quote_updates',
        'payment_reminders', 'system_alerts', 'marketing', 'do_not_disturb'
    )
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Notification Types', {
            'fields': (
                'email_notifications', 'sms_notifications', 
                'push_notifications', 'in_app_notifications'
            )
        }),
        ('Notification Categories', {
            'fields': (
                'project_updates', 'quote_updates', 'payment_reminders',
                'system_alerts', 'marketing'
            )
        }),
        ('Do Not Disturb', {
            'fields': ('do_not_disturb', 'do_not_disturb_until')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
