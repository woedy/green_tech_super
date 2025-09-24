"""
Financial models for the Green Tech Africa platform.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from properties.models import Property
from construction.models import Project


class FinancingOption(models.Model):
    """Financing options available for properties and projects."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    interest_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Annual interest rate percentage"
    )
    min_loan_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0
    )
    max_loan_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Leave blank for no maximum"
    )
    min_loan_term = models.PositiveIntegerField(help_text="Minimum loan term in months")
    max_loan_term = models.PositiveIntegerField(help_text="Maximum loan term in months")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.interest_rate}%)"

    class Meta:
        ordering = ['name']


class GovernmentIncentive(models.Model):
    """Government incentives for eco-friendly properties."""
    INCENTIVE_TYPES = [
        ('tax_credit', 'Tax Credit'),
        ('grant', 'Grant'),
        ('rebate', 'Rebate'),
        ('loan', 'Low-Interest Loan'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    incentive_type = models.CharField(max_length=20, choices=INCENTIVE_TYPES)
    description = models.TextField()
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        help_text="Fixed amount or percentage (use decimal, e.g., 0.05 for 5%)"
    )
    is_percentage = models.BooleanField(
        default=False,
        help_text="Is the amount a percentage? If not, it's a fixed amount"
    )
    min_qualifying_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        null=True, 
        blank=True
    )
    max_qualifying_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        null=True, 
        blank=True
    )
    eligible_property_types = models.ManyToManyField(
        'properties.PropertyType', 
        blank=True
    )
    eligible_eco_features = models.ManyToManyField(
        'properties.EcoFeature', 
        blank=True,
        help_text="Eco features that qualify for this incentive"
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    application_url = models.URLField(blank=True)
    documentation_required = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class BankIntegration(models.Model):
    """Bank integration details for financing options."""
    name = models.CharField(max_length=100)
    api_base_url = models.URLField()
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class PaymentPlan(models.Model):
    """Payment plan for a property or project."""
    PAYMENT_FREQUENCIES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semi_annually', 'Semi-Annually'),
        ('annually', 'Annually'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    down_payment_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    interest_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Annual interest rate percentage"
    )
    term_months = models.PositiveIntegerField(help_text="Loan term in months")
    payment_frequency = models.CharField(
        max_length=20, 
        choices=PAYMENT_FREQUENCIES,
        default='monthly'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.term_months//12} years, {self.interest_rate}%)"


class ROICalculation(models.Model):
    """Return on Investment calculation for eco-features."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    initial_cost = models.DecimalField(max_digits=12, decimal_places=2)
    annual_savings = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        help_text="Estimated annual savings in utility costs"
    )
    lifespan_years = models.PositiveIntegerField(
        help_text="Expected lifespan of the feature in years"
    )
    maintenance_cost_per_year = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0,
        help_text="Annual maintenance cost"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_roi(self):
        """Calculate the ROI percentage."""
        if not self.initial_cost:
            return 0
        total_savings = (self.annual_savings - self.maintenance_cost_per_year) * self.lifespan_years
        return ((total_savings - self.initial_cost) / self.initial_cost) * 100
    
    def calculate_payback_period(self):
        """Calculate the payback period in years."""
        if not self.annual_savings or not self.initial_cost:
            return 0
        annual_net_savings = self.annual_savings - self.maintenance_cost_per_year
        if annual_net_savings <= 0:
            return float('inf')
        return float(self.initial_cost) / float(annual_net_savings)
    
    def __str__(self):
        return f"{self.name} (ROI: {self.calculate_roi():.1f}%)"
