""
Services for handling notifications.
"""
import logging
from typing import List, Optional, Union
from django.conf import settings
from django.template import Template, Context
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

from .models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationType, NotificationStatus
)

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationService:
    """Service class for handling notification operations."""
    
    def __init__(self, notification_type: str = NotificationType.IN_APP):
        """Initialize the notification service."""
        self.notification_type = notification_type
    
    def send_notification(
        self,
        recipient: User,
        subject: str,
        message: str,
        priority: str = 'normal',
        content_object: Optional[object] = None,
        template_name: Optional[str] = None,
        template_context: Optional[dict] = None,
        **kwargs
    ) -> Notification:
        """
        Send a notification to a user.
        
        Args:
            recipient: User to receive the notification
            subject: Notification subject
            message: Notification message (can be a template string)
            priority: Notification priority (low, normal, high, urgent)
            content_object: Optional related object
            template_name: Optional template name to use
            template_context: Context data for template rendering
            **kwargs: Additional notification fields
            
        Returns:
            Notification: The created notification
        """
        # Get or create notification preferences
        preferences, _ = UserNotificationPreference.objects.get_or_create(user=recipient)
        
        # Check if user can receive this type of notification
        if not preferences.can_receive_notification(self.notification_type):
            logger.debug(
                f"User {recipient.id} has disabled {self.notification_type} notifications"
            )
            return None
        
        # Get template if template_name is provided
        template = None
        if template_name:
            try:
                template = NotificationTemplate.objects.get(
                    name=template_name,
                    is_active=True,
                    notification_type=self.notification_type
                )
                # Use template subject and message if available
                subject = template.subject
                message = template.template
            except NotificationTemplate.DoesNotExist:
                logger.warning(f"Template {template_name} not found or inactive")
        
        # Render template with context if provided
        if template_context:
            template_obj = Template(message)
            context = Context(template_context)
            message = template_obj.render(context)
        
        # Create the notification
        notification_data = {
            'recipient': recipient,
            'subject': subject,
            'message': message,
            'notification_type': self.notification_type,
            'priority': priority,
            'template': template,
            'template_context': template_context or {},
            **kwargs
        }
        
        if content_object:
            notification_data['content_type'] = ContentType.objects.get_for_model(content_object)
            notification_data['object_id'] = content_object.id
        
        notification = Notification.objects.create(**notification_data)
        
        # Send the notification based on its type
        self._send_notification(notification)
        
        return notification
    
    def send_bulk_notifications(
        self,
        recipients: List[User],
        subject: str,
        message: str,
        priority: str = 'normal',
        content_object: Optional[object] = None,
        template_name: Optional[str] = None,
        template_context: Optional[dict] = None,
        **kwargs
    ) -> List[Notification]:
        """
        Send the same notification to multiple users.
        
        Args:
            recipients: List of users to receive the notification
            subject: Notification subject
            message: Notification message (can be a template string)
            priority: Notification priority (low, normal, high, urgent)
            content_object: Optional related object
            template_name: Optional template name to use
            template_context: Context data for template rendering
            **kwargs: Additional notification fields
            
        Returns:
            List[Notification]: List of created notifications
        """
        notifications = []
        
        for recipient in recipients:
            notification = self.send_notification(
                recipient=recipient,
                subject=subject,
                message=message,
                priority=priority,
                content_object=content_object,
                template_name=template_name,
                template_context=template_context,
                **kwargs
            )
            
            if notification:
                notifications.append(notification)
        
        return notifications
    
    def _send_notification(self, notification: Notification) -> None:
        """
        Send a notification based on its type.
        
        Args:
            notification: The notification to send
        """
        try:
            # In a real implementation, this would connect to email/SMS/push services
            if notification.notification_type == NotificationType.EMAIL:
                self._send_email(notification)
            elif notification.notification_type == NotificationType.SMS:
                self._send_sms(notification)
            elif notification.notification_type == NotificationType.PUSH:
                self._send_push(notification)
            
            # For in-app notifications, we just mark them as sent
            notification.status = NotificationStatus.SENT
            notification.sent_at = timezone.now()
            notification.save(update_fields=['status', 'sent_at', 'updated_at'])
            
        except Exception as e:
            # Log the error and mark as failed
            logger.error(f"Failed to send notification {notification.id}: {str(e)}", exc_info=True)
            notification.status = NotificationStatus.FAILED
            notification.save(update_fields=['status', 'updated_at'])
    
    def _send_email(self, notification: Notification) -> None:
        """
        Send an email notification.
        
        Args:
            notification: The notification to send
        """
        # In a real implementation, this would use Django's email backend
        # or a third-party service like SendGrid or Amazon SES
        logger.info(
            f"[EMAIL] To: {notification.recipient.email} | "
            f"Subject: {notification.subject}\n{notification.message}"
        )
    
    def _send_sms(self, notification: Notification) -> None:
        """
        Send an SMS notification.
        
        Args:
            notification: The notification to send
        """
        # In a real implementation, this would use an SMS gateway like Twilio
        logger.info(
            f"[SMS] To: {notification.recipient.phone_number} | "
            f"Message: {notification.message}"
        )
    
    def _send_push(self, notification: Notification) -> None:
        """
        Send a push notification.
        
        Args:
            notification: The notification to send
        """
        # In a real implementation, this would use a push notification service
        # like Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
        logger.info(
            f"[PUSH] To user {notification.recipient.id} | "
            f"Title: {notification.subject} | Message: {notification.message}"
        )


def notify_user(
    recipient: User,
    subject: str,
    message: str,
    notification_type: str = NotificationType.IN_APP,
    **kwargs
) -> Notification:
    """
    Convenience function to send a notification to a user.
    
    Args:
        recipient: User to receive the notification
        subject: Notification subject
        message: Notification message
        notification_type: Type of notification (email, sms, push, in_app)
        **kwargs: Additional arguments to pass to NotificationService
        
    Returns:
        Notification: The created notification
    """
    service = NotificationService(notification_type=notification_type)
    return service.send_notification(recipient, subject, message, **kwargs)


def notify_users(
    recipients: List[User],
    subject: str,
    message: str,
    notification_type: str = NotificationType.IN_APP,
    **kwargs
) -> List[Notification]:
    """
    Convenience function to send the same notification to multiple users.
    
    Args:
        recipients: List of users to receive the notification
        subject: Notification subject
        message: Notification message
        notification_type: Type of notification (email, sms, push, in_app)
        **kwargs: Additional arguments to pass to NotificationService
        
    Returns:
        List[Notification]: List of created notifications
    """
    service = NotificationService(notification_type=notification_type)
    return service.send_bulk_notifications(recipients, subject, message, **kwargs)
