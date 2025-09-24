"""
Dashboard service for aggregating and processing dashboard data.
"""
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from datetime import timedelta

class DashboardService:
    """Service class for dashboard-related operations."""
    
    @staticmethod
    def get_user_dashboard_data(user):
        """
        Get dashboard data based on user role.
        
        Args:
            user: The authenticated user
            
        Returns:
            dict: Dashboard data specific to the user's role
        """
        if user.is_staff or user.is_superuser:
            return DashboardService._get_admin_dashboard_data()
        elif hasattr(user, 'is_agent') and user.is_agent:
            return DashboardService._get_agent_dashboard_data(user)
        else:
            return DashboardService._get_customer_dashboard_data(user)
    
    @staticmethod
    def _get_admin_dashboard_data():
        """Get dashboard data for admin users."""
        from properties.models import Property
        from construction.models import ConstructionRequest, Project
        from accounts.models import User
        
        # Get counts for admin dashboard
        total_properties = Property.objects.count()
        active_construction_requests = ConstructionRequest.objects.filter(
            status__in=['pending', 'in_progress']
        ).count()
        active_projects = Project.objects.filter(
            status__in=['in_progress', 'on_hold']
        ).count()
        total_users = User.objects.count()
        
        return {
            'role': 'admin',
            'stats': {
                'total_properties': total_properties,
                'active_construction_requests': active_construction_requests,
                'active_projects': active_projects,
                'total_users': total_users,
            },
            'quick_actions': [
                {'label': 'Add New Property', 'url': '/admin/properties/add/'},
                {'label': 'View Pending Requests', 'url': '/admin/construction/requests/?status=pending'},
                {'label': 'Manage Users', 'url': '/admin/accounts/user/'},
            ]
        }
    
    @staticmethod
    def _get_agent_dashboard_data(user):
        """Get dashboard data for agent users."""
        from properties.models import Property, PropertyInquiry
        from construction.models import ConstructionRequest
        
        # Get agent's properties and related data
        agent_properties = Property.objects.filter(agent=user)
        active_listings = agent_properties.filter(is_published=True).count()
        
        # Get inquiries for agent's properties
        recent_inquiries = PropertyInquiry.objects.filter(
            property__in=agent_properties
        ).order_by('-created_at')[:5]
        
        # Get construction requests for agent's properties
        construction_requests = ConstructionRequest.objects.filter(
            property__in=agent_properties
        ).select_related('property')
        
        pending_requests = construction_requests.filter(status='pending').count()
        
        return {
            'role': 'agent',
            'stats': {
                'total_properties': agent_properties.count(),
                'active_listings': active_listings,
                'pending_requests': pending_requests,
                'recent_inquiries': len(recent_inquiries),
            },
            'quick_actions': [
                {'label': 'Add New Property', 'url': '/agent/properties/add/'},
                {'label': 'View Inquiries', 'url': '/agent/inquiries/'},
                {'label': 'View Construction Requests', 'url': '/agent/construction-requests/'},
            ]
        }
    
    @staticmethod
    def _get_customer_dashboard_data(user):
        """Get dashboard data for customer users."""
        from properties.models import PropertyInquiry, SavedSearch
        from construction.models import ConstructionRequest, Project
        
        # Get user's inquiries
        user_inquiries = PropertyInquiry.objects.filter(user=user).order_by('-created_at')
        
        # Get user's saved searches
        saved_searches = SavedSearch.objects.filter(user=user).order_by('-last_searched')
        
        # Get user's construction requests and projects
        construction_requests = ConstructionRequest.objects.filter(user=user).select_related('property')
        projects = Project.objects.filter(construction_request__user=user).select_related('construction_request')
        
        # Get active projects
        active_projects = projects.filter(
            status__in=['in_progress', 'on_hold']
        ).order_by('-start_date')
        
        return {
            'role': 'customer',
            'stats': {
                'saved_searches': saved_searches.count(),
                'active_inquiries': user_inquiries.filter(status='pending').count(),
                'active_projects': active_projects.count(),
                'total_requests': construction_requests.count(),
            },
            'quick_actions': [
                {'label': 'Start New Project', 'url': '/construction/request/'},
                {'label': 'Browse Properties', 'url': '/properties/'},
                {'label': 'View My Projects', 'url': '/my-projects/'},
            ]
        }
    
    @staticmethod
    def get_analytics_data(timeframe='30d'):
        """
        Get analytics data for the specified timeframe.
        
        Args:
            timeframe (str): Timeframe for analytics ('7d', '30d', '90d', '1y')
            
        Returns:
            dict: Analytics data
        """
        # Calculate date range based on timeframe
        end_date = timezone.now()
        
        if timeframe == '7d':
            start_date = end_date - timedelta(days=7)
        elif timeframe == '90d':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '1y':
            start_date = end_date - timedelta(days=365)
        else:  # Default to 30 days
            start_date = end_date - timedelta(days=30)
        
        # Import models here to avoid circular imports
        from properties.models import Property, PropertyView
        from construction.models import ConstructionRequest
        from accounts.models import User
        
        # Get property views data
        views_data = PropertyView.objects.filter(
            viewed_at__range=(start_date, end_date)
        ).values('viewed_at__date').annotate(
            count=Count('id')
        ).order_by('viewed_at__date')
        
        # Get new users data
        new_users = User.objects.filter(
            date_joined__range=(start_date, end_date)
        ).values('date_joined__date').annotate(
            count=Count('id')
        ).order_by('date_joined__date')
        
        # Get construction requests data
        construction_requests = ConstructionRequest.objects.filter(
            created_at__range=(start_date, end_date)
        ).values('created_at__date').annotate(
            count=Count('id')
        ).order_by('created_at__date')
        
        # Format data for charts
        def format_chart_data(queryset, date_field):
            date_dict = {str(item[f'{date_field}__date']): item['count'] for item in queryset}
            
            # Fill in missing dates with 0
            current_date = start_date.date()
            end_date_date = end_date.date()
            formatted_data = []
            
            while current_date <= end_date_date:
                date_str = str(current_date)
                formatted_data.append({
                    'date': date_str,
                    'count': date_dict.get(date_str, 0)
                })
                current_date += timedelta(days=1)
                
            return formatted_data
        
        return {
            'timeframe': timeframe,
            'start_date': start_date.date().isoformat(),
            'end_date': end_date.date().isoformat(),
            'property_views': format_chart_data(views_data, 'viewed_at'),
            'new_users': format_chart_data(new_users, 'date_joined'),
            'construction_requests': format_chart_data(construction_requests, 'created_at'),
        }
    
    @staticmethod
    def get_consolidated_view(user, view_type='all', page=1, page_size=10):
        """
        Get a consolidated view of projects and properties for the user.
        
        Args:
            user: The authenticated user
            view_type (str): Type of view ('all', 'projects', 'properties')
            page (int): Page number for pagination
            page_size (int): Number of items per page
            
        Returns:
            dict: Consolidated view data with pagination info
        """
        from properties.models import Property
        from construction.models import Project
        
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Initialize response
        response = {
            'count': 0,
            'next': None,
            'previous': None,
            'results': []
        }
        
        # Get base querysets based on user role
        if user.is_staff or user.is_superuser:
            # Admin can see all projects and properties
            properties = Property.objects.all()
            projects = Project.objects.all()
        elif hasattr(user, 'is_agent') and user.is_agent:
            # Agent can see their own properties and related projects
            properties = Property.objects.filter(agent=user)
            projects = Project.objects.filter(
                construction_request__property__in=properties
            )
        else:
            # Customer can see their own projects and saved properties
            properties = Property.objects.filter(
                saved_by=user
            )
            projects = Project.objects.filter(
                construction_request__user=user
            )
        
        # Get counts for each view type
        if view_type in ['all', 'projects']:
            project_count = projects.count()
        else:
            project_count = 0
            
        if view_type in ['all', 'properties']:
            property_count = properties.count()
        else:
            property_count = 0
        
        # Prepare combined results
        results = []
        
        # Add projects to results if requested
        if view_type in ['all', 'projects']:
            project_queryset = projects.order_by('-updated_at')
            
            # Apply pagination
            paginated_projects = project_queryset[offset:offset + page_size]
            
            for project in paginated_projects:
                results.append({
                    'type': 'project',
                    'id': project.id,
                    'title': project.name,
                    'status': project.status,
                    'last_updated': project.updated_at,
                    'progress': project.progress_percentage or 0,
                    'image': project.primary_image_url,
                    'url': f'/projects/{project.id}/',
                    'actions': [
                        {'label': 'View Details', 'url': f'/projects/{project.id}/'},
                        {'label': 'View Timeline', 'url': f'/projects/{project.id}/timeline/'},
                    ]
                })
        
        # Add properties to results if requested
        if view_type in ['all', 'properties']:
            # Adjust offset if we're on a page that includes both types
            if view_type == 'all' and len(results) < page_size:
                remaining = page_size - len(results)
                property_offset = max(0, offset - project_count)
                property_page_size = min(remaining, page_size)
                
                property_queryset = properties.order_by('-updated_at')
                paginated_properties = property_queryset[property_offset:property_offset + property_page_size]
                
                for prop in paginated_properties:
                    results.append({
                        'type': 'property',
                        'id': prop.id,
                        'title': prop.title,
                        'status': 'published' if prop.is_published else 'draft',
                        'last_updated': prop.updated_at,
                        'image': prop.primary_image_url,
                        'price': prop.price,
                        'location': prop.location,
                        'url': f'/properties/{prop.id}/',
                        'actions': [
                            {'label': 'View Details', 'url': f'/properties/{prop.id}/'},
                            {'label': 'Edit', 'url': f'/properties/{prop.id}/edit/'},
                        ]
                    })
        
        # Update response with results and pagination info
        total_count = (project_count if view_type in ['all', 'projects'] else 0) + \
                     (property_count if view_type in ['all', 'properties'] else 0)
        
        response['count'] = total_count
        response['results'] = results
        
        # Add next and previous page URLs if needed
        if offset + page_size < total_count:
            response['next'] = f'?page={page + 1}&page_size={page_size}'
        
        if page > 1:
            response['previous'] = f'?page={page - 1}&page_size={page_size}'
        
        return response
