"""Signals for the notifications app."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserNotificationPreference


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_notification_preferences(sender, instance, created, **kwargs):
    """
    Create UserNotificationPreference when a new user is created.
    """
    if created:
        UserNotificationPreference.objects.get_or_create(user=instance)
