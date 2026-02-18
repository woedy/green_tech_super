"""
Admin API views for project management.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from construction.models import (
    Project, ProjectStatus, ProjectPhase,
    ProjectMilestone, MilestoneStatus
)
from construction.models.request import ConstructionRequest
from construction.serializers.project_serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
)


class ConstructionRequestAdminViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing construction requests with conversion capability.
    """
    queryset = ConstructionRequest.objects.select_related('client', 'property').all()
    permission_classes = [IsAdminUser]
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('status', 'construction_type')
    search_fields = ('title', 'description', 'client__email')
    ordering = ('-created_at',)
    
    def get_serializer_class(self):
        from construction.serializers import ConstructionRequestSerializer
        return ConstructionRequestSerializer
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def convert_to_project(self, request, pk=None):
        """
        Convert a construction request to an active project.
        
        This creates a new Project based on the ConstructionRequest data
        and updates the ConstructionRequest status to 'IN_PROGRESS'.
        """
        construction_request = self.get_object()
        
        # Check if already converted
        if hasattr(construction_request, 'project'):
            return Response(
                {
                    'error': _('This construction request has already been converted to a project.'),
                    'project_id': construction_request.project.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if approved
        if construction_request.status != 'APPROVED':
            return Response(
                {'error': _('Construction request must be approved before conversion to project.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get required data from request body
        data = request.data
        project_manager_id = data.get('project_manager_id')
        
        if not project_manager_id:
            return Response(
                {'error': _('project_manager_id is required')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate project manager
        from accounts.models import User
        try:
            project_manager = User.objects.get(id=project_manager_id, is_staff=True)
        except User.DoesNotExist:
            return Response(
                {'error': _('Invalid project manager')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional site supervisor
        site_supervisor = None
        site_supervisor_id = data.get('site_supervisor_id')
        if site_supervisor_id:
            try:
                site_supervisor = User.objects.get(id=site_supervisor_id, is_staff=True)
            except User.DoesNotExist:
                pass
        
        # Get or create property if needed
        property_obj = construction_request.property
        if not property_obj and data.get('property_id'):
            from properties.models import Property
            try:
                property_obj = Property.objects.get(id=data['property_id'])
            except Property.DoesNotExist:
                return Response(
                    {'error': _('Invalid property')},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not property_obj:
            return Response(
                {'error': _('Property is required for project creation')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create project
        project = Project.objects.create(
            title=construction_request.title,
            description=construction_request.description or '',
            status=ProjectStatus.PLANNING,
            current_phase=ProjectPhase.SITE_PREPARATION,
            project_manager=project_manager,
            site_supervisor=site_supervisor,
            construction_request=construction_request,
            property=property_obj,
            planned_start_date=construction_request.start_date or data.get('planned_start_date'),
            planned_end_date=construction_request.estimated_end_date or data.get('planned_end_date'),
            estimated_budget=construction_request.estimated_cost or construction_request.budget or 0,
            currency=construction_request.currency,
            created_by=request.user,
        )
        
        # Create initial milestones based on construction type
        self._create_initial_milestones(project, construction_request)
        
        # Update construction request status
        construction_request.status = 'IN_PROGRESS'
        construction_request.save(update_fields=['status'])
        
        serializer = ProjectSerializer(project)
        
        return Response({
            'message': _('Construction request successfully converted to project.'),
            'project': serializer.data,
            'construction_request_id': construction_request.id,
        }, status=status.HTTP_201_CREATED)
    
    def _create_initial_milestones(self, project, construction_request):
        """Create initial milestones based on construction type."""
        from datetime import timedelta
        
        # Define milestone templates based on construction type
        milestone_templates = {
            'NEW': [
                ('Site Preparation', ProjectPhase.SITE_PREPARATION, 5),
                ('Foundation', ProjectPhase.FOUNDATION, 10),
                ('Framing', ProjectPhase.FRAMING, 15),
                ('Roofing', ProjectPhase.ROOFING, 10),
                ('Plumbing', ProjectPhase.PLUMBING, 10),
                ('Electrical', ProjectPhase.ELECTRICAL, 10),
                ('Insulation', ProjectPhase.INSULATION, 5),
                ('Drywall', ProjectPhase.DRYWALL, 10),
                ('Interior Finishes', ProjectPhase.INTERIOR, 15),
                ('Final Inspection', ProjectPhase.FINAL_INSPECTION, 5),
            ],
            'RENO': [
                ('Site Assessment', ProjectPhase.SITE_PREPARATION, 5),
                ('Demolition', ProjectPhase.SITE_PREPARATION, 10),
                ('Structural Work', ProjectPhase.FRAMING, 20),
                ('Systems Upgrade', ProjectPhase.PLUMBING, 15),
                ('Interior Renovation', ProjectPhase.INTERIOR, 30),
                ('Final Inspection', ProjectPhase.FINAL_INSPECTION, 5),
            ],
            'EXT': [
                ('Planning & Design', ProjectPhase.SITE_PREPARATION, 10),
                ('Foundation Extension', ProjectPhase.FOUNDATION, 15),
                ('Structural Extension', ProjectPhase.FRAMING, 25),
                ('Integration Work', ProjectPhase.INTERIOR, 30),
                ('Final Inspection', ProjectPhase.FINAL_INSPECTION, 5),
            ],
        }
        
        templates = milestone_templates.get(
            construction_request.construction_type,
            milestone_templates['NEW']
        )
        
        start_date = project.planned_start_date or timezone.now().date()
        current_date = start_date
        
        for idx, (title, phase, duration_days) in enumerate(templates):
            end_date = current_date + timedelta(days=duration_days)
            
            ProjectMilestone.objects.create(
                project=project,
                title=title,
                phase=phase,
                status=MilestoneStatus.NOT_STARTED,
                planned_start_date=current_date,
                planned_end_date=end_date,
                estimated_cost=project.estimated_budget * (duration_days / 100),  # Rough estimate
                created_by=project.created_by,
            )
            
            current_date = end_date + timedelta(days=1)


class ProjectAdminViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD viewset for managing projects.
    Provides full access to all projects with filtering and search.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = (IsAdminUser,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('status', 'current_phase')
    search_fields = ('title', 'description', 'location')
    ordering_fields = ('created_at', 'updated_at', 'planned_start_date', 'planned_end_date', 'title')
    ordering = ('-created_at',)

    def perform_create(self, serializer):
        """Set the created_by field to the current user when creating a project."""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Update project without modifying created_by field."""
        serializer.save()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Select and prefetch related data for optimization
        queryset = queryset.select_related(
            'project_manager',
            'site_supervisor',
            'construction_request',
            'construction_request__client',
            'property'
        ).prefetch_related(
            'contractors',
            'milestones',
            'documents',
            'updates',
            'tasks'
        )
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get project statistics for admin dashboard.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total_projects': queryset.count(),
            'by_status': {
                'planning': queryset.filter(status=ProjectStatus.PLANNING).count(),
                'in_progress': queryset.filter(status=ProjectStatus.IN_PROGRESS).count(),
                'on_hold': queryset.filter(status=ProjectStatus.ON_HOLD).count(),
                'completed': queryset.filter(status=ProjectStatus.COMPLETED).count(),
                'cancelled': queryset.filter(status=ProjectStatus.CANCELLED).count(),
            },
            'by_phase': {},
            'budget_summary': {
                'total_estimated': queryset.aggregate(
                    total=Sum('estimated_budget')
                )['total'] or 0,
                'total_actual': queryset.aggregate(
                    total=Sum('actual_cost')
                )['total'] or 0,
            },
            'recent_projects': queryset.order_by('-created_at')[:5].values(
                'id', 'title', 'status', 'created_at'
            ),
        }
        
        # Calculate by phase
        for phase in ProjectPhase:
            stats['by_phase'][phase.value] = queryset.filter(
                current_phase=phase.value
            ).count()
        
        return Response(stats)

    @action(detail=True, methods=['post'])
    def assign_manager(self, request, pk=None):
        """
        Assign a project manager to the project.
        """
        project = self.get_object()
        manager_id = request.data.get('manager_id')
        
        if not manager_id:
            return Response(
                {'error': 'manager_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from accounts.models import User
        try:
            manager = User.objects.get(id=manager_id)
            project.project_manager = manager
            project.save()
            
            return Response({
                'message': f'Project manager assigned successfully',
                'manager': {
                    'id': manager.id,
                    'email': manager.email,
                    'first_name': manager.first_name,
                    'last_name': manager.last_name,
                }
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def assign_supervisor(self, request, pk=None):
        """
        Assign a site supervisor to the project.
        """
        project = self.get_object()
        supervisor_id = request.data.get('supervisor_id')
        
        if not supervisor_id:
            return Response(
                {'error': 'supervisor_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from accounts.models import User
        try:
            supervisor = User.objects.get(id=supervisor_id)
            project.site_supervisor = supervisor
            project.save()
            
            return Response({
                'message': f'Site supervisor assigned successfully',
                'supervisor': {
                    'id': supervisor.id,
                    'email': supervisor.email,
                    'first_name': supervisor.first_name,
                    'last_name': supervisor.last_name,
                }
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update project status with admin override.
        """
        project = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(ProjectStatus.choices):
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = project.status
        project.status = new_status
        
        # Update dates based on status
        now = timezone.now()
        if new_status == ProjectStatus.IN_PROGRESS and not project.actual_start_date:
            project.actual_start_date = now
        elif new_status == ProjectStatus.COMPLETED and not project.actual_end_date:
            project.actual_end_date = now
        
        project.save()
        
        # Create an update record if notes provided
        if notes:
            from construction.models import ProjectUpdate, ProjectUpdateCategory
            ProjectUpdate.objects.create(
                project=project,
                title=f'Status changed from {old_status} to {new_status}',
                description=notes,
                category=ProjectUpdateCategory.STATUS_CHANGE,
                created_by=request.user,
                is_customer_visible=True
            )
        
        return Response({
            'message': f'Project status updated from {old_status} to {new_status}',
            'project': ProjectSerializer(project).data
        })


from construction.models import ProjectMilestone
from construction.serializers.project_serializers import (
    ProjectMilestoneSerializer,
    ProjectMilestoneDetailSerializer,
)
from django.shortcuts import get_object_or_404


class ProjectMilestoneAdminViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD viewset for managing project milestones.
    Provides full access to all milestones with filtering and search.
    """
    serializer_class = ProjectMilestoneSerializer
    permission_classes = (IsAdminUser,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('status', 'phase')
    search_fields = ('title', 'description')
    ordering_fields = ('planned_start_date', 'planned_end_date', 'created_at')
    ordering = ('planned_start_date',)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectMilestoneDetailSerializer
        return ProjectMilestoneSerializer

    def get_queryset(self):
        """
        Filter milestones based on project if project_pk is in URL.
        """
        queryset = ProjectMilestone.objects.all()
        
        # Filter by project if project_pk is in URL
        project_pk = self.kwargs.get('project_pk')
        if project_pk:
            queryset = queryset.filter(project_id=project_pk)
        
        # Select related data for optimization
        queryset = queryset.select_related(
            'project',
            'created_by'
        ).prefetch_related(
            'depends_on'
        )
        
        return queryset

    def perform_create(self, serializer):
        """
        Set the project and created_by for new milestones based on URL parameter.
        """
        project_pk = self.kwargs.get('project_pk')
        if project_pk:
            project = get_object_or_404(Project, pk=project_pk)
            serializer.save(project=project, created_by=self.request.user)
        else:
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Update milestone without modifying created_by field."""
        serializer.save()

    @action(detail=True, methods=['post'])
    def update_progress(self, request, project_pk=None, pk=None):
        """
        Update milestone progress percentage.
        """
        milestone = self.get_object()
        progress = request.data.get('completion_percentage')
        
        try:
            progress = int(progress)
            if not 0 <= progress <= 100:
                raise ValueError("Progress must be between 0 and 100")
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid progress value. Must be an integer between 0 and 100"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        milestone.completion_percentage = progress
        
        # Update status based on progress
        from construction.models import MilestoneStatus
        if progress == 100:
            milestone.status = MilestoneStatus.COMPLETED
            if not milestone.actual_end_date:
                milestone.actual_end_date = timezone.now()
        elif progress > 0 and milestone.status == MilestoneStatus.NOT_STARTED:
            milestone.status = MilestoneStatus.IN_PROGRESS
            if not milestone.actual_start_date:
                milestone.actual_start_date = timezone.now()
        
        milestone.save()
        
        # Update project progress
        milestone.project.update_progress()
        
        return Response(
            ProjectMilestoneSerializer(milestone).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, project_pk=None, pk=None):
        """
        Update milestone status with validation.
        """
        milestone = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {"error": "status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from construction.models import MilestoneStatus
        
        # Validate status transition
        valid_transitions = {
            MilestoneStatus.NOT_STARTED: [MilestoneStatus.IN_PROGRESS, MilestoneStatus.CANCELLED],
            MilestoneStatus.IN_PROGRESS: [MilestoneStatus.COMPLETED, MilestoneStatus.ON_HOLD, MilestoneStatus.CANCELLED],
            MilestoneStatus.ON_HOLD: [MilestoneStatus.IN_PROGRESS, MilestoneStatus.CANCELLED],
            MilestoneStatus.COMPLETED: [],
            MilestoneStatus.CANCELLED: []
        }
        
        current_status = milestone.status
        if new_status not in valid_transitions.get(current_status, []):
            return Response(
                {"error": f"Invalid status transition from {current_status} to {new_status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update milestone status and dates
        milestone.status = new_status
        now = timezone.now()
        
        if new_status == MilestoneStatus.IN_PROGRESS and not milestone.actual_start_date:
            milestone.actual_start_date = now
        elif new_status == MilestoneStatus.COMPLETED:
            milestone.actual_end_date = now
            milestone.completion_percentage = 100
        
        milestone.save()
        
        # Update project progress
        milestone.project.update_progress()
        
        return Response(
            ProjectMilestoneSerializer(milestone).data,
            status=status.HTTP_200_OK
        )
