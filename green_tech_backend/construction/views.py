from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import (
    ConstructionRequest, ConstructionMilestone, 
    ConstructionDocument, Project
)
from .serializers import (
    ConstructionRequestSerializer, ConstructionMilestoneSerializer,
    ConstructionDocumentSerializer, ProjectSerializer
)
from accounts.permissions import IsOwnerOrAdmin, IsProjectTeamMember, IsProjectManagerOrAdmin


class ConstructionRequestViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing construction requests.
    """
    queryset = ConstructionRequest.objects.all()
    serializer_class = ConstructionRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'construction_type', 'region', 'client', 'project_manager']
    search_fields = ['title', 'description', 'address', 'city']
    ordering_fields = ['created_at', 'start_date', 'estimated_end_date', 'budget']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrAdmin | IsProjectManagerOrAdmin]
        elif self.action in ['add_document', 'add_milestone']:
            permission_classes = [IsProjectTeamMember | IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user role and permissions.
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        # Non-admin users can only see their own requests or requests they're involved in
        if not user.is_staff:
            queryset = queryset.filter(
                Q(client=user) | 
                Q(project_manager=user) | 
                Q(contractors=user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the client to the current user when creating a request.
        """
        serializer.save(client=self.request.user)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def add_document(self, request, pk=None):
        """
        Add a document to a construction request.
        """
        construction_request = self.get_object()
        serializer = ConstructionDocumentSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(
                construction_request=construction_request,
                uploaded_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_milestone(self, request, pk=None):
        """
        Add a milestone to a construction request.
        """
        construction_request = self.get_object()
        serializer = ConstructionMilestoneSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(construction_request=construction_request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing construction projects.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'status', 'region', 'district', 'project_manager', 
        'site_supervisor', 'contractors'
    ]
    search_fields = ['name', 'description', 'location', 'notes']
    ordering_fields = [
        'created_at', 'start_date', 'estimated_end_date', 
        'actual_end_date', 'sustainability_score'
    ]
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsProjectManagerOrAdmin | IsAdminUser]
        elif self.action in ['add_contractor', 'remove_contractor']:
            permission_classes = [IsProjectManagerOrAdmin | IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user role and permissions.
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        # Non-admin users can only see projects they're involved in
        if not user.is_staff:
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(project_manager=user) |
                Q(site_supervisor=user) |
                Q(contractors=user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the created_by field to the current user when creating a project.
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_contractor(self, request, pk=None):
        """
        Add a contractor to the project.
        """
        project = self.get_object()
        contractor_id = request.data.get('contractor_id')
        
        if not contractor_id:
            return Response(
                {'error': 'contractor_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.contractors.add(contractor_id)
        return Response(
            {'status': 'contractor added'}, 
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def remove_contractor(self, request, pk=None):
        """
        Remove a contractor from the project.
        """
        project = self.get_object()
        contractor_id = request.data.get('contractor_id')
        
        if not contractor_id:
            return Response(
                {'error': 'contractor_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.contractors.remove(contractor_id)
        return Response(
            {'status': 'contractor removed'}, 
            status=status.HTTP_200_OK
        )


class ConstructionMilestoneViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing construction milestones.
    """
    serializer_class = ConstructionMilestoneSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_completed', 'construction_request']
    ordering_fields = ['due_date', 'completed_date']
    ordering = ['due_date']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create']:
            permission_classes = [IsProjectTeamMember | IsAdminUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsProjectTeamMember | IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter milestones based on user permissions.
        """
        user = self.request.user
        queryset = ConstructionMilestone.objects.all()
        
        # Non-admin users can only see milestones for projects they're involved in
        if not user.is_staff:
            queryset = queryset.filter(
                Q(construction_request__client=user) |
                Q(construction_request__project_manager=user) |
                Q(construction_request__contractors=user)
            ).distinct()
        
        return queryset


class ConstructionDocumentViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and managing construction documents.
    """
    serializer_class = ConstructionDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'construction_request', 'uploaded_by']
    search_fields = ['title', 'description']
    ordering_fields = ['uploaded_at', 'title']
    ordering = ['-uploaded_at']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create']:
            permission_classes = [IsProjectTeamMember | IsAdminUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsProjectTeamMember | IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter documents based on user permissions.
        """
        user = self.request.user
        queryset = ConstructionDocument.objects.all()
        
        # Non-admin users can only see documents for projects they're involved in
        if not user.is_staff:
            queryset = queryset.filter(
                Q(construction_request__client=user) |
                Q(construction_request__project_manager=user) |
                Q(construction_request__contractors=user) |
                Q(uploaded_by=user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the uploaded_by field to the current user when creating a document.
        """
        serializer.save(uploaded_by=self.request.user)
