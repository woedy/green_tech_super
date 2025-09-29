"""
API views for project and milestone management.
"""
from rest_framework import viewsets, status, mixins, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS, IsAdminUser
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, F, Case, When, Value, IntegerField, Sum
from django.db.models.functions import Coalesce

from construction.models import (
    Project,
    ProjectMilestone,
    ProjectStatus,
    ProjectPhase,
    MilestoneStatus,
    ConstructionRequest,
    Quote,
    ProjectDocument,
    ProjectDocumentVersion,
    ProjectTask,
    ProjectUpdate,
    ProjectChatMessage,
    ProjectMessageAttachment,
    ProjectMessageReceipt
)

from construction.serializers.project_serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    ProjectMilestoneSerializer,
    ProjectMilestoneDetailSerializer,
    ProjectStatusUpdateSerializer,
    ProjectPhaseUpdateSerializer,
    MilestoneStatusUpdateSerializer,
    ProjectDashboardSerializer,
    ProjectDocumentSerializer,
    ProjectDocumentVersionSerializer,
    ProjectTaskSerializer,
    ProjectUpdateSerializer,
    ProjectMessageSerializer
)

from construction.permissions import (
    IsProjectTeamMember,
    IsProjectManagerOrAdmin,
    CanEditProject,
    CanEditConstructionRequest
)
from construction.realtime import broadcast_project_message


