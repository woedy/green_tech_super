from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable
from uuid import uuid4

from django.conf import settings
from django.db import models
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


TWOPLACES = Decimal('0.01')


def quantize(value: Decimal) -> Decimal:
    """Round values to two decimal places using bankers rounding."""

    return (value or Decimal('0')).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


class QuoteStatus(models.TextChoices):
    DRAFT = 'draft', _('Draft')
    SENT = 'sent', _('Sent')
    VIEWED = 'viewed', _('Viewed')
    ACCEPTED = 'accepted', _('Accepted')
    DECLINED = 'declined', _('Declined')


class QuoteLineItemKind(models.TextChoices):
    BASE = 'base', _('Base scope')
    OPTION = 'option', _('Optional upgrade')
    ALLOWANCE = 'allowance', _('Allowance')
    ADJUSTMENT = 'adjustment', _('Adjustment')


@dataclass(frozen=True)
class QuoteTimelineEntry:
    """Human readable milestone for quote progression."""

    status: str
    label: str
    timestamp: timezone.datetime | None


class QuoteType(models.TextChoices):
    BUILD_REQUEST = 'BUILD_REQUEST', _('Build Request Quote')
    CONSTRUCTION_PROJECT = 'CONSTRUCTION_PROJECT', _('Construction Project Quote')


