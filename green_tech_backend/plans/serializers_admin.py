"""
Admin serializers for build requests and plans.
"""
from django.db import transaction
from rest_framework import serializers
from accounts.serializers import UserSerializer
from locations.serializers import RegionAdminSerializer
from .models import BuildRequest, BuildRequestAttachment, Plan
from .serializers import PlanDetailSerializer, PlanImageSerializer, PlanFeatureSerializer, PlanOptionSerializer


class PlanAdminSerializer(PlanDetailSerializer):
    """Admin serializer for plans - extends detail serializer with admin fields."""
    images = PlanImageSerializer(many=True, required=False)
    features = PlanFeatureSerializer(many=True, required=False)
    options = PlanOptionSerializer(many=True, required=False)

    class Meta(PlanDetailSerializer.Meta):
        fields = PlanDetailSerializer.Meta.fields + ('is_published', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        features_data = validated_data.pop('features', [])
        options_data = validated_data.pop('options', [])
        
        with transaction.atomic():
            plan = Plan.objects.create(**validated_data)
            self._sync_images(plan, images_data)
            self._sync_features(plan, features_data)
            self._sync_options(plan, options_data)
        return plan

    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', None)
        features_data = validated_data.pop('features', None)
        options_data = validated_data.pop('options', None)
        
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            if images_data is not None:
                self._sync_images(instance, images_data)
            if features_data is not None:
                self._sync_features(instance, features_data)
            if options_data is not None:
                self._sync_options(instance, options_data)
        return instance

    def _sync_images(self, plan, images_data):
        existing = {img.id: img for img in plan.images.all()}
        keep = []
        for item in images_data:
            img_id = item.get('id')
            if img_id and img_id in existing:
                img = existing[img_id]
                for field in ('image_url', 'caption', 'is_primary', 'order'):
                    if field in item:
                        setattr(img, field, item[field])
                img.save()
                keep.append(img_id)
            else:
                img = plan.images.create(**item)
                keep.append(img.id)
        for img_id, img in existing.items():
            if img_id not in keep:
                img.delete()

    def _sync_features(self, plan, features_data):
        existing = {feat.id: feat for feat in plan.features.all()}
        keep = []
        for item in features_data:
            feat_id = item.get('id')
            if feat_id and feat_id in existing:
                feat = existing[feat_id]
                for field in ('name', 'description', 'category', 'is_sustainable'):
                    if field in item:
                        setattr(feat, field, item[field])
                feat.save()
                keep.append(feat_id)
            else:
                feat = plan.features.create(**item)
                keep.append(feat.id)
        for feat_id, feat in existing.items():
            if feat_id not in keep:
                feat.delete()

    def _sync_options(self, plan, options_data):
        existing = {opt.id: opt for opt in plan.options.all()}
        keep = []
        for item in options_data:
            opt_id = item.get('id')
            if opt_id and opt_id in existing:
                opt = existing[opt_id]
                for field in ('name', 'description', 'price_delta'):
                    if field in item:
                        setattr(opt, field, item[field])
                opt.save()
                keep.append(opt_id)
            else:
                opt = plan.options.create(**item)
                keep.append(opt.id)
        for opt_id, opt in existing.items():
            if opt_id not in keep:
                opt.delete()


class BuildRequestAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for build request attachments."""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BuildRequestAttachment
        fields = ['id', 'original_name', 'file', 'file_url', 'uploaded_at']
        read_only_fields = ('id', 'uploaded_at')
    
    def get_file_url(self, obj):
        """Get the absolute URL for the file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class BuildRequestAdminSerializer(serializers.ModelSerializer):
    """Admin serializer for build requests with full details."""
    plan_details = PlanDetailSerializer(source='plan', read_only=True)
    region_details = RegionAdminSerializer(source='region', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    attachments = BuildRequestAttachmentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BuildRequest
        fields = [
            'id', 'plan', 'plan_details', 'region', 'region_details',
            'user', 'user_details', 'contact_name', 'contact_email', 
            'contact_phone', 'budget_currency', 'budget_min', 'budget_max',
            'timeline', 'customizations', 'options', 'intake_data',
            'status', 'status_display', 'submitted_at', 'updated_at',
            'attachments'
        ]
        read_only_fields = ('id', 'submitted_at', 'updated_at')
    
    def update(self, instance, validated_data):
        """Update build request with status change tracking."""
        old_status = instance.status
        instance = super().update(instance, validated_data)
        
        # Send notification if status changed
        if 'status' in validated_data and validated_data['status'] != old_status:
            self._send_status_notification(instance, old_status)
        
        return instance
    
    def _send_status_notification(self, instance, old_status):
        """Send notification when status changes."""
        if not instance.user:
            return
            
        from notifications.models import Notification, NotificationType, NotificationPriority
        
        status_labels = {
            'new': 'New',
            'in_review': 'In Review',
            'contacted': 'Contacted',
            'archived': 'Archived',
        }
        
        subject = f'Build Request Status Update: {status_labels.get(instance.status, instance.status)}'
        message = f'Your build request for {instance.plan.name} has been updated to {status_labels.get(instance.status, instance.status)}.'
        
        try:
            Notification.objects.create(
                recipient=instance.user,
                subject=subject,
                message=message,
                notification_type=NotificationType.SYSTEM,
                priority=NotificationPriority.MEDIUM,
                metadata={
                    'build_request_id': str(instance.id),
                    'plan_name': instance.plan.name,
                    'old_status': old_status,
                    'new_status': instance.status,
                }
            )
        except Exception as e:
            # Log error but don't fail the update
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to create notification: {e}')
