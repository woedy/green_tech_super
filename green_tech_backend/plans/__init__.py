"""Lazy exports for the plans app to avoid touching Django's app registry early."""

from importlib import import_module
from typing import Any

__all__ = [
    'ActionType',
    'Plan',
    'PlanAuditLog',
    'PlanImage',
    'PlanFeature',
    'PlanOption',
    'PlanRegionalPricing',
    'BuildRequest',
    'BuildRequestAttachment',
    'plan_log_action',
    'plan_publish',
    'plan_unpublish',
]


_MODEL_EXPORTS = {
    'Plan',
    'PlanImage',
    'PlanFeature',
    'PlanOption',
    'PlanRegionalPricing',
    'BuildRequest',
    'BuildRequestAttachment',
}

_AUDIT_EXPORTS = {
    'ActionType',
    'PlanAuditLog',
    'plan_log_action',
    'plan_publish',
    'plan_unpublish',
}


def __getattr__(name: str) -> Any:  # pragma: no cover - thin forwarding layer
    if name in _MODEL_EXPORTS:
        module = import_module('.models', __name__)
        value = getattr(module, name)
        globals()[name] = value
        return value
    if name in _AUDIT_EXPORTS:
        module = import_module('.audit', __name__)
        value = getattr(module, name)
        globals()[name] = value
        return value
    raise AttributeError(f'module {__name__!r} has no attribute {name!r}')
