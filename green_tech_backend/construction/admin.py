from django.contrib import admin
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    Project, ProjectMilestone,
    # Quote models now handled by quotes app admin
    ProjectStatus, ProjectPhase, MilestoneStatus,
    ConstructionRequest, ConstructionMilestone, ConstructionDocument
)
from django.contrib.auth import get_user_model

User = get_user_model()


class ConstructionMilestoneInline(admin.StackedInline):
    """Inline admin for construction milestones."""
    model = ConstructionMilestone
    extra = 0
    fields = ('title', 'description', 'due_date', 'is_completed', 'completed_date')


class ConstructionDocumentInline(admin.TabularInline):
    """Inline admin for construction documents."""
    model = ConstructionDocument
    extra = 0
    fields = ('title', 'document_type', 'file', 'uploaded_by', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


@admin.register(ConstructionRequest)
class ConstructionRequestAdmin(admin.ModelAdmin):
    """Admin interface for construction requests."""
    list_display = ('title', 'construction_type', 'status', 'client', 'created_at')
    list_filter = ('status', 'construction_type', 'created_at')
    search_fields = ('title', 'description', 'client__email', 'client__first_name', 'client__last_name')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ConstructionMilestoneInline, ConstructionDocumentInline]
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('title', 'description', 'construction_type', 'status')
        }),
        (_('Property & Location'), {
            'fields': ('property', 'address', 'city', 'region')
        }),
        (_('Project Details'), {
            'fields': (
                'start_date', 'estimated_end_date', 'actual_end_date',
                'budget', 'currency'
            )
        }),
        (_('Sustainability Goals'), {
            'fields': (
                'target_energy_rating', 'target_water_rating',
                'target_sustainability_score'
            ),
            'classes': ('collapse',)
        }),
        (_('Project Team'), {
            'fields': ('client', 'project_manager', 'contractors'),
            'classes': ('collapse',)
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ProjectMilestoneInline(admin.TabularInline):
    """Inline admin for project milestones."""
    model = ProjectMilestone
    extra = 0
    fields = ('title', 'phase', 'status', 'planned_start_date', 'planned_end_date', 'completion_percentage')
    readonly_fields = ('completion_percentage',)
    show_change_link = True


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin interface for Projects."""
    list_display = (
        'title', 
        'status', 
        'current_phase', 
        'progress',
        'project_manager_display',
        'timeline',
        'budget_status'
    )
    list_filter = ('status', 'current_phase', 'created_at')
    search_fields = ('title', 'description', 'project_manager__email', 'project_manager__first_name')
    readonly_fields = (
        'created_at', 'updated_at', 'progress', 'is_behind_schedule',
        'budget_utilization', 'days_remaining'
    )
    inlines = [ProjectMilestoneInline]
    fieldsets = (
        (_('Basic Information'), {
            'fields': (
                'title', 'description', 'status', 'current_phase',
                'property', 'construction_request'
                # approved_quote field removed - quotes now handled by quotes app
            )
        }),
        (_('Project Team'), {
            'fields': ('project_manager', 'site_supervisor', 'contractors')
        }),
        (_('Timeline'), {
            'fields': (
                ('planned_start_date', 'actual_start_date'),
                ('planned_end_date', 'actual_end_date'),
                'days_remaining',
                'is_behind_schedule'
            )
        }),
        (_('Budget'), {
            'fields': (
                'estimated_budget', 'actual_cost', 'budget_utilization',
                'currency'
            )
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def project_manager_display(self, obj):
        return f"{obj.project_manager.get_full_name() or obj.project_manager.email}"
    project_manager_display.short_description = _('Project Manager')
    project_manager_display.admin_order_field = 'project_manager__last_name'
    
    def progress(self, obj):
        return f"{obj.progress_percentage}%"
    progress.short_description = _('Progress')
    progress.admin_order_field = 'progress_percentage'
    
    def timeline(self, obj):
        if obj.is_behind_schedule:
            return format_html('<span style="color: red;">Behind Schedule</span>')
        return format_html('<span style="color: green;">On Track</span>')
    timeline.short_description = _('Timeline')
    
    def budget_status(self, obj):
        utilization = obj.budget_utilization
        if utilization > 90:
            return format_html('<span style="color: red;">{:.1f}%</span>', utilization)
        elif utilization > 70:
            return format_html('<span style="color: orange;">{:.1f}%</span>', utilization)
        return f"{utilization:.1f}%"
    budget_status.short_description = _('Budget Used')
    
    def days_remaining(self, obj):
        if obj.status == ProjectStatus.COMPLETED:
            return "Completed"
        if not obj.planned_end_date:
            return "Not set"
        
        today = timezone.now().date()
        delta = (obj.planned_end_date - today).days
        
        if delta > 0:
            return f"{delta} days remaining"
        elif delta == 0:
            return "Due today"
        else:
            return f"{abs(delta)} days overdue"
    days_remaining.short_description = _('Timeline')
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # New project
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ProjectMilestone)
class ProjectMilestoneAdmin(admin.ModelAdmin):
    """Admin interface for Project Milestones."""
    list_display = (
        'title', 
        'project_link',
        'status',
        'phase',
        'planned_dates',
        'completion',
        'is_on_track_display'
    )
    list_filter = ('status', 'phase', 'project__title')
    search_fields = ('title', 'description', 'project__title')
    readonly_fields = ('created_at', 'updated_at', 'is_on_track_display')
    fieldsets = (
        (None, {
            'fields': (
                'project', 'title', 'description', 'phase', 'status',
                'completion_percentage'
            )
        }),
        (_('Timeline'), {
            'fields': (
                ('planned_start_date', 'actual_start_date'),
                ('planned_end_date', 'actual_end_date'),
                'is_on_track_display'
            )
        }),
        (_('Budget'), {
            'fields': ('estimated_cost', 'actual_cost')
        }),
        (_('Dependencies'), {
            'fields': ('depends_on',),
            'classes': ('collapse',)
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def project_link(self, obj):
        url = reverse('admin:construction_project_change', args=[obj.project_id])
        return format_html('<a href="{}">{}</a>', url, obj.project.title)
    project_link.short_description = _('Project')
    project_link.admin_order_field = 'project__title'
    
    def planned_dates(self, obj):
        return f"{obj.planned_start_date} - {obj.planned_end_date}"
    planned_dates.short_description = _('Planned Dates')
    
    def completion(self, obj):
        return f"{obj.completion_percentage}%"
    completion.short_description = _('Complete')
    completion.admin_order_field = 'completion_percentage'
    
    def is_on_track_display(self, obj):
        if obj.is_on_track:
            return format_html('<span style="color: green;">✓ On Track</span>')
        return format_html('<span style="color: red;">✗ Behind</span>')
    is_on_track_display.short_description = _('Status')
    is_on_track_display.allow_tags = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('project')
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # New milestone
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ConstructionMilestone)
class ConstructionMilestoneAdmin(admin.ModelAdmin):
    """Admin interface for construction milestones."""
    list_display = ('title', 'construction_request', 'due_date', 'is_completed', 'completed_date')
    list_filter = ('is_completed', 'due_date')
    search_fields = ('title', 'description', 'construction_request__title')
    readonly_fields = ('completed_date',)


@admin.register(ConstructionDocument)
class ConstructionDocumentAdmin(admin.ModelAdmin):
    """Admin interface for construction documents."""
    list_display = ('title', 'document_type', 'construction_request', 'uploaded_by', 'uploaded_at')
    list_filter = ('document_type', 'uploaded_at')
    search_fields = ('title', 'description', 'construction_request__title')
    readonly_fields = ('uploaded_at',)