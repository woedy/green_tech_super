from types import SimpleNamespace
from uuid import uuid4
from unittest.mock import patch

from django.test import SimpleTestCase

from construction.notifications import notify_project_chat_message


class _Members:
    """Minimal helper replicating the queryset API used in notifications."""

    def __init__(self, members):
        self._members = list(members)

    def all(self):
        return list(self._members)


class ProjectChatNotificationTests(SimpleTestCase):
    def setUp(self):
        self.manager = SimpleNamespace(id=1, is_active=True)
        self.supervisor = SimpleNamespace(id=2, is_active=True)
        self.contractor = SimpleNamespace(id=3, is_active=True)
        self.customer = SimpleNamespace(id=4, is_active=True)

        self.construction_request = SimpleNamespace(
            client=self.customer,
            project_manager=self.manager,
            contractors=_Members([self.contractor]),
        )

        self.project = SimpleNamespace(
            pk=101,
            id=101,
            title='Eco Villa Project',
            project_manager=self.manager,
            site_supervisor=self.supervisor,
            contractors=_Members([self.contractor]),
            construction_request=self.construction_request,
            approved_quote=None,
        )

        self.message = SimpleNamespace(
            id=uuid4(),
            project=self.project,
            sender=self.manager,
            body='Site inspection scheduled for Friday.',
        )

    def test_project_chat_notifies_other_participants(self):
        with patch('construction.notifications.Project.objects.select_related') as mock_select_related, \
                patch('construction.notifications.notify_users') as mock_notify:
            prefetch_mock = mock_select_related.return_value
            get_mock = prefetch_mock.prefetch_related.return_value
            get_mock.get.return_value = self.project

            notify_project_chat_message(self.message)

        mock_notify.assert_called_once()
        args, kwargs = mock_notify.call_args
        recipients = args[0]
        self.assertEqual({user.id for user in recipients}, {2, 3, 4})
        self.assertIn('Eco Villa Project', kwargs['subject'])
        self.assertEqual(kwargs['template_context']['category'], 'project_updates')
        self.assertEqual(kwargs['template_context']['message_id'], str(self.message.id))
