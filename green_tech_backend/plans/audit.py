from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class ActionType(models.TextChoices):
    CREATE = 'create', _('Create')
    UPDATE = 'update', _('Update')
    DELETE = 'delete', _('Delete')
    PUBLISH = 'publish', _('Publish')
    UNPUBLISH = 'unpublish', _('Unpublish')

class PlanAuditLog(models.Model):
    plan = models.ForeignKey('plans.Plan', on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ActionType.choices)
    changes = models.JSONField(_('changes'), default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ('-timestamp',)
        verbose_name = _('plan audit log')
        verbose_name_plural = _('plan audit logs')

    def __str__(self):
        plan_name = self.plan.name if hasattr(self, 'plan') and hasattr(self.plan, 'name') else 'Unknown Plan'
        return f"{self.get_action_display()} - {plan_name} - {self.timestamp}"


def plan_log_action(plan, user, action, changes=None, *, ip_address=None, user_agent=None):
    """Log an action for a plan, capturing request metadata when available."""
    return PlanAuditLog.objects.create(
        plan=plan,
        user=user or getattr(plan, '_current_user', None),
        action=action,
        changes=changes or {},
        ip_address=ip_address or getattr(plan, '_current_ip', None),
        user_agent=user_agent or getattr(plan, '_current_user_agent', ''),
    )


def plan_publish(plan, user=None):
    """Publish a plan and log the action."""
    if not plan.is_published:
        plan.is_published = True
        plan.published_at = timezone.now()
        if user:
            plan._current_user = user
        plan.save(update_fields=['is_published', 'published_at', 'updated_at'])
        return True
    return False


def plan_unpublish(plan, user=None):
    """Unpublish a plan and log the action."""
    if plan.is_published:
        plan.is_published = False
        plan.published_at = None
        if user:
            plan._current_user = user
        plan.save(update_fields=['is_published', 'published_at', 'updated_at'])
        return True
    return False
