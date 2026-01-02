"""
API views for the consolidated view of projects and properties.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ...services.dashboard_service import DashboardService
from ..serializers.consolidated import ConsolidatedViewSerializer


class ConsolidatedView(APIView):
    """API view for retrieving a consolidated view of projects and properties."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """
        Get a consolidated view of projects and properties.
        
        Query Parameters:
            view_type (str): Type of view ('all', 'projects', 'properties')
            page (int): Page number for pagination
            page_size (int): Number of items per page
        """
        # Get query parameters with defaults
        view_type = request.query_params.get('view_type', 'all')
        
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            # Validate parameters
            if view_type not in ['all', 'projects', 'properties']:
                return Response(
                    {"error": "Invalid view_type. Must be one of: all, projects, properties"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if page < 1 or page_size < 1:
                return Response(
                    {"error": "page and page_size must be positive integers"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get data from service
            data = DashboardService.get_consolidated_view(
                user=request.user,
                view_type=view_type,
                page=page,
                page_size=page_size
            )
            
            # Serialize the response
            serializer = ConsolidatedViewSerializer(data=data)
            
            if not serializer.is_valid():
                return Response(
                    {"error": "Invalid data format"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(serializer.validated_data)
            
        except ValueError as e:
            return Response(
                {"error": "Invalid parameter format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
