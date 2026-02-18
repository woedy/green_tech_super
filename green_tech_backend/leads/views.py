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

        user = self.request.user
        if not user or not user.is_authenticated:
            return qs

        if hasattr(user, 'user_type') and user.user_type == 'AGENT' and not user.is_staff:
            from properties.models import Property
            property_ids = Property.objects.filter(listed_by=user).values_list('id', flat=True)
            qs = qs.filter(Q(assigned_to=user) | Q(metadata__property__id__in=list(property_ids)))
        elif not user.is_staff and not user.is_superuser:
            qs = qs.filter(assigned_to=user)

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

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def initiate_build_request(self, request, pk=None):
        """Convert a lead to a BuildRequest to allow quote creation."""
        lead = self.get_object()
        
        if lead.source_type == 'build_request':
            return Response({'detail': 'Lead is already a build request.', 'request_id': lead.source_id})

        from plans.models import BuildRequest, Plan
        from locations.models import Region
        
        # Try to get property from metadata
        property_data = lead.metadata.get('property', {})
        region = None
        if property_data.get('id'):
            from properties.models import Property
            try:
                prop = Property.objects.get(id=property_data['id'])
                region = prop.region
            except Property.DoesNotExist:
                pass
        
        if not region:
            # Fallback to first region or specific one
            region = Region.objects.first()
            
        if not region:
            return Response({'detail': 'No region found to create request.'}, status=status.HTTP_400_BAD_VALUE)

        # Get plan from request or metadata
        plan_id = request.data.get('plan_id') or lead.metadata.get('plan', {}).get('id')
        plan = None
        if plan_id:
            plan = Plan.objects.filter(id=plan_id).first()
        
        if not plan:
            plan = Plan.objects.first()
            
        if not plan:
            return Response({'detail': 'No plan found to create request.'}, status=status.HTTP_400_BAD_VALUE)

        # Create BuildRequest
        build_request = BuildRequest.objects.create(
            plan=plan,
            region=region,
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            contact_phone=lead.contact_phone,
            customizations=lead.metadata.get('message', ''),
            status='new'
        )
        
        # Update lead
        lead.source_type = 'build_request'
        lead.source_id = str(build_request.id)
        lead.log_activity(
            LeadActivityKind.UPDATED,
            f'Lead converted to Build Request: {build_request.id}',
            created_by=request.user if request.user.is_authenticated else None,
            metadata={'build_request_id': str(build_request.id)}
        )
        lead.save(update_fields=('source_type', 'source_id', 'updated_at', 'last_activity_at'))
        
        return Response({
            'detail': 'Lead successfully converted to build request.',
            'request_id': str(build_request.id),
            'lead': LeadSerializer(lead).data
        })
