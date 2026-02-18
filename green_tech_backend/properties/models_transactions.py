"""
Property transaction models for rent, lease, and buy requests from clients.
"""
from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class TransactionType(models.TextChoices):
    RENT = 'rent', _('Rent')
    LEASE = 'lease', _('Lease')
    BUY = 'buy', _('Buy')


class TransactionStatus(models.TextChoices):
    DRAFT = 'draft', _('Draft')
    SUBMITTED = 'submitted', _('Submitted')
    UNDER_REVIEW = 'under_review', _('Under Review')
    APPROVED = 'approved', _('Approved')
    REJECTED = 'rejected', _('Rejected')
    NEGOTIATING = 'negotiating', _('Negotiating')
    CONTRACT_PENDING = 'contract_pending', _('Contract Pending')
    CONTRACT_SIGNED = 'contract_signed', _('Contract Signed')
    PAYMENT_PENDING = 'payment_pending', _('Payment Pending')
    COMPLETED = 'completed', _('Completed')
    CANCELLED = 'cancelled', _('Cancelled')


class PropertyTransaction(models.Model):
    """
    Represents a client's request to rent, lease, or buy a property.
    """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    property_ref = models.ForeignKey(
        'properties.Property',
        related_name='transactions',
        on_delete=models.CASCADE,
        verbose_name=_('property')
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='property_transactions',
        on_delete=models.CASCADE,
        verbose_name=_('client')
    )
    transaction_type = models.CharField(
        _('transaction type'),
        max_length=10,
        choices=TransactionType.choices
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.DRAFT
    )
    
    # Contact information
    contact_name = models.CharField(_('contact name'), max_length=200)
    contact_email = models.EmailField(_('contact email'))
    contact_phone = models.CharField(_('contact phone'), max_length=50)
    
    # Transaction details
    proposed_price = models.DecimalField(
        _('proposed price'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text=_('Client\'s proposed price (for buy) or offer')
    )
    proposed_rent = models.DecimalField(
        _('proposed rent'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text=_('Client\'s proposed monthly rent (for rent/lease)')
    )
    lease_duration_months = models.PositiveIntegerField(
        _('lease duration (months)'),
        null=True,
        blank=True,
        help_text=_('Desired lease duration in months')
    )
    move_in_date = models.DateField(
        _('desired move-in date'),
        null=True,
        blank=True
    )
    
    # Additional information
    message = models.TextField(
        _('message'),
        blank=True,
        help_text=_('Additional message or requirements from the client')
    )
    budget = models.CharField(
        _('budget'),
        max_length=100,
        blank=True,
        help_text=_('Client\'s budget range')
    )
    financing_required = models.BooleanField(
        _('financing required'),
        default=False,
        help_text=_('Whether client needs financing assistance (for buy)')
    )
    
    # Admin/Agent notes
    admin_notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Internal notes from admin/agent')
    )
    rejection_reason = models.TextField(
        _('rejection reason'),
        blank=True
    )
    
    # Assigned agent
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assigned_transactions',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('assigned agent')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    submitted_at = models.DateTimeField(_('submitted at'), null=True, blank=True)
    reviewed_at = models.DateTimeField(_('reviewed at'), null=True, blank=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('client', 'status')),
            models.Index(fields=('property_ref', 'transaction_type')),
            models.Index(fields=('assigned_agent', 'status')),
        ]
        verbose_name = _('property transaction')
        verbose_name_plural = _('property transactions')

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.property_ref.title} by {self.contact_name}"

    @property
    def is_editable(self):
        """Check if the transaction can be edited by the client."""
        return self.status in [TransactionStatus.DRAFT, TransactionStatus.SUBMITTED]

    @property
    def can_be_cancelled(self):
        """Check if the transaction can be cancelled."""
        return self.status not in [
            TransactionStatus.COMPLETED,
            TransactionStatus.CANCELLED,
            TransactionStatus.REJECTED
        ]


class TransactionDocument(models.Model):
    """
    Documents related to a property transaction.
    """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    transaction = models.ForeignKey(
        PropertyTransaction,
        related_name='documents',
        on_delete=models.CASCADE,
        verbose_name=_('transaction')
    )
    title = models.CharField(_('title'), max_length=200)
    document_type = models.CharField(
        _('document type'),
        max_length=50,
        choices=[
            ('ID', _('Identification')),
            ('PROOF_OF_INCOME', _('Proof of Income')),
            ('BANK_STATEMENT', _('Bank Statement')),
            ('REFERENCE', _('Reference Letter')),
            ('CONTRACT', _('Contract')),
            ('AGREEMENT', _('Agreement')),
            ('OTHER', _('Other')),
        ],
        default='OTHER'
    )
    file_url = models.URLField(_('file URL'))
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='uploaded_transaction_documents',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('uploaded by')
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = _('transaction document')
        verbose_name_plural = _('transaction documents')

    def __str__(self):
        return f"{self.title} - {self.transaction}"


class TransactionNote(models.Model):
    """
    Notes/comments on a property transaction.
    """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    transaction = models.ForeignKey(
        PropertyTransaction,
        related_name='notes',
        on_delete=models.CASCADE,
        verbose_name=_('transaction')
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='transaction_notes',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('author')
    )
    content = models.TextField(_('content'))
    is_internal = models.BooleanField(
        _('is internal'),
        default=False,
        help_text=_('Internal notes visible only to staff')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = _('transaction note')
        verbose_name_plural = _('transaction notes')

    def __str__(self):
        return f"Note by {self.author} on {self.transaction}"