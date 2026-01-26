"""Admin dashboard API views."""

from datetime import datetime
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, NotFound

from .analytics import build_admin_dashboard_metrics
from .customer_analytics import build_customer_dashboard_metrics, build_customer_notifications
from notifications.models import Notification, UserNotificationPreference

class AdminDashboardView(APIView):
    """Platform-wide analytics for admin dashboard."""
    
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Return admin dashboard metrics."""
        
        start_date = self._parse_date(request.query_params.get('start_date'), 'start_date')
        end_date = self._parse_date(request.query_params.get('end_date'), 'end_date')
        
        if start_date and end_date and end_date < start_date:
            raise ValidationError({'end_date': 'End date must be on or after the start date.'})
        
        metrics = build_admin_dashboard_metrics(start_date=start_date, end_date=end_date)
        
        return Response(metrics)
    
    @staticmethod
    def _parse_date(value: str | None, field_name: str):
        if not value:
            return None
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError as exc:
            raise ValidationError({field_name: 'Invalid date format. Use YYYY-MM-DD.'}) from exc


class CustomerDashboardView(APIView):
    """Customer-specific dashboard metrics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return customer dashboard metrics."""
        
        metrics = build_customer_dashboard_metrics(request.user)
        return Response(metrics)


class CustomerNotificationsView(APIView):
    """Customer notifications and preferences."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return customer notifications."""
        
        data = build_customer_notifications(request.user)
        return Response(data)
    
    def patch(self, request):
        """Update notification preferences."""
        
        preferences = request.data.get('preferences', {})
        
        # Get or create user notification preferences
        user_prefs, created = UserNotificationPreference.objects.get_or_create(
            user=request.user,
            defaults={
                'email_notifications': preferences.get('email', True),
                'sms_notifications': preferences.get('sms', True),
                'push_notifications': preferences.get('in_app', True),
                'in_app_notifications': preferences.get('in_app', True),
                'project_updates': preferences.get('project_updates', True),
                'quote_updates': preferences.get('quote_notifications', True),
                'payment_reminders': preferences.get('payment_reminders', True),
                'marketing': preferences.get('marketing_emails', False),
            }
        )
        
        if not created:
            # Update existing preferences
            user_prefs.email_notifications = preferences.get('email', user_prefs.email_notifications)
            user_prefs.sms_notifications = preferences.get('sms', user_prefs.sms_notifications)
            user_prefs.push_notifications = preferences.get('in_app', user_prefs.push_notifications)
            user_prefs.in_app_notifications = preferences.get('in_app', user_prefs.in_app_notifications)
            user_prefs.project_updates = preferences.get('project_updates', user_prefs.project_updates)
            user_prefs.quote_updates = preferences.get('quote_notifications', user_prefs.quote_updates)
            user_prefs.payment_reminders = preferences.get('payment_reminders', user_prefs.payment_reminders)
            user_prefs.marketing = preferences.get('marketing_emails', user_prefs.marketing)
            user_prefs.save()
        
        return Response({
            'preferences': {
                'email': user_prefs.email_notifications,
                'sms': user_prefs.sms_notifications,
                'in_app': user_prefs.in_app_notifications,
                'project_updates': user_prefs.project_updates,
                'quote_notifications': user_prefs.quote_updates,
                'payment_reminders': user_prefs.payment_reminders,
                'marketing_emails': user_prefs.marketing,
            },
            'message': 'Preferences updated successfully'
        })


class MarkNotificationReadView(APIView):
    """Mark a specific notification as read."""
    
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, notification_id):
        """Mark a notification as read."""
        
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user
            )
            notification.mark_as_read()
            return Response({'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            raise NotFound('Notification not found')


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read for the user."""
    
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        """Mark all notifications as read."""
        
        # Mark all unread notifications as read
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            status__in=['pending', 'sent', 'delivered']
        )
        
        count = 0
        for notification in unread_notifications:
            notification.mark_as_read()
            count += 1
        
        return Response({
            'message': f'Marked {count} notifications as read',
            'count': count
        })