class Quote(models.Model):
    """Unified quote model supporting both build requests and construction projects."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    reference = models.CharField(_('reference'), max_length=32, unique=True, editable=False)
    quote_type = models.CharField(
        _('quote type'),
        max_length=20,
        choices=QuoteType.choices,
        default=QuoteType.BUILD_REQUEST
    )
    
    # Polymorphic relationships
    build_request = models.ForeignKey(
        'plans.BuildRequest',
        related_name='quotes',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    construction_request = models.ForeignKey(
        'construction.ConstructionRequest',
        related_name='unified_quotes',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    
    region = models.ForeignKey(
        'locations.Region',
        related_name='quotes',
        on_delete=models.PROTECT,
    )
    status = models.CharField(_('status'), max_length=20, choices=QuoteStatus.choices, default=QuoteStatus.DRAFT)
    currency_code = models.CharField(_('currency'), max_length=3, default='USD')
    regional_multiplier = models.DecimalField(
        _('regional multiplier'),
        max_digits=6,
        decimal_places=2,
        default=Decimal('1.00'),
    )
    
    # Financial fields
    subtotal_amount = models.DecimalField(
        _('subtotal amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    tax_amount = models.DecimalField(
        _('tax amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    discount_amount = models.DecimalField(
        _('discount amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    allowance_amount = models.DecimalField(
        _('allowance amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    adjustment_amount = models.DecimalField(
        _('adjustment amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    total_amount = models.DecimalField(
        _('total amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    
    # Versioning support
    version = models.PositiveIntegerField(_('version'), default=1)
    parent_quote = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revisions',
        verbose_name=_('parent quote')
    )
    notes = models.TextField(_('internal notes'), blank=True)
    terms = models.TextField(_('terms and conditions'), blank=True)
    prepared_by_name = models.CharField(_('prepared by'), max_length=120, blank=True)
    prepared_by_email = models.EmailField(_('prepared by email'), blank=True)
    recipient_name = models.CharField(_('recipient name'), max_length=120, blank=True)
    recipient_email = models.EmailField(_('recipient email'), blank=True)
    valid_until = models.DateTimeField(_('valid until'), blank=True, null=True)
    sent_at = models.DateTimeField(_('sent at'), blank=True, null=True)
    viewed_at = models.DateTimeField(_('viewed at'), blank=True, null=True)
    accepted_at = models.DateTimeField(_('accepted at'), blank=True, null=True)
    declined_at = models.DateTimeField(_('declined at'), blank=True, null=True)
    signature_name = models.CharField(_('signature name'), max_length=120, blank=True)
    signature_email = models.EmailField(_('signature email'), blank=True)
    signature_at = models.DateTimeField(_('signature timestamp'), blank=True, null=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('status',)),
            models.Index(fields=('build_request', 'status')),
            models.Index(fields=('construction_request', 'status')),
            models.Index(fields=('quote_type', 'status')),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(quote_type='BUILD_REQUEST', build_request__isnull=False, construction_request__isnull=True) |
                    models.Q(quote_type='CONSTRUCTION_PROJECT', build_request__isnull=True, construction_request__isnull=False)
                ),
                name='quote_type_consistency'
            )
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Quote {self.reference}"

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = self._generate_reference()
        
        # Set region based on quote type
        if not self.region_id:
            if self.quote_type == QuoteType.BUILD_REQUEST and self.build_request_id:
                self.region = self.build_request.region
            elif self.quote_type == QuoteType.CONSTRUCTION_PROJECT and self.construction_request_id:
                # Get region from construction request if available
                if hasattr(self.construction_request, 'region') and self.construction_request.region:
                    from locations.models import Region
                    try:
                        self.region = Region.objects.get(name=self.construction_request.region)
                    except Region.DoesNotExist:
                        pass
        
        # Set recipient info based on quote type
        if self.quote_type == QuoteType.BUILD_REQUEST and self.build_request_id:
            if not self.recipient_email:
                self.recipient_email = self.build_request.contact_email
            if not self.recipient_name:
                self.recipient_name = self.build_request.contact_name
        elif self.quote_type == QuoteType.CONSTRUCTION_PROJECT and self.construction_request_id:
            if not self.recipient_email and hasattr(self.construction_request, 'client'):
                self.recipient_email = self.construction_request.client.email
            if not self.recipient_name and hasattr(self.construction_request, 'client'):
                self.recipient_name = f"{self.construction_request.client.first_name} {self.construction_request.client.last_name}".strip()
        
        # Set currency and multiplier from region
        if self.region_id:
            if not self.currency_code:
                self.currency_code = getattr(self.region, 'currency_code', 'USD')
            if not self.regional_multiplier or self.regional_multiplier == Decimal('1.00'):
                self.regional_multiplier = getattr(self.region, 'cost_multiplier', Decimal('1.00'))
        
        if not self.valid_until:
            self.valid_until = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)

    def recalculate_totals(self, items: Iterable['QuoteLineItem'] | None = None, commit: bool = True) -> Decimal:
        """Aggregate totals from items and persist them on the quote."""

        items = list(items) if items is not None else list(self.items.all())
        subtotal = Decimal('0.00')
        allowances = Decimal('0.00')
        adjustments = Decimal('0.00')
        tax_total = Decimal('0.00')
        discount_total = Decimal('0.00')

        for item in items:
            total = item.compute_total(self.regional_multiplier)
            if item.calculated_total != total:
                item.calculated_total = total
                item.save(update_fields=('calculated_total',))
            
            if item.kind == QuoteLineItemKind.ALLOWANCE:
                allowances += total
            elif item.kind == QuoteLineItemKind.ADJUSTMENT:
                adjustments += total
            else:
                subtotal += total
            
            # Add tax and discount from metadata if present
            if 'tax_amount' in item.metadata:
                tax_total += Decimal(str(item.metadata['tax_amount']))
            if 'discount_amount' in item.metadata:
                discount_total += Decimal(str(item.metadata['discount_amount']))

        self.subtotal_amount = quantize(subtotal)
        self.allowance_amount = quantize(allowances)
        self.adjustment_amount = quantize(adjustments)
        self.tax_amount = quantize(tax_total)
        self.discount_amount = quantize(discount_total)
        self.total_amount = quantize(subtotal + allowances + adjustments + tax_total - discount_total)
        
        if commit:
            self.save(update_fields=(
                'subtotal_amount',
                'allowance_amount',
                'adjustment_amount',
                'tax_amount',
                'discount_amount',
                'total_amount',
                'updated_at',
            ))
        return self.total_amount

    def mark_sent(self):
        """Transition quote to the *sent* state and timestamp it."""

        now = timezone.now()
        self.status = QuoteStatus.SENT
        self.sent_at = now
        self.updated_at = now
        self.save(update_fields=('status', 'sent_at', 'updated_at'))

    def mark_viewed(self):
        """Record customer view; transition to viewed when applicable."""

        now = timezone.now()
        self.viewed_at = now
        if self.status == QuoteStatus.SENT:
            self.status = QuoteStatus.VIEWED
            self.save(update_fields=('status', 'viewed_at', 'updated_at'))
        else:
            self.save(update_fields=('viewed_at', 'updated_at'))

    def mark_accepted(self, signature_name: str, signature_email: str | None = None):
        """Mark the quote as accepted with signature metadata."""

        now = timezone.now()
        self.status = QuoteStatus.ACCEPTED
        self.accepted_at = now
        self.signature_name = signature_name
        if signature_email:
            self.signature_email = signature_email
        self.signature_at = now
        self.updated_at = now
        self.save(
            update_fields=(
                'status',
                'accepted_at',
                'signature_name',
                'signature_email',
                'signature_at',
                'updated_at',
            )
        )

    def mark_declined(self):
        now = timezone.now()
        self.status = QuoteStatus.DECLINED
        self.declined_at = now
        self.updated_at = now
        self.save(update_fields=('status', 'declined_at', 'updated_at'))

    def timeline(self) -> list[QuoteTimelineEntry]:
        """Return chronological milestones for the customer dashboard."""

        return [
            QuoteTimelineEntry(QuoteStatus.DRAFT, 'Quote prepared', self.created_at),
            QuoteTimelineEntry(QuoteStatus.SENT, 'Quote sent to customer', self.sent_at),
            QuoteTimelineEntry(QuoteStatus.VIEWED, 'Customer viewed quote', self.viewed_at),
            QuoteTimelineEntry(QuoteStatus.ACCEPTED, 'Customer accepted quote', self.accepted_at),
            QuoteTimelineEntry(QuoteStatus.DECLINED, 'Customer declined quote', self.declined_at),
        ]

    def render_document(self) -> str:
        """Render the HTML representation used by the frontends."""

        context = {
            'quote': self,
            'items': self.items.all(),
            'build_request': self.build_request if self.quote_type == QuoteType.BUILD_REQUEST else None,
            'construction_request': self.construction_request if self.quote_type == QuoteType.CONSTRUCTION_PROJECT else None,
            'plan': self.build_request.plan if self.quote_type == QuoteType.BUILD_REQUEST and self.build_request else None,
            'region': self.region,
            'totals': {
                'subtotal': self.subtotal_amount,
                'allowances': self.allowance_amount,
                'adjustments': self.adjustment_amount,
                'tax': self.tax_amount,
                'discount': self.discount_amount,
                'total': self.total_amount,
            },
            'timeline': [entry for entry in self.timeline() if entry.timestamp],
        }
        return render_to_string('quotes/quote_document.html', context)

    def _generate_reference(self) -> str:
        today = timezone.now().strftime('%Y%m%d')
        prefix = 'CQ' if self.quote_type == QuoteType.CONSTRUCTION_PROJECT else 'Q'
        existing = Quote.objects.filter(reference__startswith=f'{prefix}{today}').count() + 1
        return f"{prefix}{today}-{existing:03d}"

    @property
    def status_display(self) -> str:
        return self.get_status_display()
    
    @property
    def related_request(self):
        """Get the related request (build request or construction request)."""
        if self.quote_type == QuoteType.BUILD_REQUEST:
            return self.build_request
        elif self.quote_type == QuoteType.CONSTRUCTION_PROJECT:
            return self.construction_request
        return None
    
    def create_revision(self, changed_by, change_reason=''):
        """Create a new revision of this quote."""
        if self.status == QuoteStatus.DRAFT:
            raise ValueError("Cannot create a revision of a draft quote.")
        
        # Get the latest version number for this request
        if self.quote_type == QuoteType.BUILD_REQUEST:
            latest_version = Quote.objects.filter(
                build_request=self.build_request
            ).aggregate(models.Max('version'))['version__max'] or 0
        else:
            latest_version = Quote.objects.filter(
                construction_request=self.construction_request
            ).aggregate(models.Max('version'))['version__max'] or 0
        
        # Create new quote with incremented version
        new_quote = Quote(
            quote_type=self.quote_type,
            build_request=self.build_request,
            construction_request=self.construction_request,
            region=self.region,
            parent_quote=self,
            version=latest_version + 1,
            status=QuoteStatus.DRAFT,
            currency_code=self.currency_code,
            regional_multiplier=self.regional_multiplier,
            notes=self.notes,
            terms=self.terms,
            prepared_by_name=self.prepared_by_name,
            prepared_by_email=self.prepared_by_email,
            recipient_name=self.recipient_name,
            recipient_email=self.recipient_email,
        )
        new_quote.save()
        
        # Copy line items
        for item in self.items.all():
            QuoteLineItem.objects.create(
                quote=new_quote,
                kind=item.kind,
                label=item.label,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                apply_region_multiplier=item.apply_region_multiplier,
                position=item.position,
                metadata=item.metadata.copy() if item.metadata else {}
            )
        
        # Recalculate totals for new quote
        new_quote.recalculate_totals()
        
        return new_quote


class QuoteLineItem(models.Model):
    """Individual line items for a quote."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    quote = models.ForeignKey(Quote, related_name='items', on_delete=models.CASCADE)
    kind = models.CharField(_('kind'), max_length=20, choices=QuoteLineItemKind.choices, default=QuoteLineItemKind.BASE)
    label = models.CharField(_('label'), max_length=255)
    quantity = models.DecimalField(_('quantity'), max_digits=8, decimal_places=2, default=Decimal('1.00'))
    unit_cost = models.DecimalField(_('unit cost'), max_digits=12, decimal_places=2)
    apply_region_multiplier = models.BooleanField(_('apply regional multiplier'), default=True)
    calculated_total = models.DecimalField(_('calculated total'), max_digits=12, decimal_places=2, default=Decimal('0.00'))
    position = models.PositiveIntegerField(_('position'), default=0)
    metadata = models.JSONField(_('metadata'), default=dict, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('position', 'created_at')

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.label} ({self.quote.reference})"

    def compute_total(self, multiplier: Decimal) -> Decimal:
        quantity = Decimal(self.quantity)
        unit_cost = Decimal(self.unit_cost)
        total = quantity * unit_cost
        if self.apply_region_multiplier:
            total *= Decimal(multiplier)
        return quantize(total)


