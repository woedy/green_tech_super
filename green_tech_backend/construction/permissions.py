"""
Custom permissions for the construction app.
"""
from rest_framework import permissions
from django.shortcuts import get_object_or_404

from .models import (
    ConstructionRequest, 
    Project,
    ProjectMilestone,
    Quote,
    QuoteItem,
    ProjectStatus,
    MilestoneStatus
)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the owner of the object or admin.
        return obj.client == request.user or request.user.is_staff


class IsProjectTeamMember(permissions.BasePermission):
    """
    Custom permission to only allow team members (project manager, site supervisor, contractors)
    to view or edit project-related objects.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any team member
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user.is_staff or
                obj.project_manager == request.user or
                obj.site_supervisor == request.user or
                obj.contractors.filter(id=request.user.id).exists()
            )
            
        # Write permissions are only allowed to project manager or admin
        return request.user.is_staff or obj.project_manager == request.user


class IsProjectManagerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow project managers or admins to perform actions.
    """
    def has_permission(self, request, view):
        # Only allow authenticated users
        if not request.user.is_authenticated:
            return False
            
        # Allow all safe methods for project managers and admins
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_staff or request.user.role in ['project_manager', 'admin']
            

class IsQuoteOwnerOrStaff(permissions.BasePermission):
    """
    Permission to only allow the quote owner (client or creator) or staff to access it.
    """
    def has_permission(self, request, view):
        # Only allow authenticated users
        if not request.user.is_authenticated:
            return False
            
        # Allow list/create for all authenticated users
        if view.action in ['list', 'create']:
            return True
            
        # For other actions, check object permissions
        return True
    
    def has_object_permission(self, request, view, obj):
        # Allow read access to the client, creator, or staff
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user.is_staff or
                obj.construction_request.client == request.user or
                obj.created_by == request.user
            )
            
        # Allow write access only to the creator or staff
        return request.user.is_staff or obj.created_by == request.user


class IsQuoteItemOwnerOrStaff(permissions.BasePermission):
    """
    Permission to only allow the quote owner (client or creator) or staff to access its items.
    """
    def has_permission(self, request, view):
        # Only allow authenticated users
        if not request.user.is_authenticated:
            return False
            
        # For list/create, check if user can access the parent quote
        quote_id = view.kwargs.get('quote_pk')
        if quote_id:
            from .models import Quote
            quote = get_object_or_404(Quote, pk=quote_id)
            
            if request.method in permissions.SAFE_METHODS:
                return (
                    request.user.is_staff or
                    quote.construction_request.client == request.user or
                    quote.created_by == request.user
                )
                
            # For write operations, only allow if quote is in draft and user is the creator or staff
            return (
                quote.status == 'DRAFT' and
                (request.user.is_staff or quote.created_by == request.user)
            )
            
        return False
    
    def has_object_permission(self, request, view, obj):
        # Allow read access to the client, creator, or staff
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user.is_staff or
                obj.quote.construction_request.client == request.user or
                obj.quote.created_by == request.user
            )
            
        # Allow write access only if quote is in draft and user is the creator or staff
        return (
            obj.quote.status == 'DRAFT' and
            (request.user.is_staff or obj.quote.created_by == request.user)
        )
        # Only allow write operations for project managers and admins
        return request.user.is_staff or request.user.role in ['project_manager', 'admin']
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to project managers and admins
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user.is_staff or 
                hasattr(obj, 'project_manager') and obj.project_manager == request.user or
                hasattr(obj, 'created_by') and obj.created_by == request.user or
                hasattr(obj, 'uploaded_by') and obj.uploaded_by == request.user
            )
            
        # Write permissions are only allowed to the project manager or admin
        return (
            request.user.is_staff or 
            hasattr(obj, 'project_manager') and obj.project_manager == request.user or
            hasattr(obj, 'created_by') and obj.created_by == request.user
        )


class CanEditConstructionRequest(permissions.BasePermission):
    """
    Custom permission to only allow the client, project manager, or admin to edit a construction request.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the client, project manager, or admin
        return (
            obj.client == request.user or
            obj.project_manager == request.user or
            request.user.is_staff
        )


class CanEditProject(permissions.BasePermission):
    """
    Custom permission to only allow the project manager or admin to edit a project.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the project manager or admin
        return (
            obj.project_manager == request.user or
            request.user.is_staff
        )


class CanEditDocument(permissions.BasePermission):
    """
    Custom permission to only allow the uploader, project manager, or admin to edit a document.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the uploader, project manager, or admin
        return (
            obj.uploaded_by == request.user or
            (hasattr(obj, 'project') and obj.project.project_manager == request.user) or
            request.user.is_staff
        )
