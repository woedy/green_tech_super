from __future__ import annotations

from datetime import datetime

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, NumberFilter
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from leads.services import sync_lead_from_property_inquiry

from .models import Property, PropertyInquiry, ViewingAppointment
from .serializers import (
    PropertyDetailSerializer,
    PropertyInquirySerializer,
    PropertyListSerializer,
    ViewingAppointmentSerializer,
    ViewingAppointmentDetailSerializer,
)
from .tasks import send_inquiry_notifications


class PropertyFilter(FilterSet):
    type = CharFilter(field_name='property_type', lookup_expr='iexact')
    region = CharFilter(field_name='region__slug', lookup_expr='iexact')
    q = CharFilter(method='filter_q')
    min_price = NumberFilter(field_name='price', lookup_expr='gte')
    max_price = NumberFilter(field_name='price', lookup_expr='lte')
    beds = NumberFilter(field_name='bedrooms', lookup_expr='gte')
    baths = NumberFilter(field_name='bathrooms', lookup_expr='gte')

    class Meta:
        model = Property
        fields = ()

    def filter_q(self, queryset, name, value):
        return queryset.filter(Q(title__icontains=value) | Q(city__icontains=value) | Q(summary__icontains=value))


class PropertyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Property.objects.select_related('region').prefetch_related('images')
    serializer_class = PropertyListSerializer
    permission_classes = (AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_class = PropertyFilter
    ordering_fields = ('price', 'bedrooms', 'bathrooms', 'created_at')
    ordering = ('-featured', '-created_at')
    lookup_field = 'slug'

    @action(detail=False, methods=['get'], permission_classes=(IsAuthenticated,))
    def my_properties(self, request):
        from .models_transactions import PropertyTransaction, TransactionStatus
        user = request.user
        
        # Include properties with active or successful transactions
        active_statuses = [
            TransactionStatus.APPROVED,
            TransactionStatus.CONTRACT_PENDING,
            TransactionStatus.CONTRACT_SIGNED,
            TransactionStatus.PAYMENT_PENDING,
            TransactionStatus.COMPLETED
        ]
        
        property_ids = PropertyTransaction.objects.filter(
            client=user,
            status__in=active_statuses
        ).values_list('property_ref_id', flat=True)
        
        queryset = self.get_queryset().filter(id__in=property_ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        return super().get_serializer_class()


class PropertyInquiryView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = PropertyInquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()
        send_inquiry_notifications.delay(str(inquiry.id))
        sync_lead_from_property_inquiry(inquiry)
        return Response(PropertyInquirySerializer(inquiry).data, status=status.HTTP_201_CREATED)


class ViewingAppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    ordering_fields = ('scheduled_for', 'created_at')
    ordering = ('-scheduled_for',)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ViewingAppointmentDetailSerializer
        return ViewingAppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = ViewingAppointment.objects.select_related('property', 'property__region', 'inquiry', 'agent')

        if user.is_staff or user.is_superuser:
            return qs

        # For agents, show appointments assigned to them OR on properties they listed
        if hasattr(user, 'user_type') and user.user_type == 'AGENT':
            from django.db.models import Q
            return qs.filter(Q(agent=user) | Q(property__listed_by=user))

        # Customers: return appointments without additional filtering.
        # The appointment is currently linked to a PropertyInquiry (not an authenticated customer),
        # so filtering by user identity is not reliable across flows.
        return qs
