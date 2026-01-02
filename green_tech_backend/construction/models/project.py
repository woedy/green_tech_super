"""
Project and milestone models for construction project tracking.
"""
from uuid import uuid4

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models import Sum, F, Q, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from builtins import property as builtin_property
from django.contrib.auth import get_user_model

from properties.models import Property

User = get_user_model()


class ProjectStatus(models.TextChoices):
    """Status choices for construction projects."""
    DRAFT = 'DRAFT', _('Draft')
    PLANNING = 'PLANNING', _('Planning')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    ON_HOLD = 'ON_HOLD', _('On Hold')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')
    DELAYED = 'DELAYED', _('Delayed')


class ProjectPhase(models.TextChoices):
    """Phases of a construction project."""
    SITE_PREPARATION = 'SITE_PREPARATION', _('Site Preparation')
    FOUNDATION = 'FOUNDATION', _('Foundation')
    FRAMING = 'FRAMING', _('Framing')
    ROOFING = 'ROOFING', _('Roofing')
    EXTERIOR = 'EXTERIOR', _('Exterior Work')
    PLUMBING = 'PLUMBING', _('Plumbing')
    ELECTRICAL = 'ELECTRICAL', _('Electrical')
    INSULATION = 'INSULATION', _('Insulation')
    DRYWALL = 'DRYWALL', _('Drywall')
    INTERIOR = 'INTERIOR', _('Interior Finishes')
    FLOORING = 'FLOORING', _('Flooring')
    PAINTING = 'PAINTING', _('Painting')
    LANDSCAPING = 'LANDSCAPING', _('Landscaping')
    FINAL_INSPECTION = 'FINAL_INSPECTION', _('Final Inspection')
    COMPLETED = 'COMPLETED', _('Completed')


