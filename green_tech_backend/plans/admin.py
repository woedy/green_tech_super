from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Plan
from .audit import PlanAuditLog

User = get_user_model()

class PlanAuditLogInline(admin.TabularInline):
    model = PlanAuditLog
    extra = 0
    readonly_fields = ('user', 'action', 'changes', 'timestamp', 'ip_address', 'user_agent')
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'style', 'bedrooms', 'bathrooms', 'area_sq_m', 'base_price', 'is_published', 'published_at')
    list_filter = ('style', 'bedrooms', 'bathrooms', 'is_published')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'published_at')
    inlines = [PlanAuditLogInline]
    actions = ['publish_selected', 'unpublish_selected']
    
    def save_model(self, request, obj, form, change):
        obj._current_user = request.user
        obj._current_ip = request.META.get('REMOTE_ADDR')
        obj._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
        super().save_model(request, obj, form, change)
    
    @admin.action(description='Publish selected plans')
    def publish_selected(self, request, queryset):
        updated = 0
        for plan in queryset:
            plan._current_ip = request.META.get('REMOTE_ADDR')
            plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
            if plan.publish(user=request.user):
                updated += 1
        self.message_user(request, f"Successfully published {updated} plans.")
    
    @admin.action(description='Unpublish selected plans')
    def unpublish_selected(self, request, queryset):
        updated = 0
        for plan in queryset:
            plan._current_ip = request.META.get('REMOTE_ADDR')
            plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
            if plan.unpublish(user=request.user):
                updated += 1
        self.message_user(request, f"Successfully unpublished {updated} plans.")


# Register the PlanAuditLogAdmin in the admin.py file of the app that defines the PlanAuditLog model
# This is typically done in the same app where the model is defined
# The registration is moved to the bottom of the file to avoid circular imports
