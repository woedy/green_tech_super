from __future__ import annotations

from django.db.models import Case, IntegerField, Q, Value, When
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Lead, LeadActivityKind, LeadPriority, LeadStatus
from .realtime import broadcast_lead_event
from .serializers import (
    LeadActivitySerializer,
    LeadNoteSerializer,
    LeadSerializer,
    LeadUpdateSerializer,
)


PRIORITY_ORDER = {
    LeadPriority.HIGH: 0,
    LeadPriority.MEDIUM: 1,
    LeadPriority.LOW: 2,
}


class LeadViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.annotate(
            priority_rank=Case(
                *[
                    When(priority=choice, then=Value(rank))
                    for choice, rank in PRIORITY_ORDER.items()
                ],
                default=Value(99),
                output_field=IntegerField(),
            )
        ).order_by('priority_rank', '-last_activity_at')

        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        search = self.request.query_params.get('search')

        if status_param:
            qs = qs.filter(status=status_param)
        if priority_param:
            qs = qs.filter(priority=priority_param)
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(contact_name__icontains=search)
                | Q(contact_email__icontains=search)
                | Q(contact_phone__icontains=search)
            )
        return qs

    def partial_update(self, request, *args, **kwargs):
        lead = self.get_object()
        serializer = LeadUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        dirty_fields = set()
        should_broadcast = False
        if 'status' in validated and validated['status'] != lead.status:
            old = lead.status
            lead.status = validated['status']
            if lead.is_unread:
                lead.is_unread = False
                dirty_fields.add('is_unread')
            lead.log_activity(
                LeadActivityKind.STATUS_CHANGED,
                f'Status changed from {old} to {lead.status}',
                created_by=request.user if request.user.is_authenticated else None,
                metadata={'from': old, 'to': lead.status},
            )
            dirty_fields.add('status')
            should_broadcast = True
        if 'priority' in validated and validated['priority'] != lead.priority:
            old = lead.priority
            lead.priority = validated['priority']
            if lead.is_unread:
                lead.is_unread = False
                dirty_fields.add('is_unread')
            lead.log_activity(
                LeadActivityKind.PRIORITY_CHANGED,
                f'Priority changed from {old} to {lead.priority}',
                created_by=request.user if request.user.is_authenticated else None,
                metadata={'from': old, 'to': lead.priority},
            )
            dirty_fields.add('priority')
            should_broadcast = True
        if 'is_unread' in validated and validated['is_unread'] != lead.is_unread:
            lead.is_unread = validated['is_unread']
            dirty_fields.add('is_unread')
        if dirty_fields:
            ordered_fields = tuple(sorted(dirty_fields)) + ('updated_at', 'last_activity_at')
            lead.save(update_fields=ordered_fields)
            if should_broadcast:
                broadcast_lead_event('lead.updated', lead)
        elif validated:
            lead.save(update_fields=('updated_at',))

        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=['get', 'post'], url_path='notes', permission_classes=[AllowAny])
    def notes(self, request, pk=None):
        lead = self.get_object()
        if request.method.lower() == 'post':
            serializer = LeadNoteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            note = lead.notes.create(
                body=serializer.validated_data['body'],
                created_by=request.user if request.user.is_authenticated else None,
            )
            lead.log_activity(
                LeadActivityKind.NOTE_ADDED,
                'Note added to lead',
                created_by=request.user if request.user.is_authenticated else None,
                metadata={'note_id': str(note.id)},
            )
            broadcast_lead_event('lead.updated', lead)
            return Response(LeadNoteSerializer(note).data, status=status.HTTP_201_CREATED)
        notes = lead.notes.all()
        return Response(LeadNoteSerializer(notes, many=True).data)

    @action(detail=True, methods=['get'], url_path='activity', permission_classes=[AllowAny])
    def activity(self, request, pk=None):
        lead = self.get_object()
        return Response(LeadActivitySerializer(lead.activities.all(), many=True).data)
