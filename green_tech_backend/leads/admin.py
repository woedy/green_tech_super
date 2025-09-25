from django.contrib import admin

from .models import Lead, LeadActivity, LeadNote


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('title', 'contact_name', 'status', 'priority', 'is_unread', 'created_at')
    list_filter = ('status', 'priority', 'is_unread')
    search_fields = ('title', 'contact_name', 'contact_email', 'contact_phone')


@admin.register(LeadActivity)
class LeadActivityAdmin(admin.ModelAdmin):
    list_display = ('lead', 'kind', 'created_at')
    list_filter = ('kind',)
    search_fields = ('message',)


@admin.register(LeadNote)
class LeadNoteAdmin(admin.ModelAdmin):
    list_display = ('lead', 'created_at', 'created_by')
    search_fields = ('body',)
