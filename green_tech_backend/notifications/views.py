"""
Views for the notifications API.
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.template import Template, Context
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationStatus, NotificationType
)
from .serializers import (
    NotificationSerializer, NotificationTemplateSerializer,
    UserNotificationPreferenceSerializer, MarkAsReadSerializer,
    SendNotificationSerializer
)


class NotificationViewSet(mixins.ListModelMixin,
                         mixins.RetrieveModelMixin,
                         mixins.DestroyModelMixin,
                         viewsets.GenericViewSet):
    """
    API endpoint for managing user notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['notification_type', 'status', 'priority']
    search_fields = ['subject', 'message']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return notifications for the current user."""
        queryset = Notification.objects.filter(
            recipient=self.request.user
        ).select_related('content_type', 'template')
        
        # Filter by read status if provided
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read = is_read.lower() in ('true', '1', 'yes')
            if is_read:
                queryset = queryset.filter(status=NotificationStatus.READ)
            else:
                queryset = queryset.exclude(status=NotificationStatus.READ)
        
        return queryset

    def get_serializer_class(self):
        """Return the appropriate serializer class based on the action."""
        if self.action == 'mark_as_read':
            return MarkAsReadSerializer
        return super().get_serializer_class()

    def get_object(self):
        """Return the notification object with permission check."""
        obj = get_object_or_404(Notification, id=self.kwargs['pk'])
        
        # Only allow the recipient to access the notification
        if obj.recipient != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to access this notification.")
        
        return obj

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get the count of unread notifications for the current user."""
        count = self.get_queryset().exclude(status=NotificationStatus.READ).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all unread notifications as read for the current user."""
        updated = self.get_queryset().exclude(status=NotificationStatus.READ).update(
            status=NotificationStatus.READ,
            read_at=timezone.now()
        )
        return Response({'marked_read': updated})

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark specific notifications as read."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data['notification_ids']
        updated = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        ).exclude(status=NotificationStatus.READ).update(
            status=NotificationStatus.READ,
            read_at=timezone.now()
        )
        
        return Response({'marked_read': updated})


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing notification templates.
    """
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['notification_type', 'is_active']
    search_fields = ['name', 'subject', 'template']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']


class UserNotificationPreferenceViewSet(mixins.RetrieveModelMixin,
                                      mixins.UpdateModelMixin,
                                      viewsets.GenericViewSet):
    """
    API endpoint for managing user notification preferences.
    """
    serializer_class = UserNotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Return the notification preferences for the current user."""
        obj, _ = UserNotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj


class SendNotificationViewSet(viewsets.GenericViewSet):
    """
    API endpoint for sending notifications.
    """
    permission_classes = [IsAdminUser]
    serializer_class = SendNotificationSerializer
    
    def create(self, request, *args, **kwargs):
        """Send notifications to one or more users."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Get the content object if content_type and object_id are provided
        content_object = None
        if data.get('content_type') and data.get('object_id'):
            content_type = data['content_type']
            object_id = data['object_id']
            model_class = content_type.model_class()
            content_object = get_object_or_404(model_class, id=object_id)
        
        # Get the template if template_id is provided
        template = data.get('template_id')
        template_context = data.get('template_context', {})
        
        # If a template is provided, render the message
        message = data.get('message')
        if template:
            template_obj = Template(template.template)
            context = Context(template_context)
            message = template_obj.render(context)
        
        # Create notifications for each recipient
        notifications = []
        for user_id in data['recipient_ids']:
            notification = Notification(
                recipient_id=user_id,
                subject=data['subject'],
                message=message,
                notification_type=data['notification_type'],
                priority=data['priority'],
                template=template,
                template_context=template_context
            )
            
            if content_object:
                notification.content_object = content_object
            
            notifications.append(notification)
        
        # Bulk create notifications
        created_notifications = Notification.objects.bulk_create(notifications)
        
        # Send notifications based on their type
        self._send_notifications(created_notifications)
        
        return Response(
            {'notifications_sent': len(created_notifications)},
            status=status.HTTP_201_CREATED
        )
    
    def _send_notifications(self, notifications):
        """
        Send notifications based on their type.
        This is a placeholder that would be implemented with actual notification services.
        """
        for notification in notifications:
            try:
                # In a real implementation, this would connect to email/SMS/push services
                if notification.notification_type == NotificationType.EMAIL:
                    # Send email
                    pass
                elif notification.notification_type == NotificationType.SMS:
                    # Send SMS
                    pass
                elif notification.notification_type == NotificationType.PUSH:
                    # Send push notification
                    pass
                
                # Mark as sent
                notification.status = NotificationStatus.SENT
                notification.sent_at = timezone.now()
                notification.save(update_fields=['status', 'sent_at', 'updated_at'])
                
            except Exception as e:
                # Log the error and mark as failed
                notification.status = NotificationStatus.FAILED
                notification.save(update_fields=['status', 'updated_at'])
                # In a real implementation, you would log this error
                print(f"Failed to send notification {notification.id}: {str(e)}")


class NotificationTriggerViewSet(viewsets.GenericViewSet):
    """
    API endpoint for triggering notification workflows.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        """Send a test notification to the current user."""
        from django.contrib.auth import get_user_model
        from .services import NotificationService
        
        notification_type = request.data.get('notification_type', NotificationType.IN_APP)
        
        # Create a test notification
        notification = Notification.objects.create(
            recipient=request.user,
            subject="Test Notification",
            message="This is a test notification.",
            notification_type=notification_type,
            priority=NotificationPriority.NORMAL
        )
        
        # Send the notification
        NotificationService().send_notification(notification)
        
        return Response({
            'status': 'success',
            'message': 'Test notification sent',
            'notification_id': str(notification.id)
        })
