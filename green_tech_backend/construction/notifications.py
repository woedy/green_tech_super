"""Notification helpers for construction chat events."""
from __future__ import annotations

from typing import Iterable, Optional, Set

from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from django.utils import timezone

from construction.models import (
    Project,
    ProjectChatMessage,
    ProjectTask,
    ProjectTaskStatus,
)
from notifications.models import NotificationType
from notifications.services import notify_users

User = get_user_model()


def _unique_active_users(users: Iterable[Optional[User]]) -> list[User]:
    """Return a deduplicated list of active users from the iterable."""

    seen: Set[int] = set()
    unique_users: list[User] = []
    for user in users:
        if not user or not user.is_active:
            continue
        if user.id in seen:
            continue
        seen.add(user.id)
        unique_users.append(user)
    return unique_users


def _project_participants(project: Project, *, exclude_user_id: Optional[int] = None) -> list[User]:
    """Collect project stakeholders who should receive chat notifications."""

    # Reload with the relations needed to avoid lazy queries inside signal handlers.
    project = (
        Project.objects.select_related(
            'project_manager',
            'site_supervisor',
            'construction_request__client',
            'construction_request__project_manager',
        )
        .prefetch_related('contractors', 'construction_request__contractors')
        .get(pk=project.pk)
    )

    participants: list[Optional[User]] = [
        project.project_manager,
        project.site_supervisor,
    ]

    participants.extend(project.contractors.all())

    request = project.construction_request
    if request:
        participants.extend(
            [
                request.client,
                request.project_manager,
            ]
        )
        participants.extend(request.contractors.all())

    quote = getattr(project, 'approved_quote', None)
    if quote:
        req = getattr(quote, 'construction_request', None)
        if req:
            participants.append(getattr(req, 'client', None))
            participants.append(getattr(req, 'project_manager', None))

    if exclude_user_id:
        participants = [
            user for user in participants if getattr(user, 'id', None) != exclude_user_id
        ]

    return _unique_active_users(participants)


def notify_project_chat_message(message: ProjectChatMessage) -> None:
    """Alert project stakeholders about a newly created chat message."""

    recipients = _project_participants(
        message.project, exclude_user_id=getattr(message.sender, 'id', None)
    )
    if not recipients:
        return

    project = message.project
    subject = _('New message in project %(title)s') % {'title': project.title}
    body = message.body.strip()
    if len(body) > 200:
        body = f"{body[:197]}..."

    notify_users(
        recipients,
        subject=subject,
        message=body,
        notification_type=NotificationType.IN_APP,
        content_object=message,
        template_context={
            'category': 'project_updates',
            'project_id': project.id,
            'project_title': project.title,
            'message_id': str(message.id),
            'sender_id': getattr(message.sender, 'id', None),
        },
    )


def _task_notification_recipients(task: ProjectTask) -> list[User]:
    """Determine who should be alerted about an overdue project task."""

    project = task.project
    participants: list[Optional[User]] = [
        project.project_manager,
        project.site_supervisor,
        task.assigned_to,
    ]

    request = getattr(project, 'construction_request', None)
    if request and task.requires_customer_action:
        participants.append(getattr(request, 'client', None))

    return _unique_active_users(participants)


def notify_overdue_project_task(task: ProjectTask) -> None:
    """Send an alert when a task passes its due date without completion."""

    if task.status == ProjectTaskStatus.COMPLETED:
        return

    recipients = _task_notification_recipients(task)
    if not recipients:
        return

    project = task.project
    due_date_display = task.due_date.strftime('%Y-%m-%d') if task.due_date else _('unspecified')
    subject = _('Task overdue: %(title)s') % {'title': task.title}
    message = _(
        'Task "%(task)s" for project %(project)s was due on %(due_date)s and is now overdue.'
    ) % {'task': task.title, 'project': project.title, 'due_date': due_date_display}

    notify_users(
        recipients,
        subject=subject,
        message=message,
        notification_type=NotificationType.IN_APP,
        content_object=task,
        template_context={
            'category': 'project_tasks',
            'project_id': project.id,
            'project_title': project.title,
            'task_id': str(task.id),
            'due_date': due_date_display,
            'requires_customer_action': task.requires_customer_action,
            'triggered_at': timezone.now().isoformat(),
        },
    )
