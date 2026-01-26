"""Customer-facing analytics for public frontend dashboard."""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone

from leads.models import Lead, LeadStatus
from quotes.models import Quote, QuoteStatus
from construction.models import Project, ProjectStatus
from properties.models import Property
from notifications.models import Notification, UserNotificationPreference

User = get_user_model()


def build_customer_dashboard_metrics(user: User) -> dict:
    """Build customer-specific dashboard metrics."""
    
    # Leads are currently keyed by contact email.
    user_leads = Lead.objects.filter(contact_email__iexact=user.email)

    # Projects can be linked directly via ConstructionRequest.client.
    user_projects = Project.objects.filter(construction_request__client=user)

    # Quotes can be linked either via construction_request.client (authenticated users)
    # or via build_request contact email / recipient_email (for plan quotes).
    user_quotes = Quote.objects.filter(
        Q(construction_request__client=user)
        | Q(build_request__contact_email__iexact=user.email)
        | Q(recipient_email__iexact=user.email)
    ).distinct()
    
    # Activity feed data (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    recent_activities = []
    
    # Recent leads
    for lead in user_leads.filter(created_at__gte=thirty_days_ago).order_by('-created_at')[:5]:
        recent_activities.append({
            'id': f'lead_{lead.id}',
            'type': 'lead_created',
            'title': f'New inquiry submitted',
            'description': f'Inquiry: {lead.title}',
            'timestamp': lead.created_at.isoformat(),
            'project_id': None,
            'project_title': None,
        })

    # Recent quotes (sent/viewed/accepted, etc.)
    for quote in user_quotes.filter(created_at__gte=thirty_days_ago).order_by('-created_at')[:5]:
        recent_activities.append({
            'id': f'quote_{quote.id}',
            'type': 'quote_received',
            'title': 'Quote update',
            'description': f'Quote {quote.reference} is {quote.status_display}',
            'timestamp': quote.created_at.isoformat(),
            'project_id': None,
            'project_title': None,
        })

    # Recent project updates (project created/updated)
    for project in user_projects.filter(created_at__gte=thirty_days_ago).order_by('-created_at')[:5]:
        recent_activities.append({
            'id': f'project_{project.id}',
            'type': 'project_update',
            'title': 'Project update',
            'description': f'Project: {project.title}',
            'timestamp': project.created_at.isoformat(),
            'project_id': project.id,
            'project_title': project.title,
        })
    
    # Sort activities by timestamp
    recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Lead status summary
    lead_status_counts = dict(
        user_leads.values('status')
        .annotate(count=Count('id'))
        .values_list('status', 'count')
    )

    quote_status_counts = dict(
        user_quotes.values('status')
        .annotate(count=Count('id'))
        .values_list('status', 'count')
    )

    project_status_counts = dict(
        user_projects.values('status')
        .annotate(count=Count('id'))
        .values_list('status', 'count')
    )

    active_project_statuses = [
        ProjectStatus.PLANNING,
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.ON_HOLD,
        ProjectStatus.DELAYED,
    ]
    
    return {
        'overview': {
            'total_leads': user_leads.count(),
            'total_quotes': user_quotes.count(),
            'total_projects': user_projects.count(),
            'active_projects': user_projects.filter(status__in=active_project_statuses).count(),
        },
        'leads': {
            'total': user_leads.count(),
            'status_breakdown': lead_status_counts,
            'pending': user_leads.filter(status=LeadStatus.NEW).count(),
        },
        'quotes': {
            'total': user_quotes.count(),
            'status_breakdown': quote_status_counts,
            'pending': user_quotes.filter(status__in=[QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.VIEWED]).count(),
            'accepted': user_quotes.filter(status=QuoteStatus.ACCEPTED).count(),
        },
        'projects': {
            'total': user_projects.count(),
            'status_breakdown': project_status_counts,
            'active': user_projects.filter(status__in=active_project_statuses).count(),
            'completed': user_projects.filter(status=ProjectStatus.COMPLETED).count(),
        },
        'recent_activities': recent_activities[:10],  # Limit to 10 most recent
    }


def build_customer_notifications(user: User) -> dict:
    """Build customer notification data from real database data."""
    
    # Get real notifications for the user
    notifications_qs = Notification.objects.filter(
        recipient=user,
        notification_type='in_app'
    ).order_by('-created_at')[:20]  # Limit to 20 most recent
    
    notifications = []
    for notif in notifications_qs:
        # Determine notification type based on priority or content
        notif_type = 'info'  # default
        if notif.priority == 'high':
            notif_type = 'warning'
        elif notif.priority == 'urgent':
            notif_type = 'error'
        elif 'completed' in notif.subject.lower() or 'success' in notif.subject.lower():
            notif_type = 'success'
        
        notifications.append({
            'id': str(notif.id),
            'type': notif_type,
            'title': notif.subject,
            'message': notif.message,
            'timestamp': notif.created_at.isoformat(),
            'read': notif.status == 'read',
            'action_url': None,  # Could be derived from content_object
            'action_label': None,
        })
    
    # Get user notification preferences
    user_prefs = UserNotificationPreference.objects.filter(user=user).first()
    
    if user_prefs:
        preferences = {
            'email': user_prefs.email_notifications,
            'sms': user_prefs.sms_notifications,
            'in_app': user_prefs.in_app_notifications,
            'project_updates': user_prefs.project_updates,
            'quote_notifications': user_prefs.quote_updates,
            'payment_reminders': user_prefs.payment_reminders,
            'marketing_emails': user_prefs.marketing,
        }
    else:
        # Default preferences if none exist
        preferences = {
            'email': True,
            'sms': False,
            'in_app': True,
            'project_updates': True,
            'quote_notifications': True,
            'payment_reminders': True,
            'marketing_emails': False,
        }
    
    return {
        'notifications': notifications,
        'preferences': preferences,
        'unread_count': len([n for n in notifications if not n['read']]),
    }