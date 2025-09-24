from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator


class GhanaRegion(models.Model):
    """Model representing regions in Ghana with cost multipliers."""
    class RegionName(models.TextChoices):
        GREATER_ACCRA = 'GREATER_ACCRA', _('Greater Accra')
        ASHANTI = 'ASHANTI', _('Ashanti')
        EASTERN = 'EASTERN', _('Eastern')
        WESTERN = 'WESTERN', _('Western')
        CENTRAL = 'CENTRAL', _('Central')
        VOLTA = 'VOLTA', _('Volta')
        NORTHERN = 'NORTHERN', _('Northern')
        UPPER_EAST = 'UPPER_EAST', _('Upper East')
        UPPER_WEST = 'UPPER_WEST', _('Upper West')
        BRONG_AHAFO = 'BRONG_AHAFO', _('Brong Ahafo')
        OTI = 'OTI', _('Oti')
        SAVANNAH = 'SAVANNAH', _('Savannah')
        NORTH_EAST = 'NORTH_EAST', _('North East')
        WESTERN_NORTH = 'WESTERN_NORTH', _('Western North')
        AHAFO = 'AHAFO', _('Ahafo')
        BONO_EAST = 'BONO_EAST', _('Bono East')

    name = models.CharField(
        _('region name'),
        max_length=50,
        choices=RegionName.choices,
        unique=True
    )
    capital = models.CharField(_('capital city'), max_length=100)
    cost_multiplier = models.DecimalField(
        _('cost multiplier'),
        max_digits=5,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0.1)],
        help_text=_('Cost multiplier for this region (e.g., 1.2 for 20% higher costs)')
    )
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Ghana region')
        verbose_name_plural = _('Ghana regions')
        ordering = ['name']

    def __str__(self):
        return self.get_name_display()


class EcoFeature(models.Model):
    """Model representing eco-friendly features available in Ghana."""
    class FeatureCategory(models.TextChoices):
        SOLAR = 'SOLAR', _('Solar Energy')
        WATER = 'WATER', _('Water Conservation')
        MATERIALS = 'MATERIALS', _('Eco-friendly Materials')
        WASTE = 'WASTE', _('Waste Management')
        LANDSCAPING = 'LANDSCAPING', _('Sustainable Landscaping')
        INSULATION = 'INSULATION', _('Insulation & Ventilation')
        SMART_HOME = 'SMART_HOME', _('Smart Home Technology')

    name = models.CharField(_('feature name'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=FeatureCategory.choices
    )
    icon = models.CharField(
        _('icon class'),
        max_length=50,
        blank=True,
        help_text=_('CSS class for the feature icon')
    )
    is_available = models.BooleanField(
        _('is available in Ghana'),
        default=True
    )
    requires_specialist = models.BooleanField(
        _('requires specialist installation'),
        default=False
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('eco feature')
        verbose_name_plural = _('eco features')
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


class GhanaPricing(models.Model):
    """Model for regional pricing variations in Ghana."""
    class Currency(models.TextChoices):
        GHS = 'GHS', _('Ghana Cedi')
        USD = 'USD', _('US Dollar')

    region = models.ForeignKey(
        GhanaRegion,
        on_delete=models.CASCADE,
        related_name='pricing',
        verbose_name=_('region')
    )
    eco_feature = models.ForeignKey(
        EcoFeature,
        on_delete=models.CASCADE,
        related_name='pricing',
        verbose_name=_('eco feature')
    )
    base_price = models.DecimalField(
        _('base price'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Base price in GHS')
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        choices=Currency.choices,
        default=Currency.GHS
    )
    is_active = models.BooleanField(_('is active'), default=True)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Ghana pricing')
        verbose_name_plural = _('Ghana pricing')
        unique_together = ('region', 'eco_feature')
        ordering = ['region', 'eco_feature']

    def __str__(self):
        return f"{self.eco_feature.name} - {self.region.name} ({self.get_currency_display()})"

    def get_adjusted_price(self):
        """Return the price adjusted by the region's cost multiplier."""
        return round(float(self.base_price) * float(self.region.cost_multiplier), 2)
