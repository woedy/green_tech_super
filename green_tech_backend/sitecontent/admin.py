from django.contrib import admin

from .models import SiteDocument, SiteDocumentVersion


@admin.register(SiteDocument)
class SiteDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'current_version', 'updated_at')
    search_fields = ('title', 'description', 'slug')
    list_filter = ('category',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(SiteDocumentVersion)
class SiteDocumentVersionAdmin(admin.ModelAdmin):
    list_display = ('document', 'version', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'document__category')
    search_fields = ('document__title', 'summary', 'notes')
    readonly_fields = ('version', 'created_at')
