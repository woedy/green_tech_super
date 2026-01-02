"""
Construction models package.
"""

# Import all models to ensure they are registered with Django
from .project import (
    Project,
    ProjectStatus,
    ProjectPhase,
    ProjectMilestone,
    MilestoneStatus,
    ProjectDocument,
    ProjectDocumentVersion,
    ProjectDocumentType,
    ProjectUpdate,
    ProjectUpdateCategory,
    ProjectTask,
    ProjectTaskStatus,
    ProjectTaskPriority,
    ProjectMessageAttachment,
    ProjectChatMessage,
    ProjectMessageReceipt,
)
from .request import ConstructionRequest, ConstructionMilestone, ConstructionDocument, ConstructionRequestEcoFeature, ConstructionRequestStep

# Make models available at the package level
__all__ = [
    # Project models
    'Project',
    'ProjectStatus',
    'ProjectPhase',
    'ProjectMilestone',
    'MilestoneStatus',
    'ProjectDocument',
    'ProjectDocumentVersion',
    'ProjectDocumentType',
    'ProjectUpdate',
    'ProjectUpdateCategory',
    'ProjectTask',
    'ProjectTaskStatus',
    'ProjectTaskPriority',
    'ProjectMessageAttachment',
    'ProjectChatMessage',
    'ProjectMessageReceipt',
    
    # Legacy construction request models
    'ConstructionRequest',
    'ConstructionMilestone',
    'ConstructionDocument',
    'ConstructionRequestEcoFeature',
    'ConstructionRequestStep',
]

