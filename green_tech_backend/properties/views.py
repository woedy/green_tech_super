from __future__ import annotations

from datetime import datetime

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, NumberFilter
from rest_framework import filters, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Property, PropertyInquiry
from .serializers import PropertyDetailSerializer, PropertyInquirySerializer, PropertyListSerializer
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
        return Response(PropertyInquirySerializer(inquiry).data, status=status.HTTP_201_CREATED)
