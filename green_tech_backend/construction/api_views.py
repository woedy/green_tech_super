"""
API Views for Construction Request and Eco-Feature Selection
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.translation import gettext_lazy as _
from django.db import transaction

from construction.models import (
    ConstructionRequest, ConstructionRequestEcoFeature,
    ConstructionRequestStep
)
from construction.serializers import (
    ConstructionRequestSerializer, ConstructionRequestEcoFeatureSerializer
)
from construction.ghana.models import EcoFeature, GhanaRegion
from construction.permissions import IsOwnerOrAdmin, CanEditConstructionRequest


class ConstructionRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing construction requests with multi-step support.
    """
    queryset = ConstructionRequest.objects.all()
    serializer_class = ConstructionRequestSerializer
    permission_classes = [IsAuthenticated, CanEditConstructionRequest]
    
    def get_queryset(self):
        """Return construction requests for the authenticated user, filtered by status if provided."""
        user = self.request.user
        queryset = self.queryset
        
        # Filter by user
        if user.is_staff:
            queryset = queryset
        else:
            queryset = queryset.filter(client=user)
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        return queryset
    
    def perform_create(self, serializer):
        """Set the client to the current user when creating a request."""
        serializer.save(client=self.request.user)
    
    @action(detail=True, methods=['post'])
    def save_step(self, request, pk=None):
        """Save data for a specific step in the construction request process."""
        construction_request = self.get_object()
        step = request.data.get('step')
        data = request.data.get('data', {})
        
        if not step:
            return Response(
                {'error': _('Step is required.')}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the step
        if step not in dict(ConstructionRequestStep.choices):
            return Response(
                {'error': _('Invalid step.')}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the step data
        construction_request.save_step_data(step, data)
        
        # If this is the eco-features step, process the selected features
        if step == ConstructionRequestStep.ECO_FEATURES:
            self._process_eco_features(construction_request, data)
        
        # If this is the budget step, update the estimated cost
        elif step == ConstructionRequestStep.BUDGET:
            construction_request.budget = data.get('budget')
            construction_request.currency = data.get('currency', 'GHS')
            construction_request.save()
            construction_request.update_estimated_cost()
        
        serializer = self.get_serializer(construction_request)
        return Response(serializer.data)
    
    def _process_eco_features(self, construction_request, data):
        """Process the selected eco-features for a construction request."""
        selected_features = data.get('selected_features', [])
        
        # Clear existing selections
        construction_request.selected_eco_features.all().delete()
        
        # Add new selections
        for feature_data in selected_features:
            feature_id = feature_data.get('id')
            quantity = feature_data.get('quantity', 1)
            customizations = feature_data.get('customizations', {})
            
            try:
                eco_feature = EcoFeature.objects.get(id=feature_id)
                
                # Create the construction request eco feature
                ConstructionRequestEcoFeature.objects.create(
                    construction_request=construction_request,
                    eco_feature=eco_feature,
                    quantity=quantity,
                    customizations=customizations
                )
                
            except EcoFeature.DoesNotExist:
                continue
        
        # Update the estimated cost
        construction_request.update_estimated_cost()
    
    @action(detail=True, methods=['get'])
    def next_steps(self, request, pk=None):
        """Get the next available steps for the construction request."""
        construction_request = self.get_object()
        current_step = construction_request.current_step
        
        # Get all steps
        steps = dict(ConstructionRequestStep.choices)
        step_list = list(steps.keys())
        
        # Find the current step index
        try:
            current_index = step_list.index(current_step)
            next_steps = step_list[current_index + 1:]
        except (ValueError, IndexError):
            next_steps = []
        
        return Response({
            'current_step': current_step,
            'next_steps': [
                {'value': step, 'label': steps[step]} 
                for step in next_steps
            ]
        })
    
    @action(detail=True, methods=['post'])
    def generate_specification(self, request, pk=None):
        """Generate and return a PDF specification document for the construction request."""
        from django.http import FileResponse
        import os
        from django.conf import settings
        
        construction_request = self.get_object()
        
        # Check permissions
        if not request.user.is_staff and construction_request.client != request.user:
            return Response(
                {'error': 'You do not have permission to generate documents for this request.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Generate the document
            file_path, file_name = construction_request.generate_specification_document()
            
            # Return the file for download
            response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate specification: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EcoFeatureSelectionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    API endpoint for managing eco-feature selections for construction requests.
    """
    queryset = ConstructionRequestEcoFeature.objects.all()
    serializer_class = ConstructionRequestEcoFeatureSerializer
    permission_classes = [IsAuthenticated, CanEditConstructionRequest]
    
    def get_queryset(self):
        """Return eco-feature selections for the authenticated user's requests."""
        user = self.request.user
        queryset = self.queryset
        
        if not user.is_staff:
            queryset = queryset.filter(construction_request__client=user)
        
        # Filter by construction request if provided
        request_id = self.request.query_params.get('request_id')
        if request_id:
            queryset = queryset.filter(construction_request_id=request_id)
            
        return queryset.select_related('eco_feature')
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get eco-features grouped by category."""
        from construction.ghana.models import EcoFeatureCategory
        
        request_id = request.query_params.get('request_id')
        if not request_id:
            return Response(
                {'error': _('request_id parameter is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            construction_request = ConstructionRequest.objects.get(id=request_id)
        except ConstructionRequest.DoesNotExist:
            return Response(
                {'error': _('Construction request not found.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not request.user.is_staff and construction_request.client != request.user:
            return Response(
                {'error': _('You do not have permission to access this request.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all categories with their features
        categories = []
        for category in EcoFeatureCategory.objects.all():
            features = category.eco_features.all()
            
            # Get the selected features for this request
            selected_features = {
                str(feature.eco_feature_id): {
                    'id': feature.id,
                    'quantity': feature.quantity,
                    'customizations': feature.customizations,
                    'estimated_cost': feature.estimated_cost
                }
                for feature in construction_request.selected_eco_features.filter(
                    eco_feature__category=category
                )
            }
            
            categories.append({
                'id': str(category.id),
                'name': category.name,
                'description': category.description,
                'features': [
                    {
                        'id': str(feature.id),
                        'name': feature.name,
                        'description': feature.description,
                        'base_cost': float(feature.base_cost or 0),
                        'is_selected': str(feature.id) in selected_features,
                        'selected_data': selected_features.get(str(feature.id), {})
                    }
                    for feature in features
                ]
            })
        
        return Response(categories)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create or update multiple eco-feature selections."""
        request_id = request.data.get('request_id')
        features = request.data.get('features', [])
        
        if not request_id:
            return Response(
                {'error': _('request_id is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            construction_request = ConstructionRequest.objects.get(id=request_id)
        except ConstructionRequest.DoesNotExist:
            return Response(
                {'error': _('Construction request not found.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not request.user.is_staff and construction_request.client != request.user:
            return Response(
                {'error': _('You do not have permission to modify this request.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Clear existing selections
        construction_request.selected_eco_features.all().delete()
        
        # Create new selections
        created_features = []
        for feature_data in features:
            feature_id = feature_data.get('id')
            quantity = feature_data.get('quantity', 1)
            customizations = feature_data.get('customizations', {})
            
            try:
                eco_feature = EcoFeature.objects.get(id=feature_id)
                
                # Create the construction request eco feature
                feature = ConstructionRequestEcoFeature.objects.create(
                    construction_request=construction_request,
                    eco_feature=eco_feature,
                    quantity=quantity,
                    customizations=customizations
                )
                
                # Calculate the cost for this feature
                feature.calculate_cost()
                created_features.append(feature)
                
            except EcoFeature.DoesNotExist:
                continue
        
        # Update the estimated cost for the construction request
        construction_request.update_estimated_cost()
        
        serializer = self.get_serializer(created_features, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
