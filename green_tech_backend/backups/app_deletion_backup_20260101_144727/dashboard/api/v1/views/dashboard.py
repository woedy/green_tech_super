"""
API views for the dashboard.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ...services.dashboard_service import DashboardService
from ..serializers.dashboard import (
    AdminDashboardStatsSerializer,
    AgentDashboardStatsSerializer,
    CustomerDashboardStatsSerializer,
    QuickActionSerializer,
    AnalyticsDataSerializer
)


class DashboardView(APIView):
    """API view for retrieving dashboard data."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Get dashboard data for the authenticated user."""
        # Get dashboard data based on user role
        dashboard_data = DashboardService.get_user_dashboard_data(request.user)
        
        # Select the appropriate serializer based on user role
        role = dashboard_data.get('role')
        stats_data = dashboard_data.get('stats', {})
        
        if role == 'admin':
            serializer_class = AdminDashboardStatsSerializer
        elif role == 'agent':
            serializer_class = AgentDashboardStatsSerializer
        else:  # customer
            serializer_class = CustomerDashboardStatsSerializer
        
        # Add role to stats data
        stats_data['role'] = role
        
        # Serialize the data
        stats_serializer = serializer_class(data=stats_data)
        quick_actions_serializer = QuickActionSerializer(
            dashboard_data.get('quick_actions', []), 
            many=True
        )
        
        if not stats_serializer.is_valid():
            return Response(
                {"error": "Invalid dashboard data"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'stats': stats_serializer.data,
            'quick_actions': quick_actions_serializer.data
        })


class AnalyticsView(APIView):
    """API view for retrieving analytics data."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Get analytics data for the specified timeframe."""
        # Get timeframe from query params, default to 30 days
        timeframe = request.query_params.get('timeframe', '30d')
        
        # Validate timeframe
        if timeframe not in ['7d', '30d', '90d', '1y']:
            return Response(
                {"error": "Invalid timeframe. Must be one of: 7d, 30d, 90d, 1y"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get analytics data
        analytics_data = DashboardService.get_analytics_data(timeframe)
        
        # Serialize the data
        serializer = AnalyticsDataSerializer(data=analytics_data)
        
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid analytics data"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(serializer.data)
