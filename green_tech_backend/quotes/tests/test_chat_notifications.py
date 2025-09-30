from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save
from django.test import TestCase

from locations.models import Region
from notifications.models import Notification
from plans.models import BuildRequest, Plan, PlanStyle
from plans.signals import plan_post_save
from quotes.models import Quote, QuoteChatMessage
from quotes.notifications import notify_quote_chat_message

User = get_user_model()


class QuoteChatNotificationTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@example.com', password='testpass', first_name='Customer'
        )
        self.agent = User.objects.create_user(
            email='agent@example.com', password='testpass', first_name='Agent'
        )

        self.region = Region.objects.create(
            slug='greater-accra',
            name='Greater Accra',
            country='Ghana',
            currency_code='GHS',
            cost_multiplier=Decimal('1.10'),
        )

        post_save.disconnect(plan_post_save, sender=Plan)
        try:
            self.plan = Plan.objects.create(
                slug='solar-bungalow',
                name='Solar Bungalow',
                style=PlanStyle.BUNGALOW,
                bedrooms=3,
                bathrooms=2,
                floors=1,
                area_sq_m=Decimal('140.00'),
                base_price=Decimal('120000.00'),
                base_currency='USD',
            )
        finally:
            post_save.connect(plan_post_save, sender=Plan)

        self.build_request = BuildRequest.objects.create(
            plan=self.plan,
            region=self.region,
            user=self.customer,
            contact_name='Customer Name',
            contact_email=self.customer.email,
            contact_phone='+233555000000',
            budget_currency='USD',
        )

        self.quote = Quote.objects.create(build_request=self.build_request, region=self.region)
        self.quote.prepared_by_email = self.agent.email
        self.quote.recipient_email = self.customer.email
        self.quote.save(update_fields=['prepared_by_email', 'recipient_email'])

    def _notifications_for(self, message):
        content_type = ContentType.objects.get_for_model(QuoteChatMessage)
        return Notification.objects.filter(content_type=content_type, object_id=message.id)

    def test_agent_message_notifies_customer(self):
        message = QuoteChatMessage.objects.create(
            quote=self.quote,
            sender=self.agent,
            body='Hello from your project consultant.',
        )

        notify_quote_chat_message(message)
        notifications = self._notifications_for(message)
        self.assertEqual(notifications.count(), 1)
        self.assertEqual(notifications.first().recipient, self.customer)
        self.assertEqual(notifications.first().template_context.get('category'), 'quote_updates')

    def test_customer_message_notifies_agent(self):
        message = QuoteChatMessage.objects.create(
            quote=self.quote,
            sender=self.customer,
            body='Thanks for the update!',
        )

        notify_quote_chat_message(message)
        notifications = self._notifications_for(message)
        self.assertEqual(notifications.count(), 1)
        self.assertEqual(notifications.first().recipient, self.agent)
