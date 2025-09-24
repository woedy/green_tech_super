"""
Rentals models package: exposes rental management models and rental application models
under a single import path `properties.rentals.models` to avoid circular imports.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from builtins import property as builtin_property

from accounts.models import User
from properties.models import Property


class LeaseType(models.TextChoices):
    """Types of lease agreements."""
    FIXED_TERM = 'FIXED_TERM', _('Fixed Term')
    MONTH_TO_MONTH = 'MONTH_TO_MONTH', _('Month to Month')
    SHORT_TERM = 'SHORT_TERM', _('Short Term')
    LONG_TERM = 'LONG_TERM', _('Long Term')


class PaymentFrequency(models.TextChoices):
    """Frequency of rental payments."""
    WEEKLY = 'WEEKLY', _('Weekly')
    BIWEEKLY = 'BIWEEKLY', _('Bi-weekly')
    MONTHLY = 'MONTHLY', _('Monthly')
    QUARTERLY = 'QUARTERLY', _('Quarterly')
    ANNUALLY = 'ANNUALLY', _('Annually')


class MaintenanceStatus(models.TextChoices):
    """Status of maintenance requests."""
    PENDING = 'PENDING', _('Pending')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')


class MaintenancePriority(models.TextChoices):
    """Priority levels for maintenance requests."""
    LOW = 'LOW', _('Low')
    MEDIUM = 'MEDIUM', _('Medium')
    HIGH = 'HIGH', _('High')
    EMERGENCY = 'EMERGENCY', _('Emergency')


class RentalProperty(models.Model):
    """Extension of Property model for rental-specific fields."""
    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE,
        related_name='rental_details',
        verbose_name=_('property')
    )
    is_available = models.BooleanField(_('is available'), default=True)
    available_from = models.DateField(_('available from'), null=True, blank=True)
    available_to = models.DateField(
        _('available to'),
        null=True,
        blank=True,
        help_text=_('Last date the property is available for rent')
    )
    minimum_lease_months = models.PositiveIntegerField(
        _('minimum lease months'),
        default=12,
        validators=[MinValueValidator(1)],
        help_text=_('Minimum lease duration in months')
    )
    maximum_lease_months = models.PositiveIntegerField(
        _('maximum lease months'),
        null=True,
        blank=True,
        help_text=_('Maximum lease duration in months (optional)')
    )
    security_deposit = models.DecimalField(
        _('security deposit'),
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Security deposit amount in the property currency')
    )
    pet_deposit = models.DecimalField(
        _('pet deposit'),
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Additional deposit required for pets (if allowed)')
    )
    pets_allowed = models.BooleanField(_('pets allowed'), default=False)
    pet_restrictions = models.TextField(
        _('pet restrictions'),
        blank=True,
        help_text=_('Any restrictions on pets (breeds, size, etc.)')
    )
    smoking_allowed = models.BooleanField(_('smoking allowed'), default=False)
    furnishing_type = models.CharField(
        _('furnishing type'),
        max_length=20,
        choices=[
            ('FULLY_FURNISHED', _('Fully Furnished')),
            ('SEMI_FURNISHED', _('Semi-Furnished')),
            ('UNFURNISHED', _('Unfurnished')),
        ],
        default='UNFURNISHED'
    )
    maintenance_contact = models.CharField(
        _('maintenance contact'),
        max_length=200,
        blank=True,
        help_text=_('Contact person for maintenance issues')
    )
    maintenance_phone = models.CharField(
        _('maintenance phone'),
        max_length=20,
        blank=True,
        help_text=_('Contact number for maintenance emergencies')
    )
    maintenance_email = models.EmailField(
        _('maintenance email'),
        blank=True,
        help_text=_('Email for maintenance requests')
    )
    special_terms = models.TextField(
        _('special terms'),
        blank=True,
        help_text=_('Any special terms or conditions for this rental property')
    )
    check_in_instructions = models.TextField(
        _('check-in instructions'),
        blank=True,
        help_text=_('Instructions for tenant check-in process')
    )
    check_out_instructions = models.TextField(
        _('check-out instructions'),
        blank=True,
        help_text=_('Instructions for tenant check-out process')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    last_renovated = models.DateField(
        _('last renovated'),
        null=True,
        blank=True,
        help_text=_('Date when the property was last renovated')
    )

    class Meta:
        verbose_name = _('rental property')
        verbose_name_plural = _('rental properties')
        ordering = ['-created_at']

    def __str__(self):
        return f"Rental: {self.property.title}"

    @builtin_property
    def current_lease(self):
        """Get the current active lease for this property, if any."""
        return self.property.lease_agreements.filter(
            is_active=True,
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).first()

    @builtin_property
    def next_available_date(self):
        """Get the next available date for this property."""
        if not self.is_available:
            current_lease = self.current_lease
            return current_lease.end_date + timedelta(days=1) if current_lease else None
        return self.available_from or timezone.now().date()

    def get_availability_display(self):
        """Get a human-readable string describing the property's availability."""
        if not self.is_available:
            return _('Currently rented')
        if self.available_from and self.available_from > timezone.now().date():
            return _('Available from {}').format(self.available_from.strftime('%B %d, %Y'))
        return _('Available now')


