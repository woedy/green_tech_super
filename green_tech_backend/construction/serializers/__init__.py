"""
Construction serializers package.
"""

# Import serializers from individual modules
from .project_serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    ProjectMilestoneSerializer,
    ProjectMilestoneDetailSerializer,
    ProjectStatusUpdateSerializer,
    ProjectPhaseUpdateSerializer,
    MilestoneStatusUpdateSerializer,
    ProjectDashboardSerializer,
)

from .request_serializers import (
    ConstructionMilestoneSerializer,
    ConstructionDocumentSerializer,
    ConstructionRequestEcoFeatureSerializer,
    ConstructionRequestSerializer,
    ProjectSerializer as RequestProjectSerializer,
)

from .quote_serializers import (
    QuoteItemSerializer,
    QuoteChangeLogSerializer,
    QuoteSerializer,
    QuoteDetailSerializer,
    QuoteCreateSerializer,
    QuoteUpdateSerializer,
    QuoteItemCreateSerializer,
    QuoteItemUpdateSerializer,
)

# Make serializers available at the package level
__all__ = [
    # Project serializers
    'ProjectSerializer',
    'ProjectDetailSerializer',
    'ProjectMilestoneSerializer',
    'ProjectMilestoneDetailSerializer',
    'ProjectStatusUpdateSerializer',
    'ProjectPhaseUpdateSerializer',
    'MilestoneStatusUpdateSerializer',
    'ProjectDashboardSerializer',
    
    # Request serializers
    'ConstructionMilestoneSerializer',
    'ConstructionDocumentSerializer',
    'ConstructionRequestEcoFeatureSerializer',
    'ConstructionRequestSerializer',
    'RequestProjectSerializer',
    
    # Quote serializers
    'QuoteItemSerializer',
    'QuoteChangeLogSerializer',
    'QuoteSerializer',
    'QuoteDetailSerializer',
    'QuoteCreateSerializer',
    'QuoteUpdateSerializer',
    'QuoteItemCreateSerializer',
    'QuoteItemUpdateSerializer',
]