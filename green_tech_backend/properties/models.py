from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class PropertyType(models.TextChoices):
    APARTMENT = 'apartment', _('Apartment')
    HOUSE = 'house', _('House')
    VILLA = 'villa', _('Villa')
    TOWNHOUSE = 'townhouse', _('Townhouse')
    COMMERCIAL = 'commercial', _('Commercial')


class ListingType(models.TextChoices):
    SALE = 'sale', _('For Sale')
    RENT = 'rent', _('For Rent')


class PropertyStatus(models.TextChoices):
    DRAFT = 'draft', _('Draft')
    PUBLISHED = 'published', _('Published')
    UNDER_OFFER = 'under_offer', _('Under Offer')
    SOLD = 'sold', _('Sold')
    RENTED = 'rented', _('Rented')


class Property(models.Model):
    slug = models.SlugField(_('slug'), max_length=120, unique=True)
    title = models.CharField(_('title'), max_length=200)
    summary = models.CharField(_('summary'), max_length=255, blank=True)
    description = models.TextField(_('description'), blank=True)
    property_type = models.CharField(_('property type'), max_length=32, choices=PropertyType.choices)
    listing_type = models.CharField(_('listing type'), max_length=10, choices=ListingType.choices)
    status = models.CharField(_('status'), max_length=20, choices=PropertyStatus.choices, default=PropertyStatus.PUBLISHED)
    price = models.DecimalField(_('price'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    currency = models.CharField(_('currency'), max_length=3, default='USD')
    bedrooms = models.PositiveSmallIntegerField(_('bedrooms'), default=0)
    bathrooms = models.PositiveSmallIntegerField(_('bathrooms'), default=0)
    area_sq_m = models.DecimalField(_('internal area (sqm)'), max_digits=8, decimal_places=2)
    plot_sq_m = models.DecimalField(_('plot size (sqm)'), max_digits=8, decimal_places=2, null=True, blank=True)
    year_built = models.PositiveIntegerField(_('year built'), null=True, blank=True)
    hero_image_url = models.URLField(_('hero image url'), blank=True)
    sustainability_score = models.PositiveSmallIntegerField(_('sustainability score'), default=60)
    energy_rating = models.PositiveSmallIntegerField(_('energy rating'), default=3)
    water_rating = models.PositiveSmallIntegerField(_('water rating'), default=3)
    amenities = models.JSONField(_('amenities'), default=list, blank=True)
    highlights = models.JSONField(_('highlights'), default=list, blank=True)
    city = models.CharField(_('city'), max_length=100)
    country = models.CharField(_('country'), max_length=100, default='Ghana')
    region = models.ForeignKey('locations.Region', related_name='properties', on_delete=models.PROTECT)
    address = models.CharField(_('address'), max_length=255, blank=True)
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    featured = models.BooleanField(_('featured'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    listed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='listed_properties',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('property_type', 'listing_type')),
            models.Index(fields=('region', 'featured')),
            models.Index(fields=('price',)),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def primary_image(self):
        image = self.images.filter(is_primary=True).first()
        return image.image_url if image else self.hero_image_url


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image_url = models.URLField(_('image url'))
    caption = models.CharField(_('caption'), max_length=200, blank=True)
    is_primary = models.BooleanField(_('is primary'), default=False)
    order = models.PositiveSmallIntegerField(_('order'), default=0)

    class Meta:
        ordering = ('order', 'id')

    def __str__(self):
        return f"{self.property.title} image"


class PropertyInquiryStatus(models.TextChoices):
    NEW = 'new', _('New')
    IN_PROGRESS = 'in_progress', _('In progress')
    CLOSED = 'closed', _('Closed')


class PropertyInquiry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    property = models.ForeignKey(Property, related_name='inquiries', on_delete=models.CASCADE)
    name = models.CharField(_('name'), max_length=120)
    email = models.EmailField(_('email'))
    phone = models.CharField(_('phone'), max_length=50, blank=True)
    message = models.TextField(_('message'), blank=True)
    status = models.CharField(_('status'), max_length=20, choices=PropertyInquiryStatus.choices, default=PropertyInquiryStatus.NEW)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f"Inquiry for {self.property} by {self.name}"


class ViewingStatus(models.TextChoices):
    PENDING = 'pending', _('Pending')
    CONFIRMED = 'confirmed', _('Confirmed')
    COMPLETED = 'completed', _('Completed')
    CANCELLED = 'cancelled', _('Cancelled')


class ViewingAppointment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    inquiry = models.ForeignKey(PropertyInquiry, related_name='appointments', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='appointments', on_delete=models.CASCADE)
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='viewing_appointments', on_delete=models.SET_NULL, null=True, blank=True)
    scheduled_for = models.DateTimeField(_('scheduled for'))
    notes = models.TextField(_('notes'), blank=True)
    status = models.CharField(_('status'), max_length=20, choices=ViewingStatus.choices, default=ViewingStatus.PENDING)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('scheduled_for',)
        indexes = [
            models.Index(fields=('agent', 'scheduled_for')),
        ]

    def __str__(self):
        return f"Viewing for {self.property} on {self.scheduled_for}"


class PropertyEcoFeature(models.Model):
    """Junction table linking properties to eco-features."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='property_eco_features',
        verbose_name=_('property')
    )
    eco_feature = models.ForeignKey(
        'construction.EcoFeature',
        on_delete=models.CASCADE,
        related_name='property_eco_features',
        verbose_name=_('eco feature')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        unique_together = ('property', 'eco_feature')
        verbose_name = _('property eco feature')
        verbose_name_plural = _('property eco features')

    def __str__(self):
        return f"{self.property.title} - {self.eco_feature.name}"
