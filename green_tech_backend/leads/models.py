from __future__ import annotations

from uuid import uuid4

from django.conf import settings
from django.db import models
from django.utils import timezone


class LeadStatus(models.TextChoices):
    NEW = 'new', 'New'
    CONTACTED = 'contacted', 'Contacted'
    QUALIFIED = 'qualified', 'Qualified'
    QUOTED = 'quoted', 'Quoted'
    CLOSED = 'closed', 'Closed'


class LeadPriority(models.TextChoices):
    HIGH = 'high', 'High'
    MEDIUM = 'medium', 'Medium'
    LOW = 'low', 'Low'


class LeadSource(models.TextChoices):
    BUILD_REQUEST = 'build_request', 'Build Request'
    PROPERTY_INQUIRY = 'property_inquiry', 'Property Inquiry'


class Lead(models.Model):
    """A unified representation of customer interest for agent triage."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    source_type = models.CharField(max_length=50, choices=LeadSource.choices)
    source_id = models.CharField(max_length=64)
    title = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=120)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=LeadStatus.choices, default=LeadStatus.NEW)
    priority = models.CharField(max_length=20, choices=LeadPriority.choices, default=LeadPriority.MEDIUM)
    is_unread = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity_at = models.DateTimeField(default=timezone.now)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads',
    )

    class Meta:
        ordering = ('-last_activity_at', '-created_at')
        unique_together = ('source_type', 'source_id')

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Lead {self.title} ({self.contact_name})"

    def mark_read(self) -> None:
        if self.is_unread:
            self.is_unread = False
            self.save(update_fields=('is_unread', 'updated_at'))

    def log_activity(self, kind: str, message: str, created_by=None, metadata: dict | None = None):
        self.last_activity_at = timezone.now()
        self.save(update_fields=('last_activity_at', 'updated_at'))
        return LeadActivity.objects.create(
            lead=self,
            kind=kind,
            message=message,
            created_by=created_by,
            metadata=metadata or {},
        )

    def to_payload(self) -> dict[str, object]:
        return {
            'id': str(self.id),
            'source_type': self.source_type,
            'source_id': self.source_id,
            'title': self.title,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'status': self.status,
            'priority': self.priority,
            'is_unread': self.is_unread,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_activity_at': self.last_activity_at.isoformat() if self.last_activity_at else None,
        }


class LeadActivityKind(models.TextChoices):
    CREATED = 'created', 'Created'
    STATUS_CHANGED = 'status_changed', 'Status changed'
    PRIORITY_CHANGED = 'priority_changed', 'Priority changed'
    NOTE_ADDED = 'note_added', 'Note added'
    UPDATED = 'updated', 'Updated'


class LeadActivity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    lead = models.ForeignKey(Lead, related_name='activities', on_delete=models.CASCADE)
    kind = models.CharField(max_length=40, choices=LeadActivityKind.choices)
    message = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead_activities',
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Activity {self.kind} on {self.lead_id}"


class LeadNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    lead = models.ForeignKey(Lead, related_name='notes', on_delete=models.CASCADE)
    body = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead_notes',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Note on {self.lead_id}"
