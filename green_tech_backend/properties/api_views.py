from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, F, Value, BooleanField, Case, When
from django.db.models.functions import Coalesce
from .models import Property, PropertyImage, PropertyFeature
from .serializers import PropertySerializer, PropertyImageSerializer, PropertyFeatureSerializer
from construction.ghana.models import GhanaRegion, EcoFeature


class PropertyFilter(filters.FilterSet):
    """Advanced filtering for properties with eco-features and sustainability criteria."""
    min_energy_rating = filters.NumberFilter(field_name='energy_rating', lookup_expr='gte')
    min_water_rating = filters.NumberFilter(field_name='water_rating', lookup_expr='gte')
    min_sustainability_score = filters.NumberFilter(field_name='sustainability_score', lookup_expr='gte')
    has_certification = filters.CharFilter(method='filter_has_certification')
    eco_features = filters.CharFilter(method='filter_eco_features')
    
    class Meta:
        model = Property
        fields = {
            'property_type': ['exact', 'in'],
            'status': ['exact', 'in'],
            'price': ['lte', 'gte', 'exact'],
            'bedrooms': ['gte', 'lte', 'exact'],
            'bathrooms': ['gte', 'lte', 'exact'],
            'city': ['exact', 'icontains'],
            'region': ['exact'],
            'energy_rating': ['exact', 'gte', 'lte'],
            'water_rating': ['exact', 'gte', 'lte'],
            'sustainability_score': ['exact', 'gte', 'lte'],
        }
    
    def filter_has_certification(self, queryset, name, value):
        """Filter properties that have specific certifications."""
        if not value:
            return queryset
        cert_ids = [int(x) for x in value.split(',') if x.isdigit()]
        return queryset.filter(property_certifications__in=cert_ids).distinct()
    
    def filter_eco_features(self, queryset, name, value):
        """Filter properties that have specific eco-features."""
        if not value:
            return queryset
        feature_names = [x.strip() for x in value.split(',') if x.strip()]
        if not feature_names:
            return queryset
        
        # Get all properties that have at least one of the requested features
        return queryset.filter(
            features__name__in=feature_names,
            features__is_eco_friendly=True
        ).distinct()


