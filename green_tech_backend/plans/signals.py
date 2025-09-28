from django.db.models.signals import pre_save, post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Plan
from .audit import ActionType, plan_log_action

@receiver(pre_save, sender=Plan)
def plan_pre_save(sender, instance, **kwargs):
    if not instance.pk:
        return
        
    try:
        old_instance = Plan.objects.get(pk=instance.pk)
        changes = {}
        
        for field in instance._meta.fields:
            field_name = field.name
            if field_name in ['created_at', 'updated_at']:
                continue
                
            old_value = getattr(old_instance, field_name, None)
            new_value = getattr(instance, field_name, None)
            
            if old_value != new_value:
                changes[field_name] = {
                    'old': str(old_value) if old_value is not None else None,
                    'new': str(new_value) if new_value is not None else None
                }
        
        setattr(instance, '_changes', changes)
    except Plan.DoesNotExist:
        pass

@receiver(post_save, sender=Plan)
def plan_post_save(sender, instance, created, **kwargs):
    action = ActionType.CREATE if created else ActionType.UPDATE
    changes = getattr(instance, '_changes', {})
    
    if not created and 'is_published' in changes:
        if instance.is_published:
            action = ActionType.PUBLISH
        else:
            action = ActionType.UNPUBLISH
    
    plan_log_action(
        plan=instance,
        user=getattr(instance, '_current_user', None),
        action=action,
        changes=changes,
        ip_address=getattr(instance, '_current_ip', None),
        user_agent=getattr(instance, '_current_user_agent', ''),
    )

@receiver(pre_delete, sender=Plan)
def plan_pre_delete(sender, instance, **kwargs):
    plan_log_action(
        plan=instance,
        user=getattr(instance, '_current_user', None),
        action=ActionType.DELETE,
        changes={}
    )
