"""
Serializers for project and milestone models.
"""
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db.models import Q
from rest_framework import serializers

from accounts.serializers import UserSerializer
from properties.serializers import PropertySerializer

from construction.models import (
    Project,
    ProjectMilestone,
    ProjectStatus,
    ProjectPhase,
    MilestoneStatus,
    ProjectDocument,
    ProjectDocumentVersion,
    ProjectDocumentType,
    ProjectUpdate,
    ProjectUpdateCategory,
    ProjectTask,
    ProjectTaskStatus,
    ProjectTaskPriority
)
from construction.serializers.quote_serializers import QuoteSerializer

User = get_user_model()


class ProjectMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for project milestones (nested in project)."""
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    phase_display = serializers.CharField(
        source='get_phase_display', 
        read_only=True
    )
    is_on_track = serializers.BooleanField(read_only=True)
    dependencies = serializers.PrimaryKeyRelatedField(
        many=True, 
        read_only=True,
        source='depends_on'
    )
    
    class Meta:
        model = ProjectMilestone
        fields = [
            'id', 'title', 'description', 'phase', 'phase_display', 
            'status', 'status_display', 'planned_start_date', 'actual_start_date',
            'planned_end_date', 'actual_end_date', 'completion_percentage',
            'estimated_cost', 'actual_cost', 'is_on_track', 'dependencies',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_on_track']


class ProjectMilestoneDetailSerializer(ProjectMilestoneSerializer):
    """Detailed serializer for project milestones with full dependency info."""
    dependencies = serializers.SerializerMethodField()
    
    class Meta(ProjectMilestoneSerializer.Meta):
        fields = ProjectMilestoneSerializer.Meta.fields + ['dependencies']
    
    def get_dependencies(self, obj):
        """Get serialized dependencies with their titles and statuses."""
        return [
            {
                'id': dep.id,
                'title': dep.title,
                'status': dep.status,
                'status_display': dep.get_status_display(),
                'planned_end_date': dep.planned_end_date,
                'is_completed': dep.status == MilestoneStatus.COMPLETED
            }
            for dep in obj.depends_on.all()
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """Base serializer for projects."""
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    phase_display = serializers.CharField(
        source='get_current_phase_display', 
        read_only=True
    )
    progress_percentage = serializers.FloatField(read_only=True)
    is_behind_schedule = serializers.BooleanField(read_only=True)
    budget_utilization = serializers.FloatField(read_only=True)
    project_manager = UserSerializer(read_only=True)
    site_supervisor = UserSerializer(read_only=True)
    contractors = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'current_phase', 'phase_display', 'project_manager', 'site_supervisor',
            'contractors', 'planned_start_date', 'actual_start_date',
            'planned_end_date', 'actual_end_date', 'estimated_budget',
            'actual_cost', 'currency', 'progress_percentage', 'is_behind_schedule',
            'budget_utilization', 'created_at', 'updated_at', 'property'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'progress_percentage', 
            'is_behind_schedule', 'budget_utilization'
        ]


class ProjectDetailSerializer(ProjectSerializer):
    """Detailed serializer for projects with nested milestones."""
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)
    property = PropertySerializer(read_only=True)
    documents = ProjectDocumentSerializer(many=True, read_only=True)
    updates = ProjectUpdateSerializer(many=True, read_only=True)
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    construction_request = serializers.PrimaryKeyRelatedField(read_only=True)
    approved_quote = QuoteSerializer(read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + [
            'milestones', 'property', 'construction_request', 'approved_quote',
            'documents', 'updates', 'tasks', 'created_by'
        ]
        read_only_fields = ProjectSerializer.Meta.read_only_fields + [
            'created_by'
        ]


class ProjectStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating project status."""
    status = serializers.ChoiceField(
        choices=ProjectStatus.choices,
        help_text=_("New status for the project")
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text=_("Optional notes about the status change")
    )


class ProjectPhaseUpdateSerializer(serializers.Serializer):
    """Serializer for updating project phase."""
    current_phase = serializers.ChoiceField(
        choices=ProjectPhase.choices,
        help_text=_("New phase for the project")
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text=_("Optional notes about the phase change")
    )


class MilestoneStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating milestone status."""
    status = serializers.ChoiceField(
        choices=MilestoneStatus.choices,
        help_text=_("New status for the milestone")
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text=_("Optional notes about the status change")
    )


class ProjectDashboardSerializer(serializers.ModelSerializer):
    """
    Comprehensive dashboard serializer for project overview.
    Includes progress tracking, budget status, upcoming milestones, and recent activity.
    """
    progress_percentage = serializers.FloatField(
        help_text="Overall project completion percentage (0-100)"
    )
    days_remaining = serializers.SerializerMethodField(
        help_text="Estimated days until project completion"
    )
    budget_status = serializers.SerializerMethodField(
        help_text="Budget utilization and status (on_track/over_budget/under_budget)"
    )
    upcoming_milestones = serializers.SerializerMethodField(
        help_text="Upcoming or overdue milestones"
    )
    recent_activity = serializers.SerializerMethodField(
        help_text="Recent project activities and updates"
    )
    phase_progress = serializers.SerializerMethodField(
        help_text="Completion status of each project phase"
    )
    team_members = serializers.SerializerMethodField(
        help_text="Project team members and their roles"
    )
    risk_factors = serializers.SerializerMethodField(
        help_text="Identified project risks and their status"
    )
    documents = serializers.SerializerMethodField(
        help_text="Project documents with current version details"
    )
    action_items = serializers.SerializerMethodField(
        help_text="Outstanding tasks or actions for the customer"
    )
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'status', 'current_phase', 'progress_percentage',
            'days_remaining', 'budget_status', 'upcoming_milestones',
            'recent_activity', 'phase_progress', 'team_members', 'risk_factors',
            'documents', 'action_items', 'planned_start_date', 'planned_end_date',
            'actual_start_date', 'actual_end_date', 'estimated_budget', 'actual_cost', 'currency'
        ]
        read_only_fields = fields
    
    def get_days_remaining(self, obj):
        """Calculate days remaining until project deadline."""
        if not obj.end_date:
            return None
        
        today = timezone.now().date()
        delta = (obj.end_date - today).days
        return max(0, delta) if delta > 0 else 0
    
    def get_budget_status(self, obj):
        """Calculate budget utilization and status with detailed breakdown."""
        if not obj.estimated_budget:
            return {
                'utilization': 0,
                'status': 'not_set',
                'remaining': 0,
                'estimated': 0,
                'actual': 0,
                'variance': 0
            }
            
        utilization = (obj.actual_cost / obj.estimated_budget) * 100 if obj.estimated_budget > 0 else 0
        variance = obj.estimated_budget - obj.actual_cost
        
        if utilization > 100:
            status = 'over_budget'
        elif utilization > 90:
            status = 'at_risk'
        elif utilization < 70:
            status = 'under_budget'
        else:
            status = 'on_track'
            
        return {
            'utilization': round(utilization, 2),
            'status': status,
            'remaining': max(0, variance),
            'estimated': obj.estimated_budget,
            'actual': obj.actual_cost,
            'variance': abs(variance),
            'is_over_budget': variance < 0,
            'currency': obj.currency
        }
    
    def get_upcoming_milestones(self, obj):
        """Get upcoming or overdue milestones with priority and impact."""
        today = timezone.now().date()
        upcoming = obj.milestones.filter(
            status__in=['NOT_STARTED', 'IN_PROGRESS'],
            planned_end_date__gte=today - timezone.timedelta(days=7)  # Include slightly overdue
        ).order_by('planned_end_date')[:10]  # Show more milestones
        
        return [
            {
                'id': m.id,
                'title': m.title,
                'due_date': m.planned_end_date,
                'status': m.status,
                'phase': m.phase,
                'progress': m.completion_percentage,
                'is_due_soon': (m.planned_end_date - today).days <= 7,
                'is_overdue': m.planned_end_date < today,
                'priority': m.priority if hasattr(m, 'priority') else 'medium',
                'dependencies': [dep.id for dep in m.depends_on.all()]
            }
            for m in upcoming
        ]
    
    def get_documents(self, obj):
        documents = obj.documents.all().select_related('current_version', 'current_version__uploaded_by')
        serializer = ProjectDocumentSerializer(documents, many=True, context=self.context)
        return serializer.data

    def get_action_items(self, obj):
        request = self.context.get('request')
        tasks = obj.tasks.filter(status__in=[
            ProjectTaskStatus.PENDING,
            ProjectTaskStatus.IN_PROGRESS,
            ProjectTaskStatus.BLOCKED
        ])
        if request and not request.user.is_staff and not request.user.is_superuser:
            tasks = tasks.filter(Q(assigned_to=request.user) | Q(requires_customer_action=True))
        tasks = tasks.order_by('due_date', 'created_at')[:10]
        serializer = ProjectTaskSerializer(tasks, many=True, context=self.context)
        return serializer.data

    def get_phase_progress(self, obj):
        """Calculate progress for each project phase."""
        phases = {phase[0]: {'name': phase[1], 'milestones': []} 
                 for phase in ProjectPhase.choices}
        
        # Get all milestones grouped by phase
        for milestone in obj.milestones.all():
            if milestone.phase in phases:
                phases[milestone.phase]['milestones'].append(milestone)
        
        # Calculate progress for each phase
        result = []
        for phase_id, phase_data in phases.items():
            milestones = phase_data['milestones']
            if not milestones:
                progress = 0
            else:
                progress = sum(m.completion_percentage for m in milestones) / len(milestones)
            
            result.append({
                'phase': phase_id,
                'name': phase_data['name'],
                'progress': round(progress, 1),
                'milestone_count': len(milestones),
                'completed_milestones': sum(1 for m in milestones 
                                         if m.status == MilestoneStatus.COMPLETED)
            })
        
        return result
    
    def get_team_members(self, obj):
        """Get project team members with their roles and contact info."""
        team = []
        
        if obj.project_manager:
            team.append({
                'id': obj.project_manager.id,
                'name': str(obj.project_manager),
                'role': 'Project Manager',
                'email': obj.project_manager.email,
                'phone': getattr(obj.project_manager, 'phone', '')
            })
            
        if getattr(obj, 'site_supervisor', None):
            team.append({
                'id': obj.site_supervisor.id,
                'name': str(obj.site_supervisor),
                'role': 'Site Supervisor',
                'email': obj.site_supervisor.email,
                'phone': getattr(obj.site_supervisor, 'phone', '')
            })
            
        for contractor in obj.contractors.all():
            team.append({
                'id': contractor.id,
                'name': str(contractor),
                'role': 'Contractor',
                'email': contractor.email,
                'phone': getattr(contractor, 'phone', ''),
                'company': getattr(contractor, 'company_name', '')
            })
            
        return team
    
    def get_risk_factors(self, obj):
        """Identify potential project risks based on current status."""
        risks = []
        today = timezone.now().date()
        
        # Budget risk
        budget_status = self.get_budget_status(obj)
        if budget_status['status'] in ['over_budget', 'at_risk']:
            risks.append({
                'type': 'budget',
                'severity': 'high' if budget_status['status'] == 'over_budget' else 'medium',
                'description': f"Project is {budget_status['status'].replace('_', ' ')}",
                'impact': 'Financial overruns may affect project completion',
                'mitigation': 'Review expenses and adjust budget or scope if necessary'
            })
        
        # Schedule risk
        if obj.end_date and obj.end_date < today + timezone.timedelta(days=30):
            days_left = (obj.end_date - today).days
            if days_left < 0:
                severity = 'critical'
                desc = f'Project is {abs(days_left)} days behind schedule'
            else:
                severity = 'medium' if days_left < 14 else 'low'
                desc = f'Only {days_left} days until deadline'
                
            risks.append({
                'type': 'schedule',
                'severity': severity,
                'description': desc,
                'impact': 'Potential delays in project delivery',
                'mitigation': 'Review critical path and allocate additional resources if needed'
            })
        
        # Milestone risk
        overdue_milestones = obj.milestones.filter(
            status__in=['NOT_STARTED', 'IN_PROGRESS'],
            planned_end_date__lt=today
        ).count()
        
        if overdue_milestones > 0:
            risks.append({
                'type': 'milestone',
                'severity': 'high' if overdue_milestones > 3 else 'medium',
                'description': f'{overdue_milestones} milestone(s) are overdue',
                'impact': 'Cascading delays in dependent tasks',
                'mitigation': 'Prioritize and address overdue milestones'
            })
            
        return risks
    
    def get_recent_activity(self, obj):
        """Get recent project updates visible to the customer."""
        updates = obj.updates.filter(is_customer_visible=True).order_by('-created_at')[:8]
        serializer = ProjectUpdateSerializer(updates, many=True, context=self.context)
        return serializer.data



class ProjectDocumentVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDocumentVersion
        fields = ('id', 'version', 'notes', 'uploaded_at', 'uploaded_by', 'download_url')
        read_only_fields = fields

    def get_download_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ProjectDocumentSerializer(serializers.ModelSerializer):
    current_version = ProjectDocumentVersionSerializer(read_only=True)
    versions = ProjectDocumentVersionSerializer(many=True, read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    requires_upload = serializers.SerializerMethodField()
    initial_file = serializers.FileField(write_only=True, required=False)
    initial_notes = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ProjectDocument
        fields = (
            'id', 'title', 'document_type', 'document_type_display', 'description', 'is_required',
            'requires_upload', 'current_version', 'versions',
            'initial_file', 'initial_notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'requires_upload', 'current_version', 'versions', 'created_at', 'updated_at')

    def get_requires_upload(self, obj):
        return obj.is_required and obj.current_version is None

    def create(self, validated_data):
        initial_file = validated_data.pop('initial_file', None)
        initial_notes = validated_data.pop('initial_notes', '')
        document = ProjectDocument.objects.create(**validated_data)
        request = self.context.get('request')
        if initial_file:
            ProjectDocumentVersion.objects.create(
                document=document,
                file=initial_file,
                notes=initial_notes,
                uploaded_by=getattr(request, 'user', None)
            )
        return document

    def update(self, instance, validated_data):
        validated_data.pop('initial_file', None)
        validated_data.pop('initial_notes', None)
        return super().update(instance, validated_data)


class ProjectUpdateSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = ProjectUpdate
        fields = ('id', 'title', 'body', 'category', 'is_customer_visible', 'created_by', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')


class ProjectTaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTask
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'due_date',
            'assigned_to', 'requires_customer_action', 'completed_at',
            'created_at', 'updated_at', 'is_overdue'
        )
        read_only_fields = ('id', 'assigned_to', 'completed_at', 'created_at', 'updated_at', 'is_overdue')

    def get_is_overdue(self, obj):
        if obj.status == ProjectTaskStatus.COMPLETED or not obj.due_date:
            return False
        return obj.due_date < timezone.now().date()


class ProjectTaskWriteSerializer(ProjectTaskSerializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source='assigned_to',
        allow_null=True,
        required=False,
        write_only=True,
    )

    class Meta(ProjectTaskSerializer.Meta):
        fields = ProjectTaskSerializer.Meta.fields + ('assigned_to_id',)

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            return attrs

        user = request.user
        if not (user.is_staff or user.is_superuser or self._is_project_manager(user)):
            disallowed_fields = set(attrs.keys()) - {'status'}
            if disallowed_fields:
                raise serializers.ValidationError(
                    _('Customers may only update the status of actionable tasks.'),
                )
        return attrs

    def _is_project_manager(self, user):
        task = getattr(self, 'instance', None)
        project = getattr(task, 'project', None)
        if project is None:
            project = self.context.get('project')
        if project is None:
            view = self.context.get('view')
            if view is not None:
                try:
                    project = view.get_project()
                except Exception:  # pragma: no cover - defensive guard
                    project = None
        return bool(project and project.project_manager_id == user.id)

class ProjectMessageReceiptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectMessageReceipt
        fields = ('user', 'read_at')
        read_only_fields = fields


class ProjectMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()
    receipts = ProjectMessageReceiptSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectChatMessage
        fields = (
            'id', 'project', 'quote', 'sender', 'body', 'attachments',
            'metadata', 'created_at', 'edited_at', 'receipts'
        )
        read_only_fields = ('project', 'sender', 'created_at', 'edited_at', 'receipts', 'attachments')

    def get_attachments(self, obj):
        return [
            {
                'id': attachment.id,
                'file': attachment.file.url if attachment.file else None,
                'uploaded_at': attachment.uploaded_at,
            }
            for attachment in obj.attachments.all()
        ]




class ProjectTimelineSerializer(serializers.ModelSerializer):
    """Serializer for project timeline data."""
    milestones = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'planned_start_date', 'planned_end_date', 'milestones']
    
    def get_milestones(self, obj):
        """Get all milestones with their dependencies."""
        milestones = obj.milestones.all().prefetch_related('depends_on')
        return [
            {
                'id': m.id,
                'title': m.title,
                'start_date': m.planned_start_date,
                'end_date': m.planned_end_date,
                'status': m.status,
                'completion_percentage': m.completion_percentage,
                'dependencies': [dep.id for dep in m.depends_on.all()],
                'is_on_track': m.is_on_track
            }
            for m in milestones
        ]