class QuoteMessageAttachment(models.Model):
    """File attachments shared within a quote chat thread."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    file = models.FileField(_('file'), upload_to='quotes/chat/%Y/%m/%d')
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='quote_chat_attachments',
        verbose_name=_('uploaded by'),
    )

    class Meta:
        verbose_name = _('quote message attachment')
        verbose_name_plural = _('quote message attachments')

    def __str__(self):  # pragma: no cover - helper representation
        return f"QuoteAttachment {self.id}"


class QuoteChatMessage(models.Model):
    """Chat message associated with a sales quote."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    quote = models.ForeignKey(
        'Quote',
        related_name='chat_messages',
        on_delete=models.CASCADE,
        verbose_name=_('quote'),
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_quote_messages',
        verbose_name=_('sender'),
    )
    body = models.TextField(_('message body'))
    attachments = models.ManyToManyField(
        QuoteMessageAttachment,
        related_name='messages',
        blank=True,
        verbose_name=_('attachments'),
    )
    metadata = models.JSONField(_('metadata'), default=dict, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    edited_at = models.DateTimeField(_('edited at'), null=True, blank=True)

    class Meta:
        ordering = ('created_at',)
        verbose_name = _('quote chat message')
        verbose_name_plural = _('quote chat messages')

    def __str__(self):  # pragma: no cover - helper representation
        return f"QuoteMessage {self.id}"


class QuoteMessageReceipt(models.Model):
    """Tracks read receipts for quote chat messages."""

    message = models.ForeignKey(
        QuoteChatMessage,
        related_name='receipts',
        on_delete=models.CASCADE,
        verbose_name=_('message'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quote_message_receipts',
        verbose_name=_('user'),
    )
    read_at = models.DateTimeField(_('read at'), default=timezone.now)

    class Meta:
        unique_together = ('message', 'user')
        ordering = ('-read_at',)
        verbose_name = _('quote message receipt')
        verbose_name_plural = _('quote message receipts')

    def __str__(self):  # pragma: no cover - helper representation
        return f"QuoteReceipt {self.message_id}->{self.user_id}"
