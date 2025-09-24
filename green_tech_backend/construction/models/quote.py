"""
Quote and related models for construction project quotes.
"""
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import JSONField
from model_utils.models import TimeStampedModel
from django.conf import settings

# Using string reference to avoid circular import


class QuoteStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Draft')
    PENDING_APPROVAL = 'PENDING_APPROVAL', _('Pending Approval')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')
    EXPIRED = 'EXPIRED', _('Expired')
    ACCEPTED = 'ACCEPTED', _('Accepted')
    REVISED = 'REVISED', _('Revised')


class Quote(TimeStampedModel):
    """
    A quote for construction services, with versioning support.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote_number = models.CharField(_('quote number'), max_length=20, unique=True)
    construction_request = models.ForeignKey(
        'construction.ConstructionRequest',
        on_delete=models.PROTECT,
        related_name='quotes',
        verbose_name=_('construction request')
    )
    version = models.PositiveIntegerField(_('version'), default=1)
    parent_quote = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revisions',
        verbose_name=_('parent quote')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=QuoteStatus.choices,
        default=QuoteStatus.DRAFT
    )
    valid_until = models.DateField(_('valid until'), null=True, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    terms_and_conditions = models.TextField(_('terms and conditions'), blank=True)
    
    # Pricing information
    subtotal = models.DecimalField(
        _('subtotal'),
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    tax_amount = models.DecimalField(
        _('tax amount'),
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    discount_amount = models.DecimalField(
        _('discount amount'),
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    total_amount = models.DecimalField(
        _('total amount'),
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_quotes',
        verbose_name=_('created by')
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_quotes',
        verbose_name=_('approved by')
    )
    approved_at = models.DateTimeField(_('approved at'), null=True, blank=True)
    
    # Change tracking
    change_reason = models.TextField(_('change reason'), blank=True)
    
    class Meta:
        verbose_name = _('quote')
        verbose_name_plural = _('quotes')
        ordering = ('-created',)
        unique_together = ('construction_request', 'version')
    
    def __str__(self):
        return f"Quote {self.quote_number} (v{self.version}) - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Generate quote number if not set
        if not self.quote_number:
            self.quote_number = self._generate_quote_number()
        
        # Set valid_until to 30 days from now if not set
        if not self.valid_until:
            self.valid_until = timezone.now().date() + timezone.timedelta(days=30)
        
        # Calculate total amount
        self.total_amount = (self.subtotal + self.tax_amount) - self.discount_amount
        
        super().save(*args, **kwargs)
    
    def _generate_quote_number(self):
        """Generate a unique quote number in the format QT-YYYYMMDD-XXXX."""
        from django.db.models import Max
        
        today = timezone.now().strftime('%Y%m%d')
        max_id = Quote.objects.filter(quote_number__startswith=f'QT-{today}').aggregate(
            max_id=Max('quote_number')
        )['max_id']
        
        if max_id:
            # Extract the sequential number and increment
            try:
                last_num = int(max_id.split('-')[-1])
                next_num = last_num + 1
            except (IndexError, ValueError):
                next_num = 1
        else:
            next_num = 1
            
        return f'QT-{today}-{next_num:04d}'
    
    def create_revision(self, changed_by, change_reason=''):
        """Create a new revision of this quote."""
        if self.status == QuoteStatus.DRAFT:
            raise ValueError("Cannot create a revision of a draft quote.")
        
        # Get the latest version number
        latest_version = Quote.objects.filter(
            construction_request=self.construction_request
        ).aggregate(models.Max('version'))['version__max'] or 0
        
        # Create new quote with incremented version
        new_quote = Quote(
            construction_request=self.construction_request,
            parent_quote=self,
            version=latest_version + 1,
            status=QuoteStatus.REVISED,
            notes=self.notes,
            terms_and_conditions=self.terms_and_conditions,
            subtotal=self.subtotal,
            tax_amount=self.tax_amount,
            discount_amount=self.discount_amount,
            change_reason=change_reason,
            created_by=changed_by
        )
        new_quote.save()
        
        # Copy line items
        for item in self.items.all():
            QuoteItem.objects.create(
                quote=new_quote,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                tax_rate=item.tax_rate,
                discount_amount=item.discount_amount,
                total_amount=item.total_amount,
                metadata=item.metadata
            )
        
        return new_quote
    
    def approve(self, approved_by):
        """Approve this quote."""
        if self.status not in [QuoteStatus.PENDING_APPROVAL, QuoteStatus.REVISED]:
            raise ValueError("Only pending or revised quotes can be approved.")
        
        self.status = QuoteStatus.APPROVED
        self.approved_by = approved_by
        self.approved_at = timezone.now()
        self.save()
    
    def reject(self, rejection_reason=''):
        """Reject this quote."""
        if self.status != QuoteStatus.PENDING_APPROVAL:
            raise ValueError("Only pending quotes can be rejected.")
        
        self.status = QuoteStatus.REJECTED
        self.notes = f"{self.notes}\n\nRejection Reason: {rejection_reason}"
        self.save()
    
    def submit_for_approval(self):
        """Submit this quote for approval."""
        if self.status != QuoteStatus.DRAFT:
            raise ValueError("Only draft quotes can be submitted for approval.")
        
        self.status = QuoteStatus.PENDING_APPROVAL
        self.save()


class QuoteItem(TimeStampedModel):
    """Line item in a quote."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('quote')
    )
    description = models.TextField(_('description'))
    quantity = models.DecimalField(
        _('quantity'),
        max_digits=10,
        decimal_places=2,
        default=1,
        validators=[MinValueValidator(0.01)]
    )
    unit_price = models.DecimalField(
        _('unit price'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    tax_rate = models.DecimalField(
        _('tax rate (%)'),
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    discount_amount = models.DecimalField(
        _('discount amount'),
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    total_amount = models.DecimalField(
        _('total amount'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    metadata = JSONField(_('metadata'), default=dict, blank=True)
    
    class Meta:
        verbose_name = _('quote item')
        verbose_name_plural = _('quote items')
        ordering = ('created',)
    
    def __str__(self):
        return f"{self.quantity} x {self.description} - {self.total_amount}"
    
    def save(self, *args, **kwargs):
        # Calculate total amount
        subtotal = self.quantity * self.unit_price
        tax_amount = (subtotal * self.tax_rate) / 100
        self.total_amount = (subtotal + tax_amount) - self.discount_amount
        
        super().save(*args, **kwargs)
        
        # Update quote totals
        self._update_quote_totals()
    
    def delete(self, *args, **kwargs):
        quote = self.quote
        super().delete(*args, **kwargs)
        # Update quote totals after deletion
        self._update_quote_totals(quote)
    
    def _update_quote_totals(self, quote=None):
        """Update the parent quote's totals based on line items."""
        if quote is None:
            quote = self.quote
        
        items = quote.items.all()
        
        # Calculate subtotal (sum of all line item totals)
        subtotal = sum(item.quantity * item.unit_price for item in items)
        
        # Calculate total tax (sum of all line item taxes)
        tax_amount = sum((item.quantity * item.unit_price * item.tax_rate / 100) for item in items)
        
        # Calculate total discount (sum of all line item discounts)
        discount_amount = sum(item.discount_amount for item in items)
        
        # Update quote
        quote.subtotal = subtotal
        quote.tax_amount = tax_amount
        quote.discount_amount = discount_amount
        quote.save()


class QuoteChangeLog(TimeStampedModel):
    """Tracks changes to quotes for audit purposes."""
    ACTION_CREATE = 'CREATE'
    ACTION_UPDATE = 'UPDATE'
    ACTION_APPROVE = 'APPROVE'
    ACTION_REJECT = 'REJECT'
    ACTION_REVISE = 'REVISE'
    ACTION_SUBMIT = 'SUBMIT'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, _('Created')),
        (ACTION_UPDATE, _('Updated')),
        (ACTION_APPROVE, _('Approved')),
        (ACTION_REJECT, _('Rejected')),
        (ACTION_REVISE, _('Revised')),
        (ACTION_SUBMIT, _('Submitted for Approval')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='change_logs',
        verbose_name=_('quote')
    )
    action = models.CharField(
        _('action'),
        max_length=20,
        choices=ACTION_CHOICES
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        verbose_name=_('changed by')
    )
    changes = JSONField(_('changes'), default=dict)
    notes = models.TextField(_('notes'), blank=True)
    
    class Meta:
        verbose_name = _('quote change log')
        verbose_name_plural = _('quote change logs')
        ordering = ('-created',)
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.quote.quote_number} by {self.changed_by}"  
    
    @classmethod
    def log_action(cls, quote, action, changed_by, changes=None, notes=''):
        """Helper method to log a quote action."""
        return cls.objects.create(
            quote=quote,
            action=action,
            changed_by=changed_by,
            changes=changes or {},
            notes=notes
        )
