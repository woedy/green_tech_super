from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Plan
from .serializers_admin import PlanAdminSerializer


class PlanAdminViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD viewset for managing architectural plans."""

    serializer_class = PlanAdminSerializer
    permission_classes = (permissions.IsAdminUser,)
    queryset = (
        Plan.objects.all()
        .prefetch_related('images', 'features', 'options', 'pricing__region')
        .order_by('-updated_at')
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status') if self.request else None
        if status_filter == 'draft':
            queryset = queryset.filter(is_published=False)
        elif status_filter == 'published':
            queryset = queryset.filter(is_published=True)
        return queryset

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, *args, **kwargs):
        plan = self.get_object()
        plan._current_ip = request.META.get('REMOTE_ADDR')
        plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
        if plan.publish(user=request.user):
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        return Response({'detail': 'Plan is already published.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, *args, **kwargs):
        plan = self.get_object()
        plan._current_ip = request.META.get('REMOTE_ADDR')
        plan._current_user_agent = request.META.get('HTTP_USER_AGENT', '')
        if plan.unpublish(user=request.user):
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        return Response({'detail': 'Plan is already unpublished.'}, status=status.HTTP_400_BAD_REQUEST)
