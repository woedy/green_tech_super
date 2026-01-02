from rest_framework import viewsets, status, filters, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import (
    Q, Prefetch, Sum, Count, F, FloatField, ExpressionWrapper,
    Case, When, Value, BooleanField
)
from django.db.models.functions import Coalesce
from django.utils import timezone

from properties.models import Property
from construction.ghana.models import EcoFeature
from .models import (
    SustainabilityScore, CertificationStandard, PropertyCertification,
    SustainabilityFeatureImpact, PropertyComparison, CostSavingsEstimate
)
from .serializers import (
    SustainabilityScoreSerializer, CertificationStandardSerializer,
    PropertyCertificationSerializer, SustainabilityFeatureImpactSerializer,
    PropertyComparisonSerializer, CostSavingsEstimateSerializer,
    PropertyWithScoresSerializer, PropertyComparisonDetailSerializer
)


class SustainabilityScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing and managing sustainability scores.
    Provides detailed scoring information and certification levels.
    """
    serializer_class = SustainabilityScoreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'property': ['exact'],
        'category': ['exact', 'in'],
        'score': ['gte', 'lte', 'exact'],
        'last_updated': ['gte', 'lte', 'exact', 'date']
    }
    search_fields = ['property__title', 'property__description']
    ordering_fields = ['category', 'score', 'last_updated']
    ordering = ['category']
    
    def get_queryset(self):
        queryset = SustainabilityScore.objects.select_related('property')
        
        # Filter by certification level if provided
        certification_level = self.request.query_params.get('certification_level')
        if certification_level:
            # Get properties with overall score matching the certification level
            queryset = queryset.filter(
                category='OVERALL',
                score__gte=self.get_min_score_for_certification(certification_level)
            )
            
            # Annotate with certification level
            queryset = queryset.annotate(
                certification_level=Case(
                    When(score__gte=90, then=Value('PLATINUM')),
                    When(score__gte=80, then=Value('GOLD')),
                    When(score__gte=65, then=Value('SILVER')),
                    When(score__gte=50, then=Value('BRONZE')),
                    default=Value(None),
                    output_field=models.CharField()
                )
            ).filter(certification_level=certification_level.upper())
            
        return queryset
    
    def get_min_score_for_certification(self, level):
        """Return the minimum score required for a certification level."""
        levels = {
            'BRONZE': 50,
            'SILVER': 65,
            'GOLD': 80,
            'PLATINUM': 90
        }
        return levels.get(level.upper(), 0)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get a summary of sustainability scores for the authenticated user's properties.
        Includes average scores and certification distribution.
        """
        from django.db.models import Avg, Count, Case, When, Value, IntegerField
        
        # Get base queryset for the user's properties
        queryset = self.get_queryset().filter(property__created_by=request.user)
        
        # Calculate average scores by category
        avg_scores = queryset.values('category').annotate(
            avg_score=Avg('score'),
            count=Count('id')
        ).order_by('category')
        
        # Calculate certification distribution
        cert_distribution = queryset.filter(category='OVERALL').aggregate(
            bronze=Count(
                Case(
                    When(score__gte=50, score__lt=65, then=1),
                    output_field=IntegerField()
                )
            ),
            silver=Count(
                Case(
                    When(score__gte=65, score__lt=80, then=1),
                    output_field=IntegerField()
                )
            ),
            gold=Count(
                Case(
                    When(score__gte=80, score__lt=90, then=1),
                    output_field=IntegerField()
                )
            ),
            platinum=Count(
                Case(
                    When(score__gte=90, then=1),
                    output_field=IntegerField()
                )
            ),
            uncertified=Count(
                Case(
                    When(score__lt=50, then=1),
                    output_field=IntegerField()
                )
            )
        )
        
        return Response({
            'average_scores': {
                score['category']: {
                    'average': score['avg_score'],
                    'count': score['count']
                }
                for score in avg_scores
            },
            'certification_distribution': cert_distribution,
            'total_properties': queryset.values('property').distinct().count()
        })


class CertificationStandardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing certification standards.
    """
    queryset = CertificationStandard.objects.filter(is_active=True)
    serializer_class = CertificationStandardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'issuing_organization', 'description']
    ordering_fields = ['name', 'minimum_score']
    ordering = ['name']


class PropertyCertificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing property certifications.
    """
    serializer_class = PropertyCertificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['property', 'standard', 'status']
    ordering_fields = ['issue_date', 'expiry_date', 'created_at']
    ordering = ['-issue_date', '-created_at']
    
    def get_queryset(self):
        # Users can only see their own certifications or all if they're staff
        queryset = PropertyCertification.objects.select_related(
            'property', 'standard', 'verified_by'
        )
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(property__created_by=self.request.user) |
                Q(created_by=self.request.user)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a certification request."""
        cert = self.get_object()
        
        if cert.status != 'PENDING':
            return Response(
                {'error': 'Only pending certifications can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cert.status = 'APPROVED'
        cert.verified_by = request.user
        cert.verification_notes = request.data.get('verification_notes', '')
        cert.issue_date = timezone.now().date()
        
        # Set expiry date if provided, or default to 1 year from now
        expiry_days = request.data.get('validity_days', 365)
        cert.expiry_date = timezone.now().date() + timezone.timedelta(days=expiry_days)
        
        cert.save()
        
        return Response(self.get_serializer(cert).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a certification request."""
        cert = self.get_object()
        
        if cert.status != 'PENDING':
            return Response(
                {'error': 'Only pending certifications can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cert.status = 'REJECTED'
        cert.verified_by = request.user
        cert.verification_notes = request.data.get('verification_notes', '')
        cert.save()
        
        return Response(self.get_serializer(cert).data)


class SustainabilityFeatureImpactViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing sustainability feature impacts.
    """
    serializer_class = SustainabilityFeatureImpactSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['eco_feature__category']
    search_fields = ['eco_feature__name', 'eco_feature__description']
    ordering_fields = ['eco_feature__name', 'energy_impact', 'water_impact']
    ordering = ['eco_feature__name']
    
    def get_queryset(self):
        return SustainabilityFeatureImpact.objects.select_related('eco_feature').all()


class PropertyComparisonViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing property comparisons.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve' and self.request.query_params.get('detailed') == 'true':
            return PropertyComparisonDetailSerializer
        return PropertyComparisonSerializer
    
    def get_queryset(self):
        # Users can only see their own comparisons or public ones
        queryset = PropertyComparison.objects.prefetch_related(
            'properties', 'created_by'
        )
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(created_by=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_property(self, request, pk=None):
        """Add a property to the comparison."""
        comparison = self.get_object()
        property_id = request.data.get('property_id')
        
        if not property_id:
            return Response(
                {'error': 'property_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            property = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if property is already in the comparison
        if comparison.properties.filter(id=property_id).exists():
            return Response(
                {'error': 'Property already in comparison'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add property to comparison
        comparison.properties.add(property)
        
        return Response(self.get_serializer(comparison).data)
    
    @action(detail=True, methods=['post'])
    def remove_property(self, request, pk=None):
        """Remove a property from the comparison."""
        comparison = self.get_object()
        property_id = request.data.get('property_id')
        
        if not property_id:
            return Response(
                {'error': 'property_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove property from comparison
        comparison.properties.remove(property_id)
        
        return Response(self.get_serializer(comparison).data)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get a summary of the comparison with aggregated metrics."""
        comparison = self.get_object()
        properties = comparison.properties.all()
        
        # Calculate average sustainability scores
        avg_scores = SustainabilityScore.objects.filter(
            property__in=properties
        ).values('category').annotate(
            avg_score=ExpressionWrapper(
                Sum('score') * 1.0 / Count('id'),
                output_field=FloatField()
            )
        )
        
        # Calculate total cost savings
        total_savings = CostSavingsEstimate.objects.filter(
            property__in=properties,
            is_installed=True
        ).aggregate(
            total_annual_savings=Coalesce(Sum('annual_savings'), 0),
            total_co2_reduction=Coalesce(Sum('annual_co2_reduction'), 0),
            total_water_savings=Coalesce(Sum('annual_water_savings'), 0)
        )
        
        # Count certifications
        certification_counts = PropertyCertification.objects.filter(
            property__in=properties,
            status='APPROVED'
        ).values('standard__name').annotate(
            count=Count('id')
        )
        
        # Get top eco features
        top_eco_features = SustainabilityFeatureImpact.objects.filter(
            eco_feature__properties__in=properties
        ).annotate(
            property_count=Count('eco_feature__properties', distinct=True)
        ).order_by('-property_count')[:5]
        
        return Response({
            'id': comparison.id,
            'name': comparison.name,
            'property_count': properties.count(),
            'average_scores': avg_scores,
            'total_savings': total_savings,
            'certification_counts': certification_counts,
            'top_eco_features': SustainabilityFeatureImpactSerializer(
                top_eco_features, many=True, context={'request': request}
            ).data
        })


class CostSavingsEstimateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing cost savings estimates.
    """
    serializer_class = CostSavingsEstimateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property', 'eco_feature', 'is_installed']
    search_fields = ['property__title', 'eco_feature__name', 'notes']
    ordering_fields = ['payback_period', 'annual_savings', 'installation_cost']
    ordering = ['payback_period']
    
    def get_queryset(self):
        # Users can only see their own properties' estimates or all if they're staff
        queryset = CostSavingsEstimate.objects.select_related(
            'property', 'eco_feature'
        )
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(property__created_by=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        # Ensure the property belongs to the user
        property = serializer.validated_data['property']
        if property.created_by != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You don't have permission to add estimates to this property.")
        
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get a summary of cost savings across all properties."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Calculate total savings and investment
        summary = queryset.aggregate(
            total_installation_cost=Coalesce(Sum('installation_cost'), 0),
            total_annual_savings=Coalesce(Sum('annual_savings'), 0),
            avg_payback_period=ExpressionWrapper(
                Coalesce(Sum(F('installation_cost')), 0) * 1.0 / 
                Coalesce(Sum('annual_savings'), 1),
                output_field=FloatField()
            ),
            total_co2_reduction=Coalesce(Sum('annual_co2_reduction'), 0),
            total_water_savings=Coalesce(Sum('annual_water_savings'), 0),
            installed_count=Count('id', filter=Q(is_installed=True)),
            pending_count=Count('id', filter=Q(is_installed=False))
        )
        
        # Add ROI if there are any installations
        if summary['total_installation_cost'] > 0 and summary['total_annual_savings'] > 0:
            summary['roi_percentage'] = (
                summary['total_annual_savings'] / summary['total_installation_cost'] * 100
            )
        else:
            summary['roi_percentage'] = 0
        
        # Get top savings by feature
        top_savings = queryset.values('eco_feature__name').annotate(
            total_savings=Sum('annual_savings'),
            avg_payback=ExpressionWrapper(
                Coalesce(Sum(F('installation_cost')), 0) * 1.0 / 
                Coalesce(Sum('annual_savings'), 1),
                output_field=FloatField()
            ),
            property_count=Count('property', distinct=True)
        ).order_by('-total_savings')[:5]
        
        return Response({
            'summary': summary,
            'top_savings': list(top_savings)
        })
