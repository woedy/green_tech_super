from datetime import date, timedelta
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock, patch

import importlib.util
import sys
from pathlib import Path

from django.test import SimpleTestCase
from django.utils import timezone

from construction.tasks import build_project_tasks_ics, mark_overdue_tasks


class _StubSerializer:
    def __init__(self, *args, **kwargs):
        pass


# Stub external serializer modules referenced by project serializers.
mock_properties_serializers = sys.modules.get('properties.serializers')
if mock_properties_serializers is None:
    mock_properties_serializers = ModuleType('properties.serializers')
    sys.modules['properties.serializers'] = mock_properties_serializers
setattr(mock_properties_serializers, 'PropertySerializer', _StubSerializer)

mock_ghana_serializers = ModuleType('construction.ghana.serializers')
mock_ghana_serializers.EcoFeatureSerializer = _StubSerializer
sys.modules['construction.ghana.serializers'] = mock_ghana_serializers

import construction.models as construction_models  # noqa: E402

if not hasattr(construction_models, 'ConstructionRequestEcoFeature'):
    class _StubEcoFeature:  # pragma: no cover - simple stand-in
        pass

    setattr(construction_models, 'ConstructionRequestEcoFeature', _StubEcoFeature)

if not hasattr(construction_models, 'ConstructionRequestStep'):
    class _StubStep:  # pragma: no cover - simple stand-in
        pass

    setattr(construction_models, 'ConstructionRequestStep', _StubStep)

if not hasattr(construction_models, 'ProjectDocumentType'):
    class _StubDocType:  # pragma: no cover - simple stand-in
        pass

    setattr(construction_models, 'ProjectDocumentType', _StubDocType)

if not hasattr(construction_models, 'ProjectUpdateCategory'):
    class _StubUpdateCategory:  # pragma: no cover - simple stand-in
        pass

    setattr(construction_models, 'ProjectUpdateCategory', _StubUpdateCategory)

if not hasattr(construction_models, 'ProjectMessageReceipt'):
    class _StubMessageReceipt:  # pragma: no cover - simple stand-in
        pass

    setattr(construction_models, 'ProjectMessageReceipt', _StubMessageReceipt)

if not hasattr(construction_models, 'ProjectChatMessage'):
    class _StubChatMessage:  # pragma: no cover - simple stand-in
        pass

    setattr(construction_models, 'ProjectChatMessage', _StubChatMessage)

# Dynamically load the project serializers module without importing the heavy app registry.
serializers_package = ModuleType('construction.serializers')
sys.modules['construction.serializers'] = serializers_package
from accounts.serializers import UserSerializer as AccountsUserSerializer  # noqa: E402
serializers_package.UserSerializer = AccountsUserSerializer

project_serializers_path = (
    Path(__file__).resolve().parent.parent / 'serializers' / 'project_serializers.py'
)
project_spec = importlib.util.spec_from_file_location(
    'construction.serializers.project_serializers', project_serializers_path
)
project_serializers = importlib.util.module_from_spec(project_spec)
project_serializers.ProjectDocumentSerializer = _StubSerializer
project_serializers.ProjectUpdateSerializer = _StubSerializer
project_serializers.ProjectTaskSerializer = _StubSerializer
project_serializers.ProjectMessageReceipt = getattr(construction_models, 'ProjectMessageReceipt')
project_serializers.ProjectChatMessage = getattr(construction_models, 'ProjectChatMessage')
sys.modules['construction.serializers.project_serializers'] = project_serializers
serializers_package.project_serializers = project_serializers

quote_serializers = ModuleType('construction.serializers.quote_serializers')
quote_serializers.QuoteSerializer = _StubSerializer
sys.modules['construction.serializers.quote_serializers'] = quote_serializers
serializers_package.quote_serializers = quote_serializers

project_spec.loader.exec_module(project_serializers)  # type: ignore[arg-type]

from construction.models import ProjectTaskStatus  # noqa: E402
from construction.notifications import notify_overdue_project_task  # noqa: E402
from construction.serializers.project_serializers import ProjectTaskWriteSerializer  # noqa: E402


class _FakeTask:
    def __init__(self, *, task_id='task-1', title='Sample Task', due_days=1,
                 status=ProjectTaskStatus.PENDING, description='Review plans',
                 assigned_name='Task Owner', requires_customer_action=False):
        self.id = task_id
        self.title = title
        self.description = description
        self.due_date = timezone.now().date() + timedelta(days=due_days)
        self.status = status
        self.assigned_to = SimpleNamespace(
            get_full_name=lambda: assigned_name,
            email='assignee@example.com',
        )
        self.requires_customer_action = requires_customer_action
        self.project = SimpleNamespace(title='Eco Build', id=42)
        self.overdue_notified_at = None
        self._saved_with = None

    def get_status_display(self):
        return {
            ProjectTaskStatus.PENDING: 'Pending',
            ProjectTaskStatus.IN_PROGRESS: 'In Progress',
            ProjectTaskStatus.BLOCKED: 'Blocked',
            ProjectTaskStatus.COMPLETED: 'Completed',
        }[self.status]

    def save(self, update_fields=None):
        self._saved_with = update_fields


