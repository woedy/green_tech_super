"""
Rental application and tenant screening models.
"""
import os
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from builtins import property as builtin_property

from accounts.models import User
from properties.models import Property


def get_upload_path(instance, filename):
    """Generate upload path for document files."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('rental_applications', str(instance.id), filename)


class RentalApplicationStatus(models.TextChoices):
    """Status of rental applications."""
    DRAFT = 'DRAFT', _('Draft')
    SUBMITTED = 'SUBMITTED', _('Submitted')
    UNDER_REVIEW = 'UNDER_REVIEW', _('Under Review')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')
    WITHDRAWN = 'WITHDRAWN', _('Withdrawn')


class IncomeType(models.TextChoices):
    """Types of income sources for applicants."""
    SALARY = 'SALARY', _('Salary')
    BUSINESS = 'BUSINESS', _('Business')
    SELF_EMPLOYED = 'SELF_EMPLOYED', _('Self-Employed')
    PENSION = 'PENSION', _('Pension')
    INVESTMENT = 'INVESTMENT', _('Investment')
    OTHER = 'OTHER', _('Other')


class ApplicationDocumentType(models.TextChoices):
    """Types of documents that can be uploaded with an application."""
    ID_PROOF = 'ID_PROOF', _('Government ID')
    PROOF_OF_INCOME = 'PROOF_OF_INCOME', _('Proof of Income')
    EMPLOYMENT_VERIFICATION = 'EMPLOYMENT_VERIFICATION', _('Employment Verification')
    BANK_STATEMENT = 'BANK_STATEMENT', _('Bank Statement')
    TAX_RETURN = 'TAX_RETURN', _('Tax Return')
    REFERENCE_LETTER = 'REFERENCE_LETTER', _('Reference Letter')
    RENTAL_HISTORY = 'RENTAL_HISTORY', _('Rental History')
    OTHER = 'OTHER', _('Other')


class RentalApplication(models.Model):
    """
    A rental application submitted by a prospective tenant.
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='rental_applications',
        verbose_name=_('property')
    )
    applicant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rental_applications',
        verbose_name=_('applicant')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=RentalApplicationStatus.choices,
        default=RentalApplicationStatus.DRAFT
    )
    move_in_date = models.DateField(_('desired move-in date'), null=True, blank=True)
    lease_term_months = models.PositiveIntegerField(
        _('lease term (months)'),
        validators=[MinValueValidator(1)],
        null=True,
        blank=True
    )
    monthly_income = models.DecimalField(
        _('monthly income'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Total monthly income from all sources')
    )
    income_type = models.CharField(
        _('primary income source'),
        max_length=20,
        choices=IncomeType.choices,
        null=True,
        blank=True
    )
    employer_name = models.CharField(_('employer name'), max_length=100, blank=True)
    employer_phone = models.CharField(_('employer phone'), max_length=20, blank=True)
    employer_years = models.DecimalField(
        _('years at current job'),
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True
    )
    has_pets = models.BooleanField(_('has pets'), default=False)
    pet_description = models.TextField(_('pet description'), blank=True)
    has_vehicle = models.BooleanField(_('has vehicle'), default=False)
    vehicle_description = models.TextField(_('vehicle description'), blank=True)
    emergency_contact_name = models.CharField(_('emergency contact name'), max_length=100, blank=True)
    emergency_contact_phone = models.CharField(_('emergency contact phone'), max_length=20, blank=True)
    emergency_contact_relation = models.CharField(_('relationship'), max_length=50, blank=True)
    previous_address = models.TextField(_('previous address'), blank=True)
    previous_landlord_name = models.CharField(_('previous landlord name'), max_length=100, blank=True)
    previous_landlord_phone = models.CharField(_('previous landlord phone'), max_length=20, blank=True)
    reason_for_moving = models.TextField(_('reason for moving'), blank=True)
    additional_notes = models.TextField(_('additional notes'), blank=True)
    
    # Application metadata
    application_date = models.DateTimeField(_('application date'), default=timezone.now)
    submitted_at = models.DateTimeField(_('submitted at'), null=True, blank=True)
    reviewed_at = models.DateTimeField(_('reviewed at'), null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications',
        verbose_name=_('reviewed by')
    )
    review_notes = models.TextField(_('review notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('rental application')
        verbose_name_plural = _('rental applications')
        ordering = ['-submitted_at', '-created_at']
        permissions = [
            ('review_rental_application', 'Can review rental applications'),
            ('approve_rental_application', 'Can approve/reject rental applications'),
        ]

    def __str__(self):
        return f"Application for {self.property.title} by {self.applicant.get_full_name() or self.applicant.email}"
    
    def clean(self):
        super().clean()
        if self.status == RentalApplicationStatus.SUBMITTED and not self.submitted_at:
            self.submitted_at = timezone.now()
        
        if self.status in [RentalApplicationStatus.APPROVED, RentalApplicationStatus.REJECTED] and not self.reviewed_at:
            self.reviewed_at = timezone.now()
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @builtin_property
    def is_approved(self):
        return self.status == RentalApplicationStatus.APPROVED
    
    @builtin_property
    def is_rejected(self):
        return self.status == RentalApplicationStatus.REJECTED
    
    @builtin_property
    def is_pending_review(self):
        return self.status in [
            RentalApplicationStatus.SUBMITTED,
            RentalApplicationStatus.UNDER_REVIEW
        ]
    
    def approve(self, user, notes=''):
        """Approve this application."""
        self.status = RentalApplicationStatus.APPROVED
        self.reviewed_by = user
        self.review_notes = notes
        self.reviewed_at = timezone.now()
        self.save()
        # TODO: Send approval notification
    
    def reject(self, user, notes=''):
        """Reject this application."""
        self.status = RentalApplicationStatus.REJECTED
        self.reviewed_by = user
        self.review_notes = notes
        self.reviewed_at = timezone.now()
        self.save()
        # TODO: Send rejection notification


class ApplicationDocument(models.Model):
    """Document attached to a rental application."""
    application = models.ForeignKey(
        RentalApplication,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name=_('application')
    )
    document_type = models.CharField(
        _('document type'),
        max_length=30,
        choices=ApplicationDocumentType.choices,
        default=ApplicationDocumentType.OTHER
    )
    file = models.FileField(
        _('file'),
        upload_to=get_upload_path,
        max_length=255
    )
    original_filename = models.CharField(_('original filename'), max_length=255)
    file_size = models.PositiveIntegerField(_('file size'), help_text='Size in bytes')
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    notes = models.TextField(_('notes'), blank=True)

    class Meta:
        verbose_name = _('application document')
        verbose_name_plural = _('application documents')
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.original_filename}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.original_filename = self.file.name
            self.file_size = self.file.size
        super().save(*args, **kwargs)


class TenantScreening(models.Model):
    """Results of tenant screening/background check."""
    application = models.OneToOneField(
        RentalApplication,
        on_delete=models.CASCADE,
        related_name='screening',
        verbose_name=_('application')
    )
    credit_score = models.PositiveIntegerField(
        _('credit score'),
        null=True,
        blank=True,
        validators=[MinValueValidator(300), MaxValueValidator(850)]
    )
    credit_check_date = models.DateField(_('credit check date'), null=True, blank=True)
    criminal_background_check = models.BooleanField(
        _('criminal background check passed'),
        null=True,
        blank=True
    )
    eviction_history = models.BooleanField(
        _('has eviction history'),
        null=True,
        blank=True
    )
    eviction_details = models.TextField(_('eviction details'), blank=True)
    income_verification = models.BooleanField(
        _('income verified'),
        null=True,
        blank=True
    )
    employment_verification = models.BooleanField(
        _('employment verified'),
        null=True,
        blank=True
    )
    previous_landlord_comments = models.TextField(_('previous landlord comments'), blank=True)
    risk_score = models.PositiveIntegerField(
        _('risk score'),
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text=_('1 = Low risk, 10 = High risk')
    )
    screening_notes = models.TextField(_('screening notes'), blank=True)
    screened_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='screenings_performed',
        verbose_name=_('screened by')
    )
    screened_at = models.DateTimeField(_('screened at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('tenant screening')
        verbose_name_plural = _('tenant screenings')

    def __str__(self):
        return f"Screening for {self.application}"
    
    @builtin_property
    def is_complete(self):
        return all([
            self.credit_score is not None,
            self.criminal_background_check is not None,
            self.income_verification is not None,
            self.employment_verification is not None
        ])
    
    @builtin_property
    def is_approved(self):
        return all([
            self.credit_score and self.credit_score >= 600,  # Minimum credit score
            self.criminal_background_check is True,
            self.income_verification is True,
            self.employment_verification is True,
            self.eviction_history is not True
        ])
    
    def save(self, *args, **kwargs):
        if not self.screened_at and self.is_complete:
            self.screened_at = timezone.now()
        super().save(*args, **kwargs)
