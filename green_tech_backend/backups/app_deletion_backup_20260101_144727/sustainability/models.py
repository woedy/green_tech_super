from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from properties.models import Property
from construction.ghana.models import EcoFeature


class SustainabilityScore(models.Model):
    """
    Model to store calculated sustainability scores for properties.
    Uses weighted scoring across four categories with regional adjustments.
    """
    class ScoreCategory(models.TextChoices):
        ENERGY = 'ENERGY', _('Energy Efficiency')  # 30% weight
        WATER = 'WATER', _('Water Efficiency')     # 25% weight
        MATERIALS = 'MATERIALS', _('Sustainable Materials')  # 25% weight
        WASTE = 'WASTE', _('Waste Management')     # 20% weight
        OVERALL = 'OVERALL', _('Overall Score')
    
    # Category weights for overall score calculation
    CATEGORY_WEIGHTS = {
        'ENERGY': 0.30,
        'WATER': 0.25,
        'MATERIALS': 0.25,
        'WASTE': 0.20
    }
    
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='sustainability_scores',
        verbose_name=_('property')
    )
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=ScoreCategory.choices
    )
    score = models.PositiveSmallIntegerField(
        _('score'),
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    max_possible = models.PositiveSmallIntegerField(
        _('maximum possible score'),
        default=100
    )
    details = models.JSONField(
        _('scoring details'),
        default=dict,
        help_text=_('Detailed breakdown of the score calculation')
    )
    last_updated = models.DateTimeField(_('last updated'), auto_now=True)
    
    class Meta:
        verbose_name = _('sustainability score')
        verbose_name_plural = _('sustainability scores')
        unique_together = ('property', 'category')
        ordering = ['property', 'category']
    
    def __str__(self):
        return f"{self.get_category_display()}: {self.score}/{self.max_possible}"
    
    @classmethod
    def calculate_overall_score(cls, category_scores):
        """
        Calculate the overall weighted score from category scores.
        
        Args:
            category_scores: Dict of {category: score} for all categories
            
        Returns:
            float: Weighted overall score (0-100)
        """
        total_weight = 0
        weighted_sum = 0
        
        for category, weight in cls.CATEGORY_WEIGHTS.items():
            if category in category_scores and category_scores[category] is not None:
                weighted_sum += category_scores[category] * weight
                total_weight += weight
        
        if total_weight == 0:
            return 0
            
        return min(100, weighted_sum / total_weight)
    
    @classmethod
    def get_certification_level(cls, overall_score):
        """
        Determine certification level based on overall score.
        
        Returns:
            str: Certification level (None, 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM')
        """
        if overall_score >= 90:
            return 'PLATINUM'
        elif overall_score >= 80:
            return 'GOLD'
        elif overall_score >= 65:
            return 'SILVER'
        elif overall_score >= 50:
            return 'BRONZE'
        return None


class CertificationStandard(models.Model):
    """Model for different sustainability certification standards."""
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    issuing_organization = models.CharField(_('issuing organization'), max_length=200)
    logo = models.ImageField(
        _('logo'),
        upload_to='certification_logos/',
        null=True,
        blank=True
    )
    website = models.URLField(_('website'), blank=True)
    is_active = models.BooleanField(_('is active'), default=True)
    
    # Scoring thresholds
    minimum_score = models.PositiveSmallIntegerField(
        _('minimum score required'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Minimum overall score required for certification (0-100)')
    )
    
    # Categories that must meet minimum requirements
    required_categories = models.JSONField(
        _('required categories'),
        default=list,
        help_text=_('List of categories that must meet minimum scores')
    )
    
    class Meta:
        verbose_name = _('certification standard')
        verbose_name_plural = _('certification standards')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class PropertyCertification(models.Model):
    """Model to track property certifications."""
    class CertificationStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Review')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')
        EXPIRED = 'EXPIRED', _('Expired')
    
    property_obj = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='certifications',
        verbose_name=_('property')
    )
    standard = models.ForeignKey(
        CertificationStandard,
        on_delete=models.PROTECT,
        related_name='certifications',
        verbose_name=_('certification standard')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=CertificationStatus.choices,
        default=CertificationStatus.PENDING
    )
    certificate_number = models.CharField(
        _('certificate number'),
        max_length=50,
        blank=True
    )
    issue_date = models.DateField(_('issue date'), null=True, blank=True)
    expiry_date = models.DateField(_('expiry date'), null=True, blank=True)
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_certifications',
        verbose_name=_('verified by')
    )
    verification_notes = models.TextField(_('verification notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('property certification')
        verbose_name_plural = _('property certifications')
        ordering = ['-issue_date', 'property_obj']
    
    def __str__(self):
        return f"{self.property_obj} - {self.standard}"
    
    @property
    def is_active(self):
        """Check if the certification is currently active."""
        if self.status != 'APPROVED':
            return False
        if not self.issue_date:
            return False
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return False
        return True


class SustainabilityFeatureImpact(models.Model):
    """Model to define how eco features impact sustainability scores."""
    eco_feature = models.OneToOneField(
        EcoFeature,
        on_delete=models.CASCADE,
        related_name='sustainability_impact',
        verbose_name=_('eco feature')
    )
    
    # Impact on different score categories (0-100)
    energy_impact = models.PositiveSmallIntegerField(
        _('energy impact'),
        default=0,
        validators=[MaxValueValidator(100)],
        help_text=_('Impact on energy efficiency score (0-100)')
    )
    water_impact = models.PositiveSmallIntegerField(
        _('water impact'),
        default=0,
        validators=[MaxValueValidator(100)],
        help_text=_('Impact on water efficiency score (0-100)')
    )
    materials_impact = models.PositiveSmallIntegerField(
        _('materials impact'),
        default=0,
        validators=[MaxValueValidator(100)],
        help_text=_('Impact on sustainable materials score (0-100)')
    )
    waste_impact = models.PositiveSmallIntegerField(
        _('waste impact'),
        default=0,
        validators=[MaxValueValidator(100)],
        help_text=_('Impact on waste management score (0-100)')
    )
    
    # Additional metadata
    co2_reduction = models.DecimalField(
        _('CO2 reduction (tons/year)'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Estimated annual CO2 reduction in metric tons')
    )
    water_savings = models.DecimalField(
        _('water savings (liters/year)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Estimated annual water savings in liters')
    )
    cost_savings = models.DecimalField(
        _('annual cost savings (GHS)'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Estimated annual cost savings in GHS')
    )
    
    class Meta:
        verbose_name = _('sustainability feature impact')
        verbose_name_plural = _('sustainability feature impacts')
    
    def __str__(self):
        return f"Impact of {self.eco_feature.name}"


class PropertyComparison(models.Model):
    """Model to store property comparisons for sustainability metrics."""
    name = models.CharField(_('comparison name'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    properties = models.ManyToManyField(
        Property,
        related_name='comparisons',
        verbose_name=_('properties')
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='property_comparisons',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('property comparison')
        verbose_name_plural = _('property comparisons')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class CostSavingsEstimate(models.Model):
    """Model to store cost savings estimates for eco features."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='cost_savings_estimates',
        verbose_name=_('property')
    )
    eco_feature = models.ForeignKey(
        EcoFeature,
        on_delete=models.CASCADE,
        related_name='cost_savings_estimates',
        verbose_name=_('eco feature')
    )
    
    # Cost and savings information
    installation_cost = models.DecimalField(
        _('installation cost (GHS)'),
        max_digits=12,
        decimal_places=2,
        help_text=_('Estimated installation cost in GHS')
    )
    annual_savings = models.DecimalField(
        _('annual savings (GHS)'),
        max_digits=10,
        decimal_places=2,
        help_text=_('Estimated annual savings in GHS')
    )
    payback_period = models.DecimalField(
        _('payback period (years)'),
        max_digits=5,
        decimal_places=1,
        help_text=_('Estimated payback period in years')
    )
    
    # Environmental impact
    annual_co2_reduction = models.DecimalField(
        _('annual CO2 reduction (tons)'),
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Estimated annual CO2 reduction in metric tons')
    )
    annual_water_savings = models.DecimalField(
        _('annual water savings (liters)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Estimated annual water savings in liters')
    )
    
    # Metadata
    is_installed = models.BooleanField(
        _('is installed'),
        default=False,
        help_text=_('Whether this feature is already installed on the property')
    )
    installation_date = models.DateField(
        _('installation date'),
        null=True,
        blank=True
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('cost savings estimate')
        verbose_name_plural = _('cost savings estimates')
        unique_together = ('property', 'eco_feature')
        ordering = ['property', 'payback_period']
    
    def __str__(self):
        return f"{self.eco_feature.name} - {self.property.title}"
    
    def save(self, *args, **kwargs):
        # Calculate payback period if not set
        if self.annual_savings and self.installation_cost and not self.payback_period:
            if self.annual_savings > 0:
                self.payback_period = round(float(self.installation_cost) / float(self.annual_savings), 1)
        super().save(*args, **kwargs)