class ProjectTaskSerializerValidationTests(SimpleTestCase):
    def setUp(self):
        self.project = SimpleNamespace(project_manager_id=1)
        self.view = SimpleNamespace(get_project=lambda: self.project)

    def _make_serializer(self, user):
        request = SimpleNamespace(user=user)
        return ProjectTaskWriteSerializer(
            instance=None,
            context={'request': request, 'project': self.project, 'view': self.view},
        )

    def test_customer_cannot_modify_non_status_fields(self):
        customer = SimpleNamespace(id=2, is_staff=False, is_superuser=False)
        serializer = self._make_serializer(customer)
        with self.assertRaisesMessage(Exception, 'Customers may only update the status'):
            serializer.validate({'due_date': timezone.now().date()})

    def test_customer_can_change_status(self):
        customer = SimpleNamespace(id=2, is_staff=False, is_superuser=False)
        serializer = self._make_serializer(customer)
        data = serializer.validate({'status': ProjectTaskStatus.COMPLETED})
        self.assertEqual(data['status'], ProjectTaskStatus.COMPLETED)

    def test_project_manager_allowed_other_fields(self):
        manager = SimpleNamespace(id=1, is_staff=False, is_superuser=False)
        serializer = self._make_serializer(manager)
        result = serializer.validate({'due_date': timezone.now().date()})
        self.assertIn('due_date', result)

    def test_staff_member_allowed_other_fields(self):
        agent = SimpleNamespace(id=5, is_staff=True, is_superuser=False)
        serializer = self._make_serializer(agent)
        result = serializer.validate({'priority': 'high'})
        self.assertEqual(result['priority'], 'high')


class TaskUtilitiesTests(SimpleTestCase):
    def test_build_project_tasks_ics_contains_event(self):
        project = SimpleNamespace(title='Solar Estate')
        task = _FakeTask(title='Install Solar Panels', due_days=2)
        ics = build_project_tasks_ics(project, [task])
        self.assertIn('BEGIN:VCALENDAR', ics)
        self.assertIn('SUMMARY:Install Solar Panels', ics)
        self.assertIn('STATUS:CONFIRMED', ics)

    def test_mark_overdue_tasks_updates_timestamp(self):
        task = _FakeTask(due_days=-1)
        notifier = MagicMock()
        now = timezone.now()

        mark_overdue_tasks([task], notifier, timestamp=now)

        notifier.assert_called_once_with(task)
        self.assertEqual(task.overdue_notified_at, now)
        self.assertEqual(task._saved_with, ['overdue_notified_at', 'updated_at'])


class OverdueTaskNotificationTests(SimpleTestCase):
    def setUp(self):
        self.manager = SimpleNamespace(id=1, is_active=True, get_full_name=lambda: 'Project Manager', email='manager@example.com')
        self.supervisor = SimpleNamespace(id=2, is_active=True, get_full_name=lambda: 'Site Supervisor', email='supervisor@example.com')
        self.assignee = SimpleNamespace(id=3, is_active=True, get_full_name=lambda: 'Task Owner', email='assignee@example.com')
        self.customer = SimpleNamespace(id=4, is_active=True, get_full_name=lambda: 'Customer', email='customer@example.com')

        self.project = SimpleNamespace(
            id=10,
            title='Eco Build',
            project_manager=self.manager,
            site_supervisor=self.supervisor,
            construction_request=SimpleNamespace(client=self.customer),
        )

        self.task = SimpleNamespace(
            id=20,
            title='Customer upload warranty',
            project=self.project,
            assigned_to=self.assignee,
            requires_customer_action=True,
            status=ProjectTaskStatus.PENDING,
            due_date=date.today() - timedelta(days=1),
        )

    def test_notify_overdue_project_task_targets_stakeholders(self):
        with patch('construction.notifications.notify_users') as mock_notify:
            notify_overdue_project_task(self.task)

        mock_notify.assert_called_once()
        recipients = mock_notify.call_args[0][0]
        self.assertEqual({user.id for user in recipients}, {1, 2, 3, 4})
        context = mock_notify.call_args[1]['template_context']
        self.assertEqual(context['category'], 'project_tasks')
        self.assertEqual(context['project_id'], self.project.id)
        self.assertEqual(context['task_id'], str(self.task.id))

    def test_completed_task_does_not_trigger_notification(self):
        self.task.status = ProjectTaskStatus.COMPLETED
        with patch('construction.notifications.notify_users') as mock_notify:
            notify_overdue_project_task(self.task)
        mock_notify.assert_not_called()
