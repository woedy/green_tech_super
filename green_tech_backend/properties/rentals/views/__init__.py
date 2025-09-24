# Import views to make them available in the rentals.views namespace
from .rental_application import (
    RentalApplicationViewSet, ApplicationDocumentViewSet, TenantScreeningViewSet
)

__all__ = [
    'RentalApplicationViewSet', 'ApplicationDocumentViewSet', 'TenantScreeningViewSet'
]
