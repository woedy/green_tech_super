from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from .audit import PlanAuditLog

User = get_user_model()

@admin.register(PlanAuditLog)
class PlanAuditLogAdmin(admin.ModelAdmin):
    list_display = ('plan', 'user', 'action', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('plan__name', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('plan', 'user', 'action', 'changes', 'timestamp', 'ip_address', 'user_agent')
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
        
    def has_change_permission(self, request, obj=None):
        return False
