from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User


class PropertyType(models.TextChoices):
    """Types of properties available."""
    RESIDENTIAL = 'RESIDENTIAL', _('Residential')
    COMMERCIAL = 'COMMERCIAL', _('Commercial')
    LAND = 'LAND', _('Land')
    INDUSTRIAL = 'INDUSTRIAL', _('Industrial')
    MIXED_USE = 'MIXED_USE', _('Mixed Use')


class PropertyStatus(models.TextChoices):
    """Current status of the property."""
    DRAFT = 'DRAFT', _('Draft')
    PUBLISHED = 'PUBLISHED', _('Published')
    UNDER_OFFER = 'UNDER_OFFER', _('Under Offer')
    SOLD = 'SOLD', _('Sold')
    RENTED = 'RENTED', _('Rented')
    WITHDRAWN = 'WITHDRAWN', _('Withdrawn')


class SustainabilityRating(models.IntegerChoices):
    """Energy and water efficiency ratings."""
    A = 5, 'A (Most Efficient)'
    B = 4, 'B'
    C = 3, 'C'
    D = 2, 'D'
    E = 1, 'E (Least Efficient)'
    NOT_RATED = 0, 'Not Rated'


class Property(models.Model):
    """Main property model for listings with sustainability features."""
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    
    # Sustainability Fields
    energy_rating = models.PositiveSmallIntegerField(
        _('energy rating'),
        choices=SustainabilityRating.choices,
        default=SustainabilityRating.NOT_RATED,
        help_text=_('Energy efficiency rating (A-E)')
    )
    water_rating = models.PositiveSmallIntegerField(
        _('water rating'),
        choices=SustainabilityRating.choices,
        default=SustainabilityRating.NOT_RATED,
        help_text=_('Water efficiency rating (A-E)')
    )
    sustainability_score = models.PositiveSmallIntegerField(
        _('sustainability score'),
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Overall sustainability score (0-100)')
    )
    property_certifications = models.ManyToManyField(
        'sustainability.CertificationStandard',
        related_name='certified_properties',
        blank=True,
        verbose_name=_('property certifications')
    )
    
    property_type = models.CharField(
        _('property type'),
        max_length=20,
        choices=PropertyType.choices,
        default=PropertyType.RESIDENTIAL
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=PropertyStatus.choices,
        default=PropertyStatus.DRAFT
    )
    price = models.DecimalField(
        _('price'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='GHS'
    )
    area = models.DecimalField(
        _('area'),
        max_digits=10,
        decimal_places=2,
        help_text=_('Area in square meters'),
        validators=[MinValueValidator(0)]
    )
    bedrooms = models.PositiveIntegerField(_('bedrooms'), null=True, blank=True)
    bathrooms = models.PositiveIntegerField(_('bathrooms'), null=True, blank=True)
    year_built = models.PositiveIntegerField(_('year built'), null=True, blank=True)
    
    # Location
    address = models.TextField(_('address'))
    city = models.CharField(_('city'), max_length=100)
    region = models.CharField(_('region'), max_length=100)
    postal_code = models.CharField(_('postal code'), max_length=20, blank=True)
    latitude = models.DecimalField(
        _('latitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        _('longitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    
    # Sustainability Features
    energy_efficiency_rating = models.PositiveSmallIntegerField(
        _('energy efficiency rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    water_efficiency_rating = models.PositiveSmallIntegerField(
        _('water efficiency rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    
    # Ownership and Management
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_properties',
        verbose_name=_('owner'),
        help_text=_('The user who owns this property')
    )
    managers = models.ManyToManyField(
        User,
        related_name='managed_properties',
        verbose_name=_('managers'),
        help_text=_('Users who can manage this property'),
        blank=True
    )
    is_rental = models.BooleanField(
        _('is rental'),
        default=False,
        help_text=_('Whether this property is available for rent')
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='properties_created',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    published_at = models.DateTimeField(_('published at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('property')
        verbose_name_plural = _('properties')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
        
    def update_sustainability_score(self):
        """Calculate and update the sustainability score based on features and ratings."""
        from django.db.models import Avg
        
        # Start with base score from energy and water ratings (40% weight each)
        score = (self.energy_rating + self.water_rating) * 8  # Max 80 points
        
        # Add points for eco-friendly features (20% weight)
        eco_features = self.features.filter(is_eco_friendly=True).count()
        score += min(eco_features * 2, 20)  # Max 20 points
        
        # Ensure score is within 0-100 range
        self.sustainability_score = max(0, min(100, score))
        self.save(update_fields=['sustainability_score'])
        return self.sustainability_score


class PropertyImage(models.Model):
    """Images associated with a property."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('property')
    )
    image = models.ImageField(
        _('image'),
        upload_to='properties/images/'
    )
    caption = models.CharField(_('caption'), max_length=255, blank=True)
    is_primary = models.BooleanField(_('is primary'), default=False)
    order = models.PositiveIntegerField(_('order'), default=0)
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = _('property image')
        verbose_name_plural = _('property images')
    
    def __str__(self):
        return f"Image for {self.property.title}"


class PropertyFeature(models.Model):
    """Features and amenities of a property."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='features',
        verbose_name=_('property')
    )
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    is_eco_friendly = models.BooleanField(_('is eco friendly'), default=False)
    
    class Meta:
        verbose_name = _('property feature')
        verbose_name_plural = _('property features')
    
    def __str__(self):
        return f"{self.name} - {self.property.title}"