class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing properties with advanced filtering and search capabilities.
    Supports filtering by eco-features, sustainability ratings, and certifications.
    """
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ['title', 'description', 'address', 'city', 'region']
    ordering_fields = [
        'price', 'created_at', 'updated_at', 'sustainability_score', 
        'energy_rating', 'water_rating', 'energy_efficiency_rating', 
        'water_efficiency_rating'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Enhance the queryset with annotations for eco-features and sustainability metrics.
        """
        queryset = super().get_queryset()
        
        # Annotate with eco-feature counts
        queryset = queryset.annotate(
            eco_feature_count=Count(
                'features',
                filter=Q(features__is_eco_friendly=True),
                distinct=True
            ),
            certification_count=Count('property_certifications', distinct=True)
        )
        
        # Handle sorting by sustainability metrics
        ordering = self.request.query_params.get('ordering', '')
        if ordering == 'sustainability':
            queryset = queryset.order_by(
                '-sustainability_score',
                '-energy_rating',
                '-water_rating',
                '-eco_feature_count',
                '-certification_count'
            )
            
        # Handle saved search if search_id is provided
        search_id = self.request.query_params.get('saved_search')
        if search_id and self.request.user.is_authenticated:
            try:
                saved_search = self.request.user.saved_searches.get(id=search_id)
                if saved_search.filters:
                    queryset = self.filter_queryset_by_saved_search(queryset, saved_search.filters)
            except Exception:
                pass
                
        return queryset
    
    def filter_queryset_by_saved_search(self, queryset, search_filters):
        """Apply filters from saved search."""
        for field, value in search_filters.items():
            if field == 'eco_features':
                queryset = queryset.filter(eco_features__in=value).distinct()
            elif field in ['price', 'area', 'bedrooms', 'bathrooms', 'energy_efficiency_rating', 
                          'water_efficiency_rating', 'sustainability_score']:
                if isinstance(value, dict):
                    for op, val in value.items():
                        if op == 'gt':
                            queryset = queryset.filter(**{f'{field}__gt': val})
                        elif op == 'lt':
                            queryset = queryset.filter(**{f'{field}__lt': val})
                        elif op == 'in':
                            queryset = queryset.filter(**{f'{field}__in': val})
                else:
                    queryset = queryset.filter(**{field: value})
            elif field in ['city', 'region', 'property_type', 'status']:
                if isinstance(value, list):
                    queryset = queryset.filter(**{f'{field}__in': value})
                else:
                    queryset = queryset.filter(**{field: value})
        return queryset

    def perform_create(self, serializer):
        """Set the created_by user when creating a property."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Return a list of featured properties with high sustainability scores.
        """
        featured = self.get_queryset().filter(
            status='PUBLISHED',
            sustainability_score__gte=70
        ).order_by('-sustainability_score', '-created_at')[:10]
        
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def eco_highlights(self, request):
        """
        Return properties that excel in specific sustainability categories.
        """
        # Get top properties for each sustainability category
        energy_leaders = self.get_queryset().filter(
            status='PUBLISHED',
            energy_rating__gte=4
        ).order_by('-sustainability_score')[:5]
        
        water_leaders = self.get_queryset().filter(
            status='PUBLISHED',
            water_rating__gte=4
        ).order_by('-sustainability_score')[:5]
        
        # Combine and deduplicate
        combined = list(energy_leaders) + [p for p in water_leaders if p not in energy_leaders]
        
        return Response({
            'energy_leaders': self.get_serializer(energy_leaders, many=True).data,
            'water_leaders': self.get_serializer(water_leaders, many=True).data,
            'all_highlights': self.get_serializer(combined, many=True).data
        })
        
    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        """Upload multiple images for a property."""
        property = self.get_object()
        if 'images' not in request.FILES:
            return Response(
                {'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        images = []
        for image in request.FILES.getlist('images'):
            image_data = {'property': property.id, 'image': image}
            serializer = PropertyImageSerializer(data=image_data)
            if serializer.is_valid():
                serializer.save()
                images.append(serializer.data)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(images, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Upload an image for the property."""
        property = self.get_object()
        serializer = PropertyImageSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # If this is the first image, set it as primary
            if not property.images.exists():
                serializer.validated_data['is_primary'] = True
            
            # Create the image
            image = PropertyImage.objects.create(
                property=property,
                **serializer.validated_data
            )
            
            return Response(
                PropertyImageSerializer(image, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def set_primary_image(self, request, pk=None):
        """Set an image as primary for the property."""
        property = self.get_object()
        image_id = request.data.get('image_id')
        
        try:
            image = property.images.get(id=image_id)
            # Unset current primary
            property.images.filter(is_primary=True).update(is_primary=False)
            # Set new primary
            image.is_primary = True
            image.save()
            return Response({'status': 'primary image set'})
        except PropertyImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def search_suggestions(self, request):
        """Get search suggestions for properties."""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])
            
        # Search in relevant fields
        properties = self.get_queryset().filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(city__iexact=query) |
            Q(region__iexact=query) |
            Q(address__icontains=query)
        ).distinct()[:10]  # Limit to 10 suggestions
        
        # Extract unique suggestions
        suggestions = set()
        
        for prop in properties:
            # Add property title if query matches
            if query.lower() in prop.title.lower():
                suggestions.add(prop.title)
                
            # Add city if query matches
            if prop.city and query.lower() in prop.city.lower():
                suggestions.add(prop.city)
                
            # Add region if query matches
            if prop.region and query.lower() in prop.region.lower():
                suggestions.add(prop.region)
        
        # Add eco-feature suggestions
        eco_features = PropertyFeature.objects.filter(
            name__icontains=query,
            is_eco_friendly=True
        ).values_list('name', flat=True).distinct()
        
        suggestions.update(eco_features)
        
        return Response({
            'query': query,
            'suggestions': sorted(list(suggestions))[:10]  # Return top 10
        })
