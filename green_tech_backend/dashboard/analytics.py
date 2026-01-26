"""Platform-wide analytics for admin dashboard."""

from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone

from leads.models import Lead, LeadStatus
from quotes.models import Quote, QuoteStatus
from construction.models import Project, ProjectStatus
from properties.models import Property, PropertyStatus
from plans.models import Plan
from locations.models import Region

User = get_user_model()


def build_admin_dashboard_metrics(start_date: date = None, end_date: date = None) -> dict:
    """Build platform-wide metrics for admin dashboard."""
    
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Base querysets with date filtering
    leads_qs = Lead.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    quotes_qs = Quote.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    projects_qs = Project.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    
    # Lead metrics
    total_leads = leads_qs.count()
    leads_by_status = dict(leads_qs.values('status').annotate(count=Count('id')).values_list('status', 'count'))
    
    # Quote metrics
    total_quotes = quotes_qs.count()
    quotes_by_status = dict(quotes_qs.values('status').annotate(count=Count('id')).values_list('status', 'count'))
    total_quote_value = quotes_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    accepted_quotes = quotes_qs.filter(status=QuoteStatus.ACCEPTED).count()
    
    # Project metrics
    total_projects = projects_qs.count()
    projects_by_status = dict(projects_qs.values('status').annotate(count=Count('id')).values_list('status', 'count'))
    active_projects = projects_qs.filter(status__in=[ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS]).count()
    
    # Property metrics (all time for inventory)
    total_properties = Property.objects.count()
    active_properties = Property.objects.filter(status=PropertyStatus.PUBLISHED).count()
    properties_by_region = dict(
        Property.objects.filter(status=PropertyStatus.PUBLISHED)
        .values('region__name')
        .annotate(count=Count('id'))
        .values_list('region__name', 'count')
    )
    
    # Plan metrics (all time for catalog)
    total_plans = Plan.objects.count()
    active_plans = Plan.objects.filter(is_published=True).count()
    plans_by_category = dict(
        Plan.objects.values('style')
        .annotate(count=Count('id'))
        .values_list('style', 'count')
    )
    
    # User metrics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    new_users = User.objects.filter(date_joined__date__gte=start_date, date_joined__date__lte=end_date).count()
    
    # Regional breakdown (Ghana focus)
    regions = Region.objects.all()
    regional_data = []
    for region in regions:
        # For now, just count properties by region since leads/projects don't have direct region field
        region_properties = Property.objects.filter(region=region, status=PropertyStatus.PUBLISHED).count()
        
        regional_data.append({
            'name': region.name,
            'leads': 0,  # TODO: Implement lead region mapping
            'projects': 0,  # TODO: Implement project region mapping
            'properties': region_properties,
            'total_activity': region_properties
        })
    
    # Sustainability metrics
    eco_plans = Plan.objects.filter(sustainability_score__gte=70).count()
    solar_properties = Property.objects.filter(amenities__icontains='solar').count()
    water_harvesting_properties = Property.objects.filter(amenities__icontains='water harvesting').count()
    
    # Conversion rates
    lead_to_quote_rate = (total_quotes / total_leads * 100) if total_leads > 0 else 0
    quote_to_project_rate = (total_projects / total_quotes * 100) if total_quotes > 0 else 0
    quote_acceptance_rate = (accepted_quotes / total_quotes * 100) if total_quotes > 0 else 0
    
    # Recent activity (last 7 days for trends)
    week_ago = end_date - timedelta(days=7)
    recent_leads = Lead.objects.filter(created_at__date__gte=week_ago).count()
    recent_quotes = Quote.objects.filter(created_at__date__gte=week_ago).count()
    recent_projects = Project.objects.filter(created_at__date__gte=week_ago).count()
    
    # Calculate trends (compare to previous period)
    prev_start = start_date - (end_date - start_date)
    prev_end = start_date - timedelta(days=1)
    
    prev_leads = Lead.objects.filter(created_at__date__gte=prev_start, created_at__date__lte=prev_end).count()
    prev_quotes = Quote.objects.filter(created_at__date__gte=prev_start, created_at__date__lte=prev_end).count()
    prev_projects = Project.objects.filter(created_at__date__gte=prev_start, created_at__date__lte=prev_end).count()
    
    def calculate_trend(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)
    
    return {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
        'overview': {
            'total_leads': total_leads,
            'total_quotes': total_quotes,
            'total_projects': total_projects,
            'total_users': total_users,
            'active_users': active_users,
            'new_users': new_users,
        },
        'leads': {
            'total': total_leads,
            'recent': recent_leads,
            'status_breakdown': leads_by_status,
            'trend': calculate_trend(total_leads, prev_leads),
        },
        'quotes': {
            'total': total_quotes,
            'recent': recent_quotes,
            'status_breakdown': quotes_by_status,
            'total_value': str(total_quote_value),
            'accepted': accepted_quotes,
            'trend': calculate_trend(total_quotes, prev_quotes),
        },
        'projects': {
            'total': total_projects,
            'recent': recent_projects,
            'active': active_projects,
            'status_breakdown': projects_by_status,
            'trend': calculate_trend(total_projects, prev_projects),
        },
        'properties': {
            'total': total_properties,
            'active': active_properties,
            'by_region': properties_by_region,
        },
        'plans': {
            'total': total_plans,
            'active': active_plans,
            'by_category': plans_by_category,
        },
        'regional_performance': regional_data,
        'sustainability': {
            'eco_plans': eco_plans,
            'solar_properties': solar_properties,
            'water_harvesting_properties': water_harvesting_properties,
            'green_score': round((eco_plans / total_plans * 100) if total_plans > 0 else 0, 1),
        },
        'conversion_rates': {
            'lead_to_quote': round(lead_to_quote_rate, 1),
            'quote_to_project': round(quote_to_project_rate, 1),
            'quote_acceptance': round(quote_acceptance_rate, 1),
        },
    }