"""
Public API views for frontend display without authentication.
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from construction.models import Project, ProjectStatus
from construction.serializers.public_serializers import PublicProjectSerializer


class PublicProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API endpoint for displaying projects on the frontend website.
    No authentication required - only shows publicly visible project information.
    """
    queryset = Project.objects.all()
    serializer_class = PublicProjectSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filter projects for public display.
        Only show projects that are not in draft status.
        """
        queryset = super().get_queryset()
        
        # Only show projects that are not drafts
        queryset = queryset.exclude(status=ProjectStatus.DRAFT)
        
        # Optionally filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by category if provided
        category_param = self.request.query_params.get('category', None)
        if category_param:
            # For category filtering, we'll use a simple approach
            # In a real implementation, you might want to add a category field to the Project model
            if category_param == 'residential':
                queryset = queryset.filter(
                    Q(title__icontains='house') | 
                    Q(title__icontains='home') | 
                    Q(title__icontains='residential') |
                    Q(description__icontains='house') | 
                    Q(description__icontains='home') | 
                    Q(description__icontains='residential')
                )
            elif category_param == 'commercial':
                queryset = queryset.filter(
                    Q(title__icontains='office') | 
                    Q(title__icontains='commercial') | 
                    Q(title__icontains='shop') |
                    Q(description__icontains='office') | 
                    Q(description__icontains='commercial') | 
                    Q(description__icontains='shop')
                )
            elif category_param == 'industrial':
                queryset = queryset.filter(
                    Q(title__icontains='factory') | 
                    Q(title__icontains='industrial') | 
                    Q(title__icontains='warehouse') |
                    Q(description__icontains='factory') | 
                    Q(description__icontains='industrial') | 
                    Q(description__icontains='warehouse')
                )
        
        return queryset.select_related('property').prefetch_related('contractors')
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured projects for the homepage.
        Returns a limited number of high-quality projects.
        """
        # Get completed projects or projects in progress
        featured_projects = self.get_queryset().filter(
            status__in=[ProjectStatus.COMPLETED, ProjectStatus.IN_PROGRESS]
        ).order_by('-created_at')[:6]  # Limit to 6 featured projects
        
        serializer = self.get_serializer(featured_projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get project statistics for the frontend.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total_projects': queryset.count(),
            'completed_projects': queryset.filter(status=ProjectStatus.COMPLETED).count(),
            'ongoing_projects': queryset.filter(status=ProjectStatus.IN_PROGRESS).count(),
            'countries_served': 15,  # This could be calculated from actual data
            'total_area_developed': '1M+',  # This could be calculated from actual data
            'client_satisfaction': 98  # This could be calculated from actual feedback
        }
        
        return Response(stats)
