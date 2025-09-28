from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from construction.models import (
    Project,
    ProjectMilestone,
    ProjectDocumentVersion,
    ProjectUpdate,
    ProjectTask,
    MilestoneStatus,
    ProjectTaskStatus
)
from notifications.services import notify_users

User = get_user_model()


def _project_recipients(project: Project) -> list[User]:
    recipients = set()
    if project.project_manager:
        recipients.add(project.project_manager)
    if getattr(project, 'site_supervisor', None):
        recipients.add(project.site_supervisor)
    recipients.update(project.contractors.all())
    client = getattr(getattr(project, 'construction_request', None), 'client', None)
    if client:
        recipients.add(client)
    return list(recipients)


@receiver(pre_save, sender=ProjectMilestone)
def _store_previous_milestone_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            previous = sender.objects.get(pk=instance.pk)
            instance._previous_status = previous.status
        except sender.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=ProjectMilestone)
def project_milestone_notification(sender, instance, created, **kwargs):
    project = instance.project
    recipients = _project_recipients(project)
    if not recipients:
        return

    if created:
        subject = f"New milestone added: {instance.title}"
        message = f"A new milestone '{instance.title}' has been scheduled for {project.title}."
    elif getattr(instance, '_previous_status', None) != instance.status:
        subject = f"Milestone status update: {instance.title}"
        message = f"Milestone '{instance.title}' is now {instance.get_status_display()}."
    else:
        return

    notify_users(
        recipients,
        subject,
        message,
        template_name=None,
        content_object=project,
    )


@receiver(post_save, sender=ProjectDocumentVersion)
def project_document_uploaded(sender, instance, created, **kwargs):
    if not created:
        return
    project = instance.document.project
    recipients = _project_recipients(project)
    if not recipients:
        return
    uploader = instance.uploaded_by
    subject = f"New document version for {project.title}"
    uploader_name = str(uploader) if uploader else 'Someone'
    message = (
        f"{uploader_name} uploaded a new version (v{instance.version}) of {instance.document.title}."
    )
    notify_users(
        recipients,
        subject,
        message,
        template_name=None,
        content_object=project,
    )


@receiver(post_save, sender=ProjectUpdate)
def project_update_notification(sender, instance, created, **kwargs):
    if not created or not instance.is_customer_visible:
        return
    project = instance.project
    recipients = _project_recipients(project)
    if not recipients:
        return
    subject = f"Project update: {instance.title}"
    message = instance.body[:300]
    notify_users(
        recipients,
        subject,
        message,
        template_name=None,
        content_object=project,
    )


@receiver(post_save, sender=ProjectTask)
def project_task_notification(sender, instance, created, **kwargs):
    project = instance.project
    recipients = _project_recipients(project)
    if not recipients:
        return

    if created:
        subject = f"New task assigned: {instance.title}"
        message = f"A new task '{instance.title}' has been created for {project.title}."
    elif instance.status == ProjectTaskStatus.COMPLETED:
        subject = f"Task completed: {instance.title}"
        message = f"Task '{instance.title}' has been marked as completed."
    else:
        return

    notify_users(
        recipients,
        subject,
        message,
        template_name=None,
        content_object=project,
    )
