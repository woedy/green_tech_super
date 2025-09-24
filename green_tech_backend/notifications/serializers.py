""
Serializers for the notifications API.
"""
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import (
    Notification, NotificationTemplate, UserNotificationPreference,
    NotificationType, NotificationStatus, NotificationPriority
)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for NotificationTemplate model."""
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'subject', 'template', 'notification_type', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    priority_display = serializers.CharField(
        source='get_priority_display',
        read_only=True
    )
    content_type_name = serializers.SerializerMethodField()
    content_object = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'subject', 'message', 'notification_type', 'notification_type_display',
            'status', 'status_display', 'priority', 'priority_display', 'content_type',
            'content_type_name', 'object_id', 'content_object', 'template', 'is_read',
            'created_at', 'updated_at', 'sent_at', 'read_at'
        ]
        read_only_fields = (
            'id', 'status', 'status_display', 'notification_type_display',
            'priority_display', 'content_type_name', 'content_object',
            'created_at', 'updated_at', 'sent_at', 'read_at', 'is_read'
        )
    
    def get_content_type_name(self, obj):
        """Get the name of the content type."""
        return obj.content_type.model if obj.content_type else None
    
    def get_content_object(self, obj):
        """Get the related object if it exists."""
        if not obj.content_object:
            return None
            
        # Import here to avoid circular imports
        from properties.serializers import PropertySerializer
        from construction.serializers import ConstructionRequestSerializer
        from quotes.serializers import QuoteSerializer
        
        # Map content types to their respective serializers
        serializer_map = {
            'property': PropertySerializer,
            'constructionrequest': ConstructionRequestSerializer,
            'quote': QuoteSerializer,
        }
        
        model_name = obj.content_type.model.lower()
        serializer_class = serializer_map.get(model_name)
        
        if serializer_class:
            return serializer_class(obj.content_object, context=self.context).data
        return None
    
    def get_is_read(self, obj):
        """Check if the notification is read."""
        return obj.status == NotificationStatus.READ


class MarkAsReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read."""
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True,
        help_text="List of notification IDs to mark as read"
    )
    
    def validate_notification_ids(self, value):
        """Validate that the notifications exist and belong to the user."""
        user = self.context['request'].user
        valid_ids = set(Notification.objects.filter(
            recipient=user,
            id__in=value
        ).values_list('id', flat=True))
        
        invalid_ids = set(value) - valid_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid notification IDs: {', '.join(str(id) for id in invalid_ids)}"
            )
        return value


class UserNotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for UserNotificationPreference model."""
    class Meta:
        model = UserNotificationPreference
        fields = [
            'id', 'email_notifications', 'sms_notifications', 'push_notifications',
            'in_app_notifications', 'project_updates', 'quote_updates',
            'payment_reminders', 'system_alerts', 'marketing', 'do_not_disturb',
            'do_not_disturb_until', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_do_not_disturb_until(self, value):
        """Validate that do_not_disturb_until is in the future if do_not_disturb is True."""
        if self.initial_data.get('do_not_disturb') and value and value < timezone.now():
            raise serializers.ValidationError(
                "Do not disturb until date must be in the future"
            )
        return value


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending notifications."""
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of user IDs to send the notification to"
    )
    notification_type = serializers.ChoiceField(
        choices=NotificationType.choices,
        default=NotificationType.IN_APP,
        help_text="Type of notification to send"
    )
    subject = serializers.CharField(required=True, help_text="Notification subject")
    message = serializers.CharField(required=True, help_text="Notification message")
    priority = serializers.ChoiceField(
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        help_text="Priority of the notification"
    )
    content_type = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Content type of the related object (e.g., 'property', 'quote')"
    )
    object_id = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="ID of the related object"
    )
    template_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="ID of the template to use for this notification"
    )
    template_context = serializers.DictField(
        required=False,
        default=dict,
        help_text="Context data for template rendering"
    )
    
    def validate_recipient_ids(self, value):
        """Validate that the recipient IDs are valid."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        valid_ids = set(User.objects.filter(
            id__in=value
        ).values_list('id', flat=True))
        
        invalid_ids = set(value) - valid_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid user IDs: {', '.join(str(id) for id in invalid_ids)}"
            )
        return value
    
    def validate_content_type(self, value):
        """Validate that the content type exists."""
        if not value:
            return None
            
        try:
            return ContentType.objects.get(model=value.lower())
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(f"Invalid content type: {value}")
    
    def validate_template_id(self, value):
        """Validate that the template exists and is active."""
        if not value:
            return None
            
        try:
            template = NotificationTemplate.objects.get(
                id=value,
                is_active=True
            )
            return template
        except NotificationTemplate.DoesNotExist:
            raise serializers.ValidationError("Template not found or inactive")
    
    def validate(self, data):
        """Validate the entire serializer."""
        content_type = data.get('content_type')
        object_id = data.get('object_id')
        
        # If either content_type or object_id is provided, both must be provided
        if bool(content_type) != bool(object_id):
            raise serializers.ValidationError({
                'content_type': "Both content_type and object_id must be provided together",
                'object_id': "Both content_type and object_id must be provided together"
            })
            
        # If template_id is provided, subject and message are optional
        if 'template_id' in data and data['template_id']:
            template = data['template_id']
            data['notification_type'] = template.notification_type
            
            # Only override subject and message if not provided
            if 'subject' not in data or not data['subject']:
                data['subject'] = template.subject
            
            # For message, we'll render the template in the view
            
        return data