class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing construction projects.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'status', 'current_phase']
    ordering_fields = ['start_date', 'end_date', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action == 'update_status':
            return ProjectStatusUpdateSerializer
        elif self.action == 'update_phase':
            return ProjectPhaseUpdateSerializer
        return ProjectSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsProjectTeamMember]
        elif self.action in ['create']:
            permission_classes = [IsAuthenticated, IsProjectManagerOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, CanEditProject]
        elif self.action in ['update_status', 'update_phase']:
            permission_classes = [IsAuthenticated, IsProjectManagerOrAdmin]
        elif self.action in ['dashboard', 'timeline', 'budget']:
            permission_classes = [IsAuthenticated, IsProjectTeamMember]
        else:
            permission_classes = [IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter projects based on user role and permissions.
        """
        user = self.request.user
        queryset = super().get_queryset()

        # For non-admin users, only show projects they're associated with
        if not user.is_staff and not user.is_superuser:
            queryset = queryset.filter(
                Q(project_manager=user) |
                Q(site_supervisor=user) |
                Q(contractors=user) |
                Q(construction_request__client=user)
            ).distinct()

        # Filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by phase if provided
        phase_param = self.request.query_params.get('phase', None)
        if phase_param:
            queryset = queryset.filter(current_phase=phase_param)

        return queryset

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Custom action to update project status with validation.
        """
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            
            # Validate status transition
            valid_transitions = {
                ProjectStatus.DRAFT: [ProjectStatus.PLANNING, ProjectStatus.CANCELLED],
                ProjectStatus.PLANNING: [ProjectStatus.IN_PROGRESS, ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED],
                ProjectStatus.IN_PROGRESS: [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
                ProjectStatus.ON_HOLD: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
                ProjectStatus.COMPLETED: [],
                ProjectStatus.CANCELLED: []
            }
            
            current_status = project.status
            if new_status not in valid_transitions.get(current_status, []):
                return Response(
                    {"status": f"Invalid status transition from {current_status} to {new_status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            project.status = new_status
            project.save()
            return Response(
                {"status": f"Project status updated to {new_status}"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_phase(self, request, pk=None):
        """
        Custom action to update project phase with validation.
        """
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data)
        
        if serializer.is_valid():
            new_phase = serializer.validated_data['current_phase']
            
            # Validate phase transition
            valid_phases = list(ProjectPhase)
            current_phase = project.current_phase
            
            if valid_phases.index(new_phase) < valid_phases.index(current_phase) and not request.user.is_superuser:
                return Response(
                    {"error": "Cannot move to a previous phase without admin approval"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            project.current_phase = new_phase
            project.save()
            return Response(
                {"status": f"Project phase updated to {new_phase}"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """
        Get comprehensive project dashboard data including:
        - Progress tracking
        - Budget status
        - Upcoming/overdue milestones
        - Team members
        - Risk factors
        - Phase-wise progress
        - Recent activities
        
        This endpoint provides a complete overview of the project's health
        and progress in a single request.
        """
        project = self.get_object()
        
        # Check if the user has permission to view this project
        self.check_object_permissions(self.request, project)
        
        # Prefetch related data to optimize queries
        project = (
            Project.objects
            .select_related('project_manager', 'site_supervisor', 'construction_request__client')
            .prefetch_related(
                'contractors',
                'milestones',
                'milestones__depends_on',
                'documents',
                'documents__current_version',
                'documents__current_version__uploaded_by',
                'documents__versions',
                'documents__versions__uploaded_by',
                'updates',
                'tasks'
            )
            .get(pk=project.pk)
        )

        serializer = ProjectDashboardSerializer(instance=project, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='timeline')
    def get_timeline(self, request, pk=None):
        """
        Get project timeline data including milestones and key dates.
        """
        project = self.get_object()
        milestones = project.milestones.all().order_by('planned_start_date')
        serializer = ProjectMilestoneSerializer(milestones, many=True)
        
        timeline_data = {
            'project': {
                'id': project.id,
                'title': project.title,
                'start_date': project.actual_start_date or project.planned_start_date,
                'end_date': project.actual_end_date or project.planned_end_date,
                'status': project.status,
                'current_phase': project.current_phase,
                'progress': project.progress_percentage,
            },
            'milestones': serializer.data
        }
        
        return Response(timeline_data)

    @action(detail=True, methods=['get'])
    def budget(self, request, pk=None):
        """
        Get project budget details and spending.
        """
        project = self.get_object()
        
        # Calculate budget utilization
        total_budget = project.budget or 0
        spent = project.milestones.aggregate(
            total_spent=Coalesce(Sum('actual_cost'), 0)
        )['total_spent']
        
        # Calculate budget by phase
        budget_by_phase = project.milestones.values('phase').annotate(
            planned=Coalesce(Sum('estimated_cost'), 0),
            actual=Coalesce(Sum('actual_cost'), 0)
        )
        
        budget_data = {
            'project_id': str(project.id),
            'project_title': project.title,
            'total_budget': total_budget,
            'total_spent': spent,
            'remaining_budget': total_budget - spent,
            'utilization_percentage': (spent / total_budget * 100) if total_budget > 0 else 0,
            'by_phase': budget_by_phase
        }
        
        return Response(budget_data)



class ProjectDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectDocumentSerializer
    permission_classes = [IsAuthenticated, IsProjectTeamMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_project(self):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        self.check_object_permissions(self.request, project)
        return project

    def get_queryset(self):
        project = self.get_project()
        return ProjectDocument.objects.filter(project=project).select_related(
            'current_version', 'current_version__uploaded_by'
        ).prefetch_related('versions', 'versions__uploaded_by')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.setdefault('request', self.request)
        return context

    def perform_create(self, serializer):
        project = self.get_project()
        serializer.save(project=project, created_by=self.request.user)

    def perform_update(self, serializer):
        project = self.get_project()
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            raise PermissionDenied('Only the project manager can modify documents.')
        serializer.save()

    def perform_destroy(self, instance):
        project = self.get_project()
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            raise PermissionDenied('Only the project manager can remove documents.')
        instance.delete()

    @action(detail=True, methods=['get'], url_path='versions')
    def list_versions(self, request, project_pk=None, pk=None):
        document = self.get_object()
        versions = document.versions.select_related('uploaded_by').order_by('-uploaded_at')
        serializer = ProjectDocumentVersionSerializer(versions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='versions')
    def create_version(self, request, project_pk=None, pk=None):
        document = self.get_object()
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'file is required.'}, status=status.HTTP_400_BAD_REQUEST)
        version = ProjectDocumentVersion.objects.create(
            document=document,
            file=upload,
            notes=request.data.get('notes', ''),
            uploaded_by=request.user if request.user.is_authenticated else None,
        )
        serializer = ProjectDocumentVersionSerializer(version, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectUpdateViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectUpdateSerializer
    permission_classes = [IsAuthenticated, IsProjectTeamMember]

    def get_project(self):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        self.check_object_permissions(self.request, project)
        return project

    def get_queryset(self):
        project = self.get_project()
        queryset = project.updates.all().order_by('-created_at')
        user = self.request.user
        if self.request.method in SAFE_METHODS and not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(is_customer_visible=True)
        return queryset

    def perform_create(self, serializer):
        project = self.get_project()
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            raise PermissionDenied('Only the project manager can post updates.')
        serializer.save(project=project, created_by=self.request.user)

    def perform_update(self, serializer):
        project = self.get_project()
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            raise PermissionDenied('Only the project manager can modify updates.')
        serializer.save()


class ProjectTaskViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectTaskSerializer
    permission_classes = [IsAuthenticated, IsProjectTeamMember]

    def get_project(self):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        self.check_object_permissions(self.request, project)
        return project

    def get_queryset(self):
        project = self.get_project()
        queryset = project.tasks.all().order_by('due_date', '-created_at')
        user = self.request.user
        if self.request.method in SAFE_METHODS and not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(Q(assigned_to=user) | Q(requires_customer_action=True))
        return queryset

    def perform_create(self, serializer):
        project = self.get_project()
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            raise PermissionDenied('Only the project manager can create tasks.')
        serializer.save(project=project, created_by=self.request.user)

    def perform_update(self, serializer):
        project = self.get_project()
        instance = serializer.instance
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            if not (instance.assigned_to_id == self.request.user.id or instance.requires_customer_action):
                raise PermissionDenied('You do not have permission to update this task.')
        serializer.save()

    def perform_destroy(self, instance):
        project = self.get_project()
        if not (self.request.user.is_staff or project.project_manager_id == self.request.user.id):
            raise PermissionDenied('Only the project manager can remove tasks.')
        instance.delete()



class ProjectMilestoneViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing project milestones.
    """
    serializer_class = ProjectMilestoneSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'status', 'phase']
    ordering_fields = ['planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date']
    ordering = ['planned_start_date']

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'retrieve':
            return ProjectMilestoneDetailSerializer
        elif self.action == 'update_status':
            return MilestoneStatusUpdateSerializer
        return ProjectMilestoneSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsProjectTeamMember]
        elif self.action in ['create']:
            permission_classes = [IsAuthenticated, IsProjectManagerOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, CanEditProject]
        elif self.action in ['update_status', 'add_dependency', 'remove_dependency', 'update_progress']:
            permission_classes = [IsAuthenticated, IsProjectTeamMember]
        else:
            permission_classes = [IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter milestones based on project and user permissions.
        """
        queryset = ProjectMilestone.objects.all()
        
        # Filter by project if project_pk is in URL
        project_pk = self.kwargs.get('project_pk')
        if project_pk:
            queryset = queryset.filter(project_id=project_pk)
        
        # For non-admin users, only show milestones for projects they're associated with
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            queryset = queryset.filter(
                Q(project__project_manager=user) |
                Q(project__supervisor=user) |
                Q(project__contractors=user) |
                Q(project__project_owner=user) |
                Q(assigned_to=user)
            ).distinct()
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # Filter by phase if provided
        phase_param = self.request.query_params.get('phase', None)
        if phase_param:
            queryset = queryset.filter(phase=phase_param)
            
        return queryset

    def perform_create(self, serializer):
        """
        Set the project for new milestones based on URL parameter.
        """
        project_pk = self.kwargs.get('project_pk')
        if project_pk:
            project = get_object_or_404(Project, pk=project_pk)
            serializer.save(project=project)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def update_status(self, request, project_pk=None, pk=None):
        """
        Custom action to update milestone status with validation.
        """
        milestone = self.get_object()
        serializer = self.get_serializer(milestone, data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            
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
                {"status": f"Milestone status updated to {new_status}"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        except (TypeError, ValueError) as e:
            return Response(
                {"error": "Invalid progress value. Must be an integer between 0 and 100"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        milestone.completion_percentage = progress
        
        # Update status based on progress
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
            {"status": f"Milestone progress updated to {progress}%"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def add_dependency(self, request, project_pk=None, pk=None):
        """
        Add a dependency to this milestone.
        """
        milestone = self.get_object()
        dependency_id = request.data.get('dependency_id')
        
        if not dependency_id:
            return Response(
                {"error": "dependency_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            dependency = ProjectMilestone.objects.get(pk=dependency_id, project_id=project_pk)
            
            # Check for circular dependencies
            if self._has_circular_dependency(milestone, dependency):
                return Response(
                    {"error": "Circular dependency detected"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            milestone.dependencies.add(dependency)
            return Response(
                {"status": f"Added dependency: {dependency.title}"},
                status=status.HTTP_200_OK
            )
            
        except ProjectMilestone.DoesNotExist:
            return Response(
                {"error": "Dependency milestone not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_dependency(self, request, project_pk=None, pk=None):
        """
        Remove a dependency from this milestone.
        """
        milestone = self.get_object()
        dependency_id = request.data.get('dependency_id')
        
        if not dependency_id:
            return Response(
                {"error": "dependency_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            dependency = milestone.dependencies.get(pk=dependency_id)
            milestone.dependencies.remove(dependency)
            return Response(
                {"status": f"Removed dependency: {dependency.title}"},
                status=status.HTTP_200_OK
            )
        except ProjectMilestone.DoesNotExist:
            return Response(
                {"error": "Dependency not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _has_circular_dependency(self, milestone, dependency):
        """
        Check if adding the dependency would create a circular reference.
        """
        # If the dependency is the milestone itself, it's a circular reference
        if milestone == dependency:
            return True

        # Check if the dependency already depends on the milestone
        visited = set()
        to_visit = [dependency]

        while to_visit:
            current = to_visit.pop()

            # If we've already visited this milestone, skip it
            if current.id in visited:
                continue

            # If we find the original milestone in the dependency tree, it's a circular reference
            if current == milestone:
                return True

            visited.add(current.id)

            # Add all dependencies of the current milestone to the queue
            to_visit.extend(current.dependencies.all())

        return False


class ProjectChatMessageViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """List and create chat messages for a specific project."""

    serializer_class = ProjectMessageSerializer
    permission_classes = (IsAuthenticated,)

    def _project_queryset(self):
        return Project.objects.select_related(
            'project_manager',
            'site_supervisor',
            'construction_request__client',
        ).prefetch_related('contractors')

    def _message_queryset(self):
        return ProjectChatMessage.objects.select_related('project', 'quote', 'sender').prefetch_related(
            'attachments',
            'receipts__user',
        )

    def _ensure_access(self, project: Project, *, write: bool = False) -> None:
        perm = IsProjectTeamMember()
        if not perm._is_team_member(self.request.user, project):
            raise PermissionDenied('You do not have access to this project chat.')
        if write:
            # Team members (including customers) may post messages once access is granted.
            return

    def get_project(self) -> Project:
        if not hasattr(self, '_project'):
            project = get_object_or_404(self._project_queryset(), pk=self.kwargs['project_pk'])
            self._ensure_access(project)
            self._project = project
        return self._project

    def get_queryset(self):
        project = self.get_project()
        return self._message_queryset().filter(project=project).order_by('created_at')

    def perform_create(self, serializer):
        project = self.get_project()
        self._ensure_access(project, write=True)
        user = self.request.user
        message = serializer.save(project=project, sender=user)
        ProjectMessageReceipt.objects.update_or_create(
            message=message,
            user=user,
            defaults={'read_at': timezone.now()},
        )
        broadcast_project_message(message)
        return message

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = self.perform_create(serializer)
        message = self._message_queryset().get(pk=message.pk)
        output = self.get_serializer(message)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)
