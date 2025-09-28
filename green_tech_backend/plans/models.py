from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import UniqueConstraint, Manager
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from .audit import ActionType


class PlanQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def drafts(self):
        return self.filter(is_published=False)


class PlanManager(Manager.from_queryset(PlanQuerySet)):
    def get_queryset(self):
        return super().get_queryset()

    def published(self):
        return self.get_queryset().published()

    def drafts(self):
        return self.get_queryset().drafts()


class PlanStyle(models.TextChoices):
    MODERN = 'modern', _('Modern')
    CONTEMPORARY = 'contemporary', _('Contemporary')
    BUNGALOW = 'bungalow', _('Bungalow')
    VILLA = 'villa', _('Villa')
    TOWNHOUSE = 'townhouse', _('Townhouse')
    TRADITIONAL = 'traditional', _('Traditional')


class Plan(models.Model):
    """Architectural plan that can be requested by prospective customers."""
    
    objects = PlanManager()
    
    slug = models.SlugField(_('slug'), max_length=120, unique=True)
    name = models.CharField(_('name'), max_length=150)
    summary = models.CharField(_('summary'), max_length=255, blank=True)
    description = models.TextField(_('description'), blank=True)
    style = models.CharField(_('style'), max_length=32, choices=PlanStyle.choices)
    bedrooms = models.PositiveSmallIntegerField(_('bedrooms'))
    bathrooms = models.PositiveSmallIntegerField(_('bathrooms'))
    floors = models.PositiveSmallIntegerField(_('floors'), default=1)
    area_sq_m = models.DecimalField(
        _('area (sqm)'),
        max_digits=7,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('10'))],
    )
    base_price = models.DecimalField(
        _('base price'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('1000'))],
    )
    base_currency = models.CharField(_('base currency'), max_length=3, default='USD')
    has_garage = models.BooleanField(_('has garage'), default=False)
    energy_rating = models.PositiveSmallIntegerField(
        _('energy rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
    )
    water_rating = models.PositiveSmallIntegerField(
        _('water rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
    )
    sustainability_score = models.PositiveSmallIntegerField(
        _('sustainability score'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=60,
    )
    hero_image_url = models.URLField(_('hero image url'), blank=True)
    specs = models.JSONField(_('specifications'), default=dict, blank=True)
    tags = models.JSONField(_('tags'), default=list, blank=True)
    is_published = models.BooleanField(_('is published'), default=False)
    published_at = models.DateTimeField(_('published at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('name',)
        indexes = [
            models.Index(fields=('style', 'bedrooms', 'bathrooms')),
            models.Index(fields=('area_sq_m',)),
            models.Index(fields=('base_price',)),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        if not self.is_published and self.published_at is not None:
            self.published_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def regional_estimates(self):
        """Return computed regional price estimates for the plan."""
        estimates = []
        for pricing in self.pricing.select_related('region').all():
            multiplier = Decimal(pricing.cost_multiplier or pricing.region.cost_multiplier)
            price = (Decimal(self.base_price) * multiplier).quantize(Decimal('0.01'))
            estimates.append(
                {
                    'region_slug': pricing.region.slug,
                    'region_name': pricing.region.name,
                    'currency': pricing.currency_code or pricing.region.currency_code,
                    'estimated_cost': price,
                    'multiplier': multiplier,
                }
            )
        return estimates


class PlanImage(models.Model):
    plan = models.ForeignKey(Plan, related_name='images', on_delete=models.CASCADE)
    image_url = models.URLField(_('image url'))
    caption = models.CharField(_('caption'), max_length=200, blank=True)
    is_primary = models.BooleanField(_('is primary'), default=False)
    order = models.PositiveSmallIntegerField(_('order'), default=0)

    class Meta:
        ordering = ('order', 'id')
        constraints = [
            models.UniqueConstraint(fields=('plan', 'order'), name='plan_image_unique_order'),
        ]

    def __str__(self):
        return f"{self.plan.name} image"


class PlanFeature(models.Model):
    plan = models.ForeignKey(Plan, related_name='features', on_delete=models.CASCADE)
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    category = models.CharField(_('category'), max_length=50, blank=True)
    is_sustainable = models.BooleanField(_('is sustainable feature'), default=False)
    price_delta = models.DecimalField(
        _('price delta'),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Additional cost when this option is selected'),
    )

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return f"{self.plan}: {self.name}"



class PlanOption(models.Model):
    plan = models.ForeignKey(Plan, related_name='options', on_delete=models.CASCADE)
    name = models.CharField(_('name'), max_length=120)
    description = models.TextField(_('description'), blank=True)
    price_delta = models.DecimalField(
        _('price delta'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Additional cost when this option is selected'),
    )

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return f"{self.plan}: {self.name}"

class PlanRegionalPricing(models.Model):
    plan = models.ForeignKey(Plan, related_name='pricing', on_delete=models.CASCADE)
    region = models.ForeignKey('locations.Region', related_name='plan_pricing', on_delete=models.CASCADE)
    cost_multiplier = models.DecimalField(
        _('cost multiplier'),
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.10'))],
        default=Decimal('1.00'),
        help_text=_('Multiplier applied on top of plan base price when estimating for this region'),
    )
    currency_code = models.CharField(_('currency code'), max_length=3, blank=True)

    class Meta:
        unique_together = ('plan', 'region')
        verbose_name = _('regional pricing')
        verbose_name_plural = _('regional pricing')

    def __str__(self):
        return f"{self.plan.name} - {self.region.name} ({self.cost_multiplier}x)"


class BuildRequestStatus(models.TextChoices):
    NEW = 'new', _('New')
    IN_REVIEW = 'in_review', _('In review')
    CONTACTED = 'contacted', _('Contacted')
    ARCHIVED = 'archived', _('Archived')


class BuildRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    plan = models.ForeignKey(Plan, related_name='build_requests', on_delete=models.PROTECT)
    region = models.ForeignKey('locations.Region', on_delete=models.PROTECT, related_name='build_requests')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='build_requests',
    )
    contact_name = models.CharField(_('contact name'), max_length=120)
    contact_email = models.EmailField(_('contact email'))
    contact_phone = models.CharField(_('contact phone'), max_length=50)
    budget_currency = models.CharField(_('budget currency'), max_length=3, default='USD')
    budget_min = models.DecimalField(_('budget minimum'), max_digits=12, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(_('budget maximum'), max_digits=12, decimal_places=2, null=True, blank=True)
    timeline = models.CharField(_('timeline'), max_length=120, blank=True)
    customizations = models.TextField(_('customizations'), blank=True)
    options = models.JSONField(_('selected options'), default=list, blank=True)
    intake_data = models.JSONField(_('intake data'), default=dict, blank=True)
    status = models.CharField(_('status'), max_length=20, choices=BuildRequestStatus.choices, default=BuildRequestStatus.NEW)
    submitted_at = models.DateTimeField(_('submitted at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('-submitted_at',)
        indexes = [
            models.Index(fields=('status',)),
            models.Index(fields=('submitted_at',)),
        ]

    def __str__(self):
        return f"Request for {self.plan} by {self.contact_name}"


class BuildRequestAttachment(models.Model):
    request = models.ForeignKey(BuildRequest, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='build_requests/', blank=True)
    storage_key = models.CharField(_('storage key'), max_length=255, blank=True)
    original_name = models.CharField(_('original name'), max_length=200)
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)

    class Meta:
        ordering = ('uploaded_at',)

    def __str__(self):
        return self.original_name




# Add the methods to the Plan model
def log_action(self, user, action, changes=None):
    from .audit import plan_log_action
    return plan_log_action(self, user, action, changes)

Plan.log_action = log_action


def publish(self, user=None):
    from .audit import plan_publish
    return plan_publish(self, user)

Plan.publish = publish


def unpublish(self, user=None):
    from .audit import plan_unpublish
    return plan_unpublish(self, user)

Plan.unpublish = unpublish
