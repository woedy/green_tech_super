"""
Custom permissions for rental property management.
"""
from rest_framework import permissions


class IsPropertyOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of a property or admins to edit it.
    """
    def has_permission(self, request, view):
        # Only authenticated users can access
        if not request.user.is_authenticated:
            return False
            
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # For safe methods, check if user is a property owner or manager
        if request.method in permissions.SAFE_METHODS:
            return request.user.owned_properties.exists() or request.user.managed_properties.exists()
            
        # For write methods, check if user is a property owner
        return request.user.owned_properties.exists()


class IsTenantOrAdmin(permissions.BasePermission):
    """
    Permission to only allow tenants of a lease or admins to view/edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # Tenants can view their own lease
        return obj.tenant == request.user


class IsMaintenanceStaffOrAdmin(permissions.BasePermission):
    """
    Permission to only allow maintenance staff or admins to manage maintenance requests.
    """
    def has_permission(self, request, view):
        # Only authenticated users can access
        if not request.user.is_authenticated:
            return False
            
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # Check if user is in maintenance staff group
        return request.user.groups.filter(name='Maintenance').exists()


class CanManageLease(permissions.BasePermission):
    """
    Permission to check if user can manage a lease.
    """
    def has_permission(self, request, view):
        # Only authenticated users can access
        if not request.user.is_authenticated:
            return False
            
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # For create, check if user is a property owner/manager
        if request.method == 'POST':
            return request.user.owned_properties.exists() or request.user.managed_properties.exists()
            
        # For list, check if user is a tenant, owner, or manager
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # Property owners and managers can manage leases for their properties
        if obj.property.owner == request.user or obj.property.managers.filter(id=request.user.id).exists():
            return True
            
        # Tenants can view their own lease
        if obj.tenant == request.user and request.method in permissions.SAFE_METHODS:
            return True
            
        return False


class CanManagePayment(permissions.BasePermission):
    """
    Permission to check if user can manage a payment.
    """
    def has_permission(self, request, view):
        # Only authenticated users can access
        if not request.user.is_authenticated:
            return False
            
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # For create, check if user is a tenant, property owner, or manager
        if request.method == 'POST':
            return True  # Will be checked in the view
            
        return True  # Object permission will handle the rest
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_staff:
            return True
            
        # Property owners and managers can manage payments for their properties
        if obj.lease.property.owner == request.user or obj.lease.property.managers.filter(id=request.user.id).exists():
            return True
            
        # Tenants can view their own payments
        if obj.lease.tenant == request.user and request.method in permissions.SAFE_METHODS:
            return True
            
        return False