class Project(models.Model):
    """Model representing a construction project."""
    # Basic Information
    title = models.CharField(_('project title'), max_length=255)
    description = models.TextField(_('project description'), blank=True)
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.DRAFT
    )
    current_phase = models.CharField(
        _('current phase'),
        max_length=20,
        choices=ProjectPhase.choices,
        default=ProjectPhase.SITE_PREPARATION
    )
    
    # Project Team
    project_manager = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='managed_projects',
        verbose_name=_('project manager')
    )
    site_supervisor = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='supervised_projects',
        verbose_name=_('site supervisor'),
        null=True,
        blank=True
    )
    contractors = models.ManyToManyField(
        User,
        related_name='contracted_projects',
        verbose_name=_('contractors'),
        blank=True
    )
    
    # Project Details
    construction_request = models.OneToOneField(
        'construction.ConstructionRequest',
        on_delete=models.PROTECT,
        related_name='project',
        verbose_name=_('construction request'),
        null=True,
        blank=True
    )
    # approved_quote field removed - quotes now handled by quotes app
    property = models.ForeignKey(
        Property,
        on_delete=models.PROTECT,
        related_name='construction_projects',
        verbose_name=_('property')
    )
    
    # Timeline
    planned_start_date = models.DateField(_('planned start date'), null=True, blank=True)
    actual_start_date = models.DateField(_('actual start date'), null=True, blank=True)
    planned_end_date = models.DateField(_('planned end date'), null=True, blank=True)
    actual_end_date = models.DateField(_('actual end date'), null=True, blank=True)
    
    # Budget
    estimated_budget = models.DecimalField(
        _('estimated budget'),
        max_digits=14,
        decimal_places=2,
        default=0.00
    )
    actual_cost = models.DecimalField(
        _('actual cost'),
        max_digits=14,
        decimal_places=2,
        default=0.00
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='GHS'  # Ghanaian Cedi by default
    )
    
    # Metadata
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_projects',
        verbose_name=_('created by')
    )
    
    class Meta:
        verbose_name = _('project')
        verbose_name_plural = _('projects')
        ordering = ['-created_at']
        permissions = [
            ('can_manage_projects', 'Can manage all projects'),
            ('can_view_all_projects', 'Can view all projects'),
            ('can_approve_projects', 'Can approve project changes'),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def clean(self):
        """Validate project data."""
        super().clean()
        
        # Validate dates
        if self.planned_start_date and self.planned_end_date:
            if self.planned_start_date > self.planned_end_date:
                raise ValidationError({
                    'planned_end_date': 'Planned end date must be after planned start date.'
                })
        
        if self.actual_start_date and self.actual_end_date:
            if self.actual_start_date > self.actual_end_date:
                raise ValidationError({
                    'actual_end_date': 'Actual end date must be after actual start date.'
                })
        
        # Validate project manager and site supervisor are staff
        if not self.project_manager.is_staff:
            raise ValidationError({
                'project_manager': 'Project manager must be a staff member.'
            })
            
        if self.site_supervisor and not self.site_supervisor.is_staff:
            raise ValidationError({
                'site_supervisor': 'Site supervisor must be a staff member.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to handle status transitions."""
        if self.pk:
            old_instance = Project.objects.get(pk=self.pk)
            
            # Set actual start date when project moves from PLANNING to IN_PROGRESS
            if (old_instance.status != ProjectStatus.IN_PROGRESS and 
                self.status == ProjectStatus.IN_PROGRESS and 
                not self.actual_start_date):
                self.actual_start_date = timezone.now().date()
            
            # Set actual end date when project is completed
            if (old_instance.status != ProjectStatus.COMPLETED and 
                self.status == ProjectStatus.COMPLETED and 
                not self.actual_end_date):
                self.actual_end_date = timezone.now().date()
                
                # Complete all open milestones
                self.milestones.filter(status__in=[
                    MilestoneStatus.NOT_STARTED,
                    MilestoneStatus.IN_PROGRESS,
                    MilestoneStatus.ON_HOLD
                ]).update(
                    status=MilestoneStatus.COMPLETED,
                    actual_end_date=timezone.now().date()
                )
        
        super().save(*args, **kwargs)
    
    @builtin_property
    def progress_percentage(self):
        """Calculate the project's progress percentage based on completed milestones."""
        if not self.milestones.exists():
            return 0
            
        total_milestones = self.milestones.count()
        completed_milestones = self.milestones.filter(
            status=MilestoneStatus.COMPLETED
        ).count()
        
        return round((completed_milestones / total_milestones) * 100, 2)
    
    @builtin_property
    def is_behind_schedule(self):
        """Check if the project is behind schedule."""
        if not self.planned_end_date or not self.actual_start_date:
            return False
            
        today = timezone.now().date()
        
        # If project is completed, check if it was completed after planned end date
        if self.status == ProjectStatus.COMPLETED and self.actual_end_date:
            return self.actual_end_date > self.planned_end_date
        
        # For in-progress projects, check if current date is after planned end date
        if self.status == ProjectStatus.IN_PROGRESS:
            return today > self.planned_end_date
            
        return False
    
    @builtin_property
    def budget_utilization(self):
        """Calculate the percentage of budget utilized."""
        if self.estimated_budget == 0:
            return 0
            
        return round((self.actual_cost / self.estimated_budget) * 100, 2)
    
    def update_progress(self):
        """Update project progress based on milestones and tasks."""
        # This method can be called periodically to update project status
        if self.status == ProjectStatus.COMPLETED:
            return
            
        # Check if all milestones are completed
        all_milestones_completed = not self.milestones.exclude(
            status=MilestoneStatus.COMPLETED
        ).exists()
        
        if all_milestones_completed and self.status != ProjectStatus.COMPLETED:
            self.status = ProjectStatus.COMPLETED
            self.actual_end_date = timezone.now().date()
            self.save()


class MilestoneStatus(models.TextChoices):
    """Status choices for project milestones."""
    NOT_STARTED = 'NOT_STARTED', _('Not Started')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    ON_HOLD = 'ON_HOLD', _('On Hold')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')


class ProjectDocumentType(models.TextChoices):
    PLAN = 'PLAN', _('Architectural Plan')
    PERMIT = 'PERMIT', _('Permit')
    CONTRACT = 'CONTRACT', _('Contract')
    REPORT = 'REPORT', _('Report')
    PHOTO = 'PHOTO', _('Progress Photo')
    OTHER = 'OTHER', _('Other')


class ProjectDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name=_('project')
    )
    document_type = models.CharField(
        _('document type'),
        max_length=20,
        choices=ProjectDocumentType.choices,
        default=ProjectDocumentType.OTHER
    )
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    is_required = models.BooleanField(_('is required'), default=False)
    current_version = models.OneToOneField(
        'ProjectDocumentVersion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        verbose_name=_('current version')
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_project_documents',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('project document')
        verbose_name_plural = _('project documents')
        ordering = ['title']

    def __str__(self):
        return self.title


class ProjectDocumentVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    document = models.ForeignKey(
        ProjectDocument,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name=_('document')
    )
    version = models.PositiveIntegerField(_('version'), default=0)
    file = models.FileField(_('file'), upload_to='projects/documents/%Y/%m/%d')
    notes = models.CharField(_('notes'), max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_project_documents',
        verbose_name=_('uploaded by')
    )
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)

    class Meta:
        verbose_name = _('project document version')
        verbose_name_plural = _('project document versions')
        ordering = ['-uploaded_at']
        unique_together = [('document', 'version')]

    def save(self, *args, **kwargs):
        if not self.version:
            last = ProjectDocumentVersion.objects.filter(document=self.document).order_by('-version').first()
            self.version = (last.version if last else 0) + 1
        super().save(*args, **kwargs)
        document = self.document
        if document.current_version_id != self.id:
            document.current_version = self
            document.save(update_fields=['current_version', 'updated_at'])

    def __str__(self):
        return f"{self.document.title} v{self.version}"


class ProjectUpdateCategory(models.TextChoices):
    PROGRESS = 'progress', _('Progress')
    RISK = 'risk', _('Risk')
    NOTE = 'note', _('General Note')
    MEETING = 'meeting', _('Meeting')


class ProjectUpdate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='updates',
        verbose_name=_('project')
    )
    category = models.CharField(_('category'), max_length=20, choices=ProjectUpdateCategory.choices, default=ProjectUpdateCategory.PROGRESS)
    title = models.CharField(_('title'), max_length=200)
    body = models.TextField(_('body'))
    is_customer_visible = models.BooleanField(_('visible to customer'), default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='project_updates',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('project update')
        verbose_name_plural = _('project updates')

    def __str__(self):
        return self.title


class ProjectTaskStatus(models.TextChoices):
    PENDING = 'pending', _('Pending')
    IN_PROGRESS = 'in_progress', _('In Progress')
    COMPLETED = 'completed', _('Completed')
    BLOCKED = 'blocked', _('Blocked')


class ProjectTaskPriority(models.TextChoices):
    LOW = 'low', _('Low')
    MEDIUM = 'medium', _('Medium')
    HIGH = 'high', _('High')


class ProjectTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name=_('project')
    )
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    status = models.CharField(_('status'), max_length=20, choices=ProjectTaskStatus.choices, default=ProjectTaskStatus.PENDING)
    priority = models.CharField(_('priority'), max_length=10, choices=ProjectTaskPriority.choices, default=ProjectTaskPriority.MEDIUM)
    due_date = models.DateField(_('due date'), null=True, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_tasks',
        verbose_name=_('assigned to')
    )
    requires_customer_action = models.BooleanField(_('requires customer action'), default=False)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_project_tasks',
        verbose_name=_('created by')
    )
    overdue_notified_at = models.DateTimeField(_('overdue notified at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('project task')
        verbose_name_plural = _('project tasks')

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == ProjectTaskStatus.COMPLETED and self.completed_at is None:
            self.completed_at = timezone.now()
        elif self.status != ProjectTaskStatus.COMPLETED:
            self.completed_at = None
        super().save(*args, **kwargs)
    """Status choices for project milestones."""
    NOT_STARTED = 'NOT_STARTED', _('Not Started')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    ON_HOLD = 'ON_HOLD', _('On Hold')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')

class ProjectMessageAttachment(models.Model):
    """Simple model to reference uploaded chat attachments."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    file = models.FileField(_('file'), upload_to='projects/chat/%Y/%m/%d')
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='project_chat_attachments',
        verbose_name=_('uploaded by'),
    )

    class Meta:
        verbose_name = _('project message attachment')
        verbose_name_plural = _('project message attachments')

    def __str__(self):  # pragma: no cover - simple repr
        return f"Attachment {self.id}"


class ProjectChatMessage(models.Model):
    """Chat message between project stakeholders."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        related_name='chat_messages',
        on_delete=models.CASCADE,
        verbose_name=_('project'),
    )
    # quote field removed - quotes now handled by quotes app
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_project_messages',
        verbose_name=_('sender'),
    )
    body = models.TextField(_('message body'))
    attachments = models.ManyToManyField(
        ProjectMessageAttachment,
        related_name='messages',
        blank=True,
        verbose_name=_('attachments'),
    )
    metadata = models.JSONField(_('metadata'), default=dict, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    edited_at = models.DateTimeField(_('edited at'), null=True, blank=True)

    class Meta:
        ordering = ('created_at',)
        verbose_name = _('project chat message')
        verbose_name_plural = _('project chat messages')

    def __str__(self):  # pragma: no cover
        return f"Message {self.id}"


class ProjectMessageReceipt(models.Model):
    """Tracks which users have read a message."""

    message = models.ForeignKey(
        ProjectChatMessage,
        related_name='receipts',
        on_delete=models.CASCADE,
        verbose_name=_('message'),
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='project_message_receipts',
        verbose_name=_('user'),
    )
    read_at = models.DateTimeField(_('read at'), default=timezone.now)

    class Meta:
        unique_together = ('message', 'user')
        ordering = ('-read_at',)
        verbose_name = _('project message receipt')
        verbose_name_plural = _('project message receipts')

    def __str__(self):  # pragma: no cover
        return f"Receipt {self.message_id} -> {self.user_id}"



class ProjectMilestone(models.Model):
    """Model representing a milestone in a construction project."""
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='milestones',
        verbose_name=_('project')
    )
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    phase = models.CharField(
        _('project phase'),
        max_length=20,
        choices=ProjectPhase.choices,
        default=ProjectPhase.SITE_PREPARATION
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=MilestoneStatus.choices,
        default=MilestoneStatus.NOT_STARTED
    )
    
    # Timeline
    planned_start_date = models.DateField(_('planned start date'), null=True, blank=True)
    actual_start_date = models.DateField(_('actual start date'), null=True, blank=True)
    planned_end_date = models.DateField(_('planned end date'))
    actual_end_date = models.DateField(_('actual end date'), null=True, blank=True)
    
    # Dependencies
    depends_on = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='dependent_milestones',
        verbose_name=_('depends on'),
        blank=True
    )
    
    # Progress Tracking
    completion_percentage = models.PositiveIntegerField(
        _('completion percentage'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    
    # Budget
    estimated_cost = models.DecimalField(
        _('estimated cost'),
        max_digits=14,
        decimal_places=2,
        default=0.00
    )
    actual_cost = models.DecimalField(
        _('actual cost'),
        max_digits=14,
        decimal_places=2,
        default=0.00
    )
    
    # Metadata
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_milestones',
        verbose_name=_('created by')
    )
    
    class Meta:
        verbose_name = _('project milestone')
        verbose_name_plural = _('project milestones')
        ordering = ['project', 'planned_start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'title'],
                name='unique_project_milestone_title'
            ),
            models.CheckConstraint(
                check=Q(planned_start_date__lte=models.F('planned_end_date')),
                name='planned_start_before_end'
            ),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    def clean(self):
        """Validate milestone data."""
        super().clean()
        
        # Validate dates against project dates
        if self.planned_start_date and self.project.planned_start_date:
            if self.planned_start_date < self.project.planned_start_date:
                raise ValidationError({
                    'planned_start_date': 'Cannot be before project start date.'
                })
                
        if self.planned_end_date and self.project.planned_end_date:
            if self.planned_end_date > self.project.planned_end_date:
                raise ValidationError({
                    'planned_end_date': 'Cannot be after project end date.'
                })
        
        # Validate that dependencies are from the same project
        if self.pk:  # Only check if this is an existing instance
            invalid_deps = self.depends_on.exclude(project=self.project)
            if invalid_deps.exists():
                raise ValidationError({
                    'depends_on': 'All dependencies must be from the same project.'
                })
    
    def save(self, *args, **kwargs):
        """Override save to handle status transitions and dependencies."""
        is_new = self._state.adding
        
        if not is_new:
            old_instance = ProjectMilestone.objects.get(pk=self.pk)
            
            # Set actual start date when milestone is started
            if (old_instance.status != MilestoneStatus.IN_PROGRESS and 
                self.status == MilestoneStatus.IN_PROGRESS and 
                not self.actual_start_date):
                self.actual_start_date = timezone.now().date()
            
            # Set actual end date when milestone is completed
            if (old_instance.status != MilestoneStatus.COMPLETED and 
                self.status == MilestoneStatus.COMPLETED):
                self.actual_end_date = timezone.now().date()
                self.completion_percentage = 100
        
        super().save(*args, **kwargs)
        
        # Update project status if needed
        if self.status == MilestoneStatus.IN_PROGRESS and self.project.status != ProjectStatus.IN_PROGRESS:
            self.project.status = ProjectStatus.IN_PROGRESS
            self.project.save()
    
    @property
    def is_on_track(self):
        """Check if the milestone is on track based on completion and dates."""
        if self.status == MilestoneStatus.COMPLETED:
            return True
            
        if self.status != MilestoneStatus.IN_PROGRESS:
            return False
            
        today = timezone.now().date()
        
        # If we're past the planned end date and not completed, we're behind
        if today > self.planned_end_date:
            return False
            
        # Check if we're making expected progress
        if self.planned_start_date and self.planned_end_date:
            total_days = (self.planned_end_date - self.planned_start_date).days
            if total_days > 0:
                days_elapsed = (today - self.planned_start_date).days
                expected_progress = min(100, int((days_elapsed / total_days) * 100))
                return self.completion_percentage >= expected_progress
                
        return True
    
    def can_start(self):
        """Check if all dependencies are completed."""
        if not self.depends_on.exists():
            return True
            
        return not self.depends_on.exclude(
            status=MilestoneStatus.COMPLETED
        ).exists()
    
    def update_status_based_on_tasks(self):
        """Update milestone status based on its tasks."""
        if not hasattr(self, 'tasks') or not self.tasks.exists():
            return
            
        total_tasks = self.tasks.count()
        completed_tasks = self.tasks.filter(status='COMPLETED').count()
        
        if completed_tasks == 0:
            new_status = MilestoneStatus.NOT_STARTED
        elif completed_tasks == total_tasks:
            new_status = MilestoneStatus.COMPLETED
            self.completion_percentage = 100
        else:
            new_status = MilestoneStatus.IN_PROGRESS
            self.completion_percentage = int((completed_tasks / total_tasks) * 100)
        
        if self.status != new_status:
            self.status = new_status
            self.save()
