from django.apps import AppConfig


class ConstructionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "construction"

    def ready(self):
        try:
            from . import signals  # noqa: F401
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Failed to import construction signals: %s", exc)