class LeaseAgreement(models.Model):
    """Lease agreement between landlord and tenant."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='lease_agreements',
        verbose_name=_('property')
    )
    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='leases',
        verbose_name=_('tenant')
    )
    lease_type = models.CharField(
        _('lease type'),
        max_length=20,
        choices=LeaseType.choices,
        default=LeaseType.FIXED_TERM
    )
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'), null=True, blank=True)
    monthly_rent = models.DecimalField(
        _('monthly rent'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    payment_frequency = models.CharField(
        _('payment frequency'),
        max_length=20,
        choices=PaymentFrequency.choices,
        default=PaymentFrequency.MONTHLY
    )
    security_deposit = models.DecimalField(
        _('security deposit'),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Security deposit amount')
    )
    is_active = models.BooleanField(_('is active'), default=True)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    signed_at = models.DateTimeField(_('signed at'), null=True, blank=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = _('lease agreement')
        verbose_name_plural = _('lease agreements')

    def __str__(self):
        return f"Lease for {self.property.title} - {self.tenant.get_full_name() or self.tenant.email}"

    @builtin_property
    def status(self):
        today = timezone.now().date()
        if not self.is_active:
            return 'TERMINATED'
        elif self.start_date > today:
            return 'UPCOMING'
        elif self.end_date and self.end_date < today:
            return 'EXPIRED'
        return 'ACTIVE'


class MaintenanceRequest(models.Model):
    """Maintenance requests for rental properties."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='maintenance_requests',
        verbose_name=_('property')
    )
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_maintenance_requests',
        verbose_name=_('submitted by')
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_maintenance_requests',
        verbose_name=_('assigned to')
    )
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'))
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.PENDING
    )
    priority = models.CharField(
        _('priority'),
        max_length=20,
        choices=MaintenancePriority.choices,
        default=MaintenancePriority.MEDIUM
    )
    requested_date = models.DateTimeField(_('requested date'), auto_now_add=True)
    scheduled_date = models.DateTimeField(_('scheduled date'), null=True, blank=True)
    completed_date = models.DateTimeField(_('completed date'), null=True, blank=True)
    cost = models.DecimalField(
        _('cost'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Estimated or actual cost of maintenance')
    )
    notes = models.TextField(_('notes'), blank=True)

    class Meta:
        ordering = ['-requested_date']
        verbose_name = _('maintenance request')
        verbose_name_plural = _('maintenance requests')

    def __str__(self):
        return f"{self.get_priority_display()} - {self.title} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        # Update completed_date when status changes to COMPLETED
        if self.status == MaintenanceStatus.COMPLETED and not self.completed_date:
            self.completed_date = timezone.now()
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Rental payments made by tenants."""
    lease = models.ForeignKey(
        LeaseAgreement,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('lease')
    )
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    payment_date = models.DateField(_('payment date'))
    payment_method = models.CharField(_('payment method'), max_length=50)
    reference_number = models.CharField(
        _('reference number'),
        max_length=100,
        blank=True
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_payments',
        verbose_name=_('received by')
    )

    class Meta:
        ordering = ['-payment_date']
        verbose_name = _('payment')
        verbose_name_plural = _('payments')

    def __str__(self):
        return f"{self.amount} paid on {self.payment_date} for {self.lease}"


# Import rental application-related models last to avoid circular imports
from .rental_application import (  # noqa: E402
    RentalApplication, ApplicationDocument, TenantScreening,
    RentalApplicationStatus, ApplicationDocumentType, IncomeType
)

__all__ = [
    # Rental management
    'RentalProperty', 'LeaseAgreement', 'MaintenanceRequest', 'Payment',
    'LeaseType', 'PaymentFrequency', 'MaintenanceStatus', 'MaintenancePriority',
    # Rental applications
    'RentalApplication', 'ApplicationDocument', 'TenantScreening',
    'RentalApplicationStatus', 'ApplicationDocumentType', 'IncomeType'
]
