from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class PlansConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'plans'
    verbose_name = _('Plans')

    def ready(self):
        # Import and register signals and admin
        from . import signals  # noqa
        
        # Import audit admin to register it with the admin site
        try:
            from . import audit_admin  # noqa
        except Exception as e:
            # Log the error but don't crash if audit_admin fails to import
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to import audit_admin: {e}")
