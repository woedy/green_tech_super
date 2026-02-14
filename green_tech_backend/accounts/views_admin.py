from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .serializers_admin import UserAdminSerializer, UserAdminCreateSerializer, UserAdminUpdateSerializer

User = get_user_model()


class UserAdminViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing users."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user_type', 'is_active', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['created_at', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']

    def get_queryset(self):
        return User.objects.all().select_related('profile')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserAdminUpdateSerializer
        return UserAdminSerializer

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update users."""
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                {'detail': 'No updates provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = []
        errors = []
        
        for update in updates:
            user_id = update.get('id')
            patch = update.get('patch', {})
            
            if not user_id:
                errors.append({'id': None, 'error': 'User ID is required'})
                continue
            
            try:
                user = User.objects.get(pk=user_id)
                
                # Update allowed fields
                for field, value in patch.items():
                    if field in ['is_active', 'is_verified', 'user_type', 'first_name', 'last_name', 'phone_number']:
                        setattr(user, field, value)
                
                user.save()
                success.append(user_id)
            except User.DoesNotExist:
                errors.append({'id': user_id, 'error': 'User not found'})
            except Exception as e:
                errors.append({'id': user_id, 'error': str(e)})
        
        return Response({
            'success': success,
            'errors': errors
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_verified(self, request, pk=None):
        """Toggle user verified status."""
        user = self.get_object()
        user.is_verified = not user.is_verified
        user.save(update_fields=['is_verified'])
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
