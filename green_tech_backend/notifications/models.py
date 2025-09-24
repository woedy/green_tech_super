"""
Notification models for the Green Tech Africa platform.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _


class NotificationType(models.TextChoices):
    """Types of notifications that can be sent."""
    EMAIL = 'email', _('Email')
    SMS = 'sms', _('SMS')
    PUSH = 'push', _('Push Notification')
    IN_APP = 'in_app', _('In-App Notification')


class NotificationStatus(models.TextChoices):
    """Status of a notification."""
    PENDING = 'pending', _('Pending')
    SENT = 'sent', _('Sent')
    DELIVERED = 'delivered', _('Delivered')
    FAILED = 'failed', _('Failed')
    READ = 'read', _('Read')


class NotificationPriority(models.TextChoices):
    """Priority levels for notifications."""
    LOW = 'low', _('Low')
    NORMAL = 'normal', _('Normal')
    HIGH = 'high', _('High')
    URGENT = 'urgent', _('Urgent')


class NotificationTemplate(models.Model):
    """
    Template for notifications that can be reused across the application.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text="Unique name for the template")
    subject = models.CharField(max_length=200, help_text="Email subject or notification title")
    template = models.TextField(help_text="Template content (can use Django template syntax)")
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.EMAIL,
        help_text="Type of notification this template is for"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this template is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = _('Notification Template')
        verbose_name_plural = _('Notification Templates')

    def __str__(self):
        return f"{self.name} ({self.get_notification_type_display()})"


class Notification(models.Model):
    """
    Represents a notification that can be sent to a user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text=_("User who will receive this notification")
    )
    
    # Content
    subject = models.CharField(max_length=200, help_text=_("Notification subject or title"))
    message = models.TextField(help_text=_("Notification message content"))
    
    # Type and status
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.IN_APP,
        help_text=_("Type of notification")
    )
    status = models.CharField(
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.PENDING,
        help_text=_("Current status of the notification")
    )
    priority = models.CharField(
        max_length=20,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        help_text=_("Priority level of the notification")
    )
    
    # Related object reference (generic foreign key)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.UUIDField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Template reference (optional)
    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_("Template used to generate this notification")
    )
    template_context = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Context data used to render the template")
    )
    
    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True, help_text=_("When the notification was sent"))
    read_at = models.DateTimeField(null=True, blank=True, help_text=_("When the notification was read"))
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
    
    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.recipient}: {self.subject}"
    
    def mark_as_sent(self):
        """Mark the notification as sent."""
        self.status = NotificationStatus.SENT
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at', 'updated_at'])
    
    def mark_as_read(self):
        """Mark the notification as read."""
        if not self.read_at:
            self.status = NotificationStatus.READ
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at', 'updated_at'])
    
    def mark_as_failed(self):
        """Mark the notification as failed."""
        self.status = NotificationStatus.FAILED
        self.save(update_fields=['status', 'updated_at'])


class UserNotificationPreference(models.Model):
    """
    User-specific notification preferences.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Notification type preferences
    email_notifications = models.BooleanField(default=True, help_text=_("Enable email notifications"))
    sms_notifications = models.BooleanField(default=True, help_text=_("Enable SMS notifications"))
    push_notifications = models.BooleanField(default=True, help_text=_("Enable push notifications"))
    in_app_notifications = models.BooleanField(default=True, help_text=_("Enable in-app notifications"))
    
    # Notification category preferences
    project_updates = models.BooleanField(default=True, help_text=_("Receive project update notifications"))
    quote_updates = models.BooleanField(default=True, help_text=_("Receive quote update notifications"))
    payment_reminders = models.BooleanField(default=True, help_text=_("Receive payment reminder notifications"))
    system_alerts = models.BooleanField(default=True, help_text=_("Receive system alert notifications"))
    marketing = models.BooleanField(default=True, help_text=_("Receive marketing notifications"))
    
    # Do not disturb settings
    do_not_disturb = models.BooleanField(default=False, help_text=_("Pause all notifications"))
    do_not_disturb_until = models.DateTimeField(null=True, blank=True, help_text=_("Pause notifications until this time"))
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('User Notification Preference')
        verbose_name_plural = _('User Notification Preferences')
    
    def __str__(self):
        return f"Notification preferences for {self.user}"
    
    def can_receive_notification(self, notification_type, category=None):
        """
        Check if the user can receive a notification of the given type and category.
        """
        if self.do_not_disturb:
            if self.do_not_disturb_until and self.do_not_disturb_until < timezone.now():
                # Do not disturb period has ended
                self.do_not_disturb = False
                self.save(update_fields=['do_not_disturb'])
            else:
                return False
        
        # Check notification type preference
        type_pref = {
            NotificationType.EMAIL: self.email_notifications,
            NotificationType.SMS: self.sms_notifications,
            NotificationType.PUSH: self.push_notifications,
            NotificationType.IN_APP: self.in_app_notifications,
        }.get(notification_type, False)
        
        if not type_pref:
            return False
        
        # Check category preference if provided
        if category:
            category_pref = {
                'project_updates': self.project_updates,
                'quote_updates': self.quote_updates,
                'payment_reminders': self.payment_reminders,
                'system_alerts': self.system_alerts,
                'marketing': self.marketing,
            }.get(category, True)  # Default to True if category is not recognized
            
            return category_pref
        
        return True
