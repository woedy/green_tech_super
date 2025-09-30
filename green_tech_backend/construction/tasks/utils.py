"""Helper functions for project task calendar exports and notifications."""
from __future__ import annotations

from datetime import timedelta
from typing import Iterable

from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def build_project_tasks_ics(project, tasks: Iterable) -> str:
    """Return an ICS payload for the provided project tasks."""

    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Green Tech Africa//Project Tasks//EN',
        'CALSCALE:GREGORIAN',
        f'X-WR-CALNAME:{_escape_ics_text(getattr(project, "title", "Project Tasks"))} Tasks',
    ]

    dtstamp = timezone.now().strftime('%Y%m%dT%H%M%SZ')
    for task in tasks:
        due_date = getattr(task, 'due_date', None)
        if not due_date:
            continue

        dtstart = due_date.strftime('%Y%m%d')
        dtend = (due_date + timedelta(days=1)).strftime('%Y%m%d')
        lines.extend([
            'BEGIN:VEVENT',
            f'UID:{getattr(task, "id", "task")}@green-tech-africa',
            f'DTSTAMP:{dtstamp}',
            f'DTSTART;VALUE=DATE:{dtstart}',
            f'DTEND;VALUE=DATE:{dtend}',
            f'SUMMARY:{_escape_ics_text(getattr(task, "title", "Task"))}',
        ])

        description_parts: list[str] = []
        description = getattr(task, 'description', '')
        if description:
            description_parts.append(str(description))

        status_display = None
        if hasattr(task, 'get_status_display'):
            status_display = task.get_status_display()
        elif hasattr(task, 'status'):
            status_display = getattr(task, 'status')
        if status_display:
            description_parts.append(_('Status: %(status)s') % {'status': status_display})

        assignee = getattr(task, 'assigned_to', None)
        if assignee:
            full_name = getattr(assignee, 'get_full_name', lambda: '')()
            fallback = getattr(assignee, 'email', '')
            assignee_name = full_name or fallback
            if assignee_name:
                description_parts.append(
                    _('Assigned to %(name)s') % {'name': assignee_name}
                )

        if description_parts:
            lines.append('DESCRIPTION:' + _escape_ics_text('\n'.join(description_parts)))

        lines.append('STATUS:CONFIRMED')
        lines.append('END:VEVENT')

    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines) + '\r\n'


def mark_overdue_tasks(tasks: Iterable, notifier, *, timestamp=None) -> None:
    """Send notifications for overdue tasks and update their audit fields."""

    timestamp = timestamp or timezone.now()
    for task in tasks:
        notifier(task)
        setattr(task, 'overdue_notified_at', timestamp)
        save = getattr(task, 'save', None)
        if callable(save):
            save(update_fields=['overdue_notified_at', 'updated_at'])


def _escape_ics_text(value: str) -> str:
    return (
        str(value)
        .replace('\\', '\\\\')
        .replace('\n', '\\n')
        .replace('\r', '\\r')
        .replace(',', '\\,')
        .replace(';', '\\;')
    )
