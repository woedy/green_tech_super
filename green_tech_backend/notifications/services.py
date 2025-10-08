"""
Notification services for real-time delivery and Ghana-specific features.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, time
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.template import Template, Context
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationStatus, NotificationType, NotificationPriority
)
from .consumers import send_notification_to_user, update_user_unread_count

User = get_user_model()
logger = logging.getLogger(__name__)


class GhanaNotificationService:
    """
    Service for handling notifications with Ghana-specific timing and localization.
    """
    
    # Ghana timezone-appropriate hours for notifications
    GHANA_BUSINESS_HOURS = {
        'start': time(8, 0),  # 8:00 AM
        'end': time(18, 0),   # 6:00 PM
    }
    
    # Ghana-specific message templates
    GHANA_TEMPLATES = {
        'project_milestone': {
            'en': "Your {project_name} project has reached a new milestone: {milestone_name}. Progress: {progress}%",
            'tw': "Wo {project_name} adwuma no adu milestone foforo: {milestone_name}. Nkɔso: {progress}%"
        },
        'quote_ready': {
            'en': "Your construction quote for {project_name} is ready. Total: GHS {total_amount}",
            'tw': "Wo {project_name} quote no ayɛ. Nyinaa: GHS {total_amount}"
        },
        'payment_reminder': {
            'en': "Payment reminder: GHS {amount} due for {project_name} on {due_date}",
            'tw': "Kae sɛ wobɛtua: GHS {amount} wɔ {project_name} wɔ {due_date}"
        }
    }

    def __init__(self):
        self.channel_layer = get_channel_layer()

    def create_notification(
        self,
        recipient: User,
        subject: str,
        message: str,
        notification_type: str = NotificationType.IN_APP,
        priority: str = NotificationPriority.NORMAL,
        template_name: Optional[str] = None,
        template_context: Optional[Dict[str, Any]] = None,
        content_object: Optional[Any] = None,
        send_immediately: bool = True
    ) -> Notification:
        """
        Create a notification with Ghana-specific considerations.
        """
        # Check user preferences
        preferences = self._get_user_preferences(recipient)
        if not preferences.can_receive_notification(notification_type):
            logger.info(f"Notification blocked by user preferences: {recipient.id}")
            return None

        # Apply Ghana-specific message localization
        if template_name and template_name in self.GHANA_TEMPLATES:
            user_language = getattr(recipient, 'preferred_language', 'en')
            if user_language in self.GHANA_TEMPLATES[template_name]:
                template_text = self.GHANA_TEMPLATES[template_name][user_language]
                if template_context:
                    template = Template(template_text)
                    context = Context(template_context)
                    message = template.render(context)

        # Create notification
        notification = Notification.objects.create(
            recipient=recipient,
            subject=subject,
            message=message,
            notification_type=notification_type,
            priority=priority,
            template_context=template_context or {},
            content_object=content_object
        )

        if send_immediately:
            self.send_notification(notification)

        return notification

    def send_notification(self, notification: Notification) -> bool:
        """
        Send notification through appropriate channels with Ghana timing considerations.
        """
        try:
            # Check if it's appropriate time to send in Ghana
            if not self._is_appropriate_time_ghana(notification):
                logger.info(f"Delaying notification {notification.id} due to Ghana time restrictions")
                return False

            # Send via WebSocket for real-time delivery
            if notification.notification_type in [NotificationType.IN_APP, NotificationType.PUSH]:
                self._send_websocket_notification(notification)

            # Send via email if enabled
            if notification.notification_type == NotificationType.EMAIL:
                self._send_email_notification(notification)

            # Send via SMS if enabled (Ghana-specific)
            if notification.notification_type == NotificationType.SMS:
                self._send_sms_notification(notification)

            # Mark as sent
            notification.mark_as_sent()
            
            # Update user's unread count
            async_to_sync(update_user_unread_count)(notification.recipient.id)
            
            return True

        except Exception as e:
            logger.error(f"Failed to send notification {notification.id}: {str(e)}")
            notification.mark_as_failed()
            return False

    def send_bulk_notifications(
        self,
        recipients: List[User],
        subject: str,
        message: str,
        notification_type: str = NotificationType.IN_APP,
        priority: str = NotificationPriority.NORMAL,
        template_context: Optional[Dict[str, Any]] = None
    ) -> List[Notification]:
        """
        Send notifications to multiple users efficiently.
        """
        notifications = []
        
        for recipient in recipients:
            notification = self.create_notification(
                recipient=recipient,
                subject=subject,
                message=message,
                notification_type=notification_type,
                priority=priority,
                template_context=template_context,
                send_immediately=False
            )
            if notification:
                notifications.append(notification)

        # Send all notifications
        for notification in notifications:
            self.send_notification(notification)

        return notifications

    def send_project_update(
        self,
        project,
        milestone_name: str,
        progress: int,
        recipients: Optional[List[User]] = None
    ):
        """
        Send project milestone update with Ghana-specific formatting.
        """
        if not recipients:
            # Get all project stakeholders
            recipients = [project.customer, project.agent]
            if hasattr(project, 'team_members'):
                recipients.extend(project.team_members.all())

        template_context = {
            'project_name': project.title if hasattr(project, 'title') else f"Project #{project.id}",
            'milestone_name': milestone_name,
            'progress': progress,
            'project_id': project.id
        }

        for recipient in recipients:
            self.create_notification(
                recipient=recipient,
                subject=f"Project Update: {milestone_name}",
                message="",  # Will be filled by template
                notification_type=NotificationType.IN_APP,
                priority=NotificationPriority.HIGH,
                template_name='project_milestone',
                template_context=template_context,
                content_object=project
            )

    def send_quote_notification(
        self,
        quote,
        recipient: User,
        notification_type: str = NotificationType.EMAIL
    ):
        """
        Send quote-related notification with Ghana currency formatting.
        """
        template_context = {
            'project_name': quote.construction_request.title if hasattr(quote, 'construction_request') else 'Your Project',
            'total_amount': f"{quote.total_cost:,.2f}",
            'quote_id': quote.id,
            'currency': 'GHS'
        }

        self.create_notification(
            recipient=recipient,
            subject="Your Construction Quote is Ready",
            message="",  # Will be filled by template
            notification_type=notification_type,
            priority=NotificationPriority.HIGH,
            template_name='quote_ready',
            template_context=template_context,
            content_object=quote
        )

    def send_payment_reminder(
        self,
        project,
        amount: float,
        due_date: datetime,
        recipient: User
    ):
        """
        Send payment reminder with Ghana-specific formatting.
        """
        template_context = {
            'project_name': project.title if hasattr(project, 'title') else f"Project #{project.id}",
            'amount': f"{amount:,.2f}",
            'due_date': due_date.strftime('%d/%m/%Y'),  # Ghana date format
            'currency': 'GHS'
        }

        self.create_notification(
            recipient=recipient,
            subject="Payment Reminder",
            message="",  # Will be filled by template
            notification_type=NotificationType.EMAIL,
            priority=NotificationPriority.HIGH,
            template_name='payment_reminder',
            template_context=template_context,
            content_object=project
        )

    def _send_websocket_notification(self, notification: Notification):
        """
        Send notification via WebSocket for real-time delivery.
        """
        from .serializers import NotificationSerializer
        
        serializer = NotificationSerializer(notification)
        notification_data = serializer.data
        
        # Send to user's WebSocket group
        async_to_sync(send_notification_to_user)(
            notification.recipient.id,
            notification_data
        )

    def _send_email_notification(self, notification: Notification):
        """
        Send notification via email.
        """
        from django.core.mail import send_mail
        
        try:
            send_mail(
                subject=notification.subject,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.recipient.email],
                fail_silently=False
            )
            logger.info(f"Email sent for notification {notification.id}")
        except Exception as e:
            logger.error(f"Failed to send email for notification {notification.id}: {str(e)}")
            raise

    def _send_sms_notification(self, notification: Notification):
        """
        Send notification via SMS (Ghana-specific implementation).
        """
        # This would integrate with Ghana SMS providers like:
        # - MTN Ghana
        # - Vodafone Ghana
        # - AirtelTigo
        
        # Placeholder implementation
        logger.info(f"SMS notification {notification.id} would be sent to {notification.recipient.phone_number}")
        
        # In production, integrate with SMS gateway:
        # try:
        #     sms_service = GhanaSMSService()
        #     sms_service.send_sms(
        #         to=notification.recipient.phone_number,
        #         message=notification.message
        #     )
        # except Exception as e:
        #     logger.error(f"Failed to send SMS for notification {notification.id}: {str(e)}")
        #     raise

    def _is_appropriate_time_ghana(self, notification: Notification) -> bool:
        """
        Check if it's appropriate time to send notification in Ghana timezone.
        """
        if notification.priority == NotificationPriority.URGENT:
            return True  # Urgent notifications can be sent anytime

        # Convert to Ghana time (GMT+0)
        ghana_time = timezone.now().time()
        
        # Check if within business hours
        return (
            self.GHANA_BUSINESS_HOURS['start'] <= ghana_time <= self.GHANA_BUSINESS_HOURS['end']
        )

    def _get_user_preferences(self, user: User) -> UserNotificationPreference:
        """
        Get or create user notification preferences.
        """
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=user
        )
        return preferences


# Convenience functions for common notification scenarios
def notify_project_milestone(project, milestone_name: str, progress: int):
    """Quick function to notify about project milestones."""
    service = GhanaNotificationService()
    service.send_project_update(project, milestone_name, progress)


def notify_quote_ready(quote, recipient: User):
    """Quick function to notify about ready quotes."""
    service = GhanaNotificationService()
    service.send_quote_notification(quote, recipient)


def notify_payment_due(project, amount: float, due_date: datetime, recipient: User):
    """Quick function to notify about payment due."""
    service = GhanaNotificationService()
    service.send_payment_reminder(project, amount, due_date, recipient)


def notify_users(
    recipients: List[User],
    subject: str,
    message: str,
    notification_type: str = NotificationType.IN_APP,
    priority: str = NotificationPriority.NORMAL,
    content_object: Optional[Any] = None,
    template_context: Optional[Dict[str, Any]] = None
) -> List[Notification]:
    """
    Send notifications to multiple users.
    This function provides compatibility with the expected interface.
    """
    service = GhanaNotificationService()
    notifications = []
    
    for recipient in recipients:
        notification = service.create_notification(
            recipient=recipient,
            subject=subject,
            message=message,
            notification_type=notification_type,
            priority=priority,
            template_context=template_context,
            content_object=content_object,
            send_immediately=True
        )
        if notification:
            notifications.append(notification)
    
    return notifications