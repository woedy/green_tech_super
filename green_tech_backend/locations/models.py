from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify


class RegionQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)


class Region(models.Model):
    """Represents a geographic region used for pricing and localization."""

    slug = models.SlugField(_('slug'), max_length=100, unique=True)
    name = models.CharField(_('name'), max_length=150)
    country = models.CharField(_('country'), max_length=100)
    currency_code = models.CharField(_('currency code'), max_length=3, default='USD')
    cost_multiplier = models.DecimalField(
        _('base cost multiplier'),
        max_digits=6,
        decimal_places=2,
        default=1.00,
        help_text=_('Multiplier applied to plan base prices to estimate local costs'),
    )
    timezone = models.CharField(_('timezone'), max_length=64, blank=True)
    
    # Ghana-specific fields (consolidated from GhanaRegion)
    capital = models.CharField(_('capital city'), max_length=100, blank=True)
    ghana_region_name = models.CharField(
        _('Ghana region name'),
        max_length=50,
        blank=True,
        help_text=_('Official Ghana region name if applicable')
    )
    local_materials_available = models.JSONField(
        _('local materials available'),
        default=list,
        blank=True,
        help_text=_('List of locally available construction materials')
    )
    
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    objects = RegionQuerySet.as_manager()

    class Meta:
        ordering = ('name',)
        verbose_name = _('region')
        verbose_name_plural = _('regions')
        indexes = [
            models.Index(fields=('country', 'name')),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.country})"
