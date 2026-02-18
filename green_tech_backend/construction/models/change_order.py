from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal

class ChangeOrderStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')
    VOIDED = 'VOIDED', _('Voided')

class ChangeOrderItemType(models.TextChoices):
    ADDITION = 'addition', _('Addition')
    REMOVAL = 'removal', _('Removal')
    MODIFICATION = 'modification', _('Modification')

class ChangeOrder(models.Model):
    project = models.ForeignKey(
        'construction.Project',
        on_delete=models.CASCADE,
        related_name='change_orders'
    )
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'))
    reason = models.TextField(_('reason for change'))
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=ChangeOrderStatus.choices,
        default=ChangeOrderStatus.PENDING
    )
    total_cost_impact = models.DecimalField(
        _('total cost impact'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    estimated_days_impact = models.IntegerField(
        _('estimated days impact'),
        default=0,
        help_text=_('Additional days added to the project timeline')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_change_orders'
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_change_orders'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('change order')
        verbose_name_plural = _('change orders')

    def __str__(self):
        return f"CO-{self.id}: {self.title} ({self.project.name})"

class ChangeOrderItem(models.Model):
    change_order = models.ForeignKey(
        ChangeOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    description = models.CharField(_('description'), max_length=255)
    item_type = models.CharField(
        _('type'),
        max_length=20,
        choices=ChangeOrderItemType.choices,
        default=ChangeOrderItemType.ADDITION
    )
    quantity = models.DecimalField(
        _('quantity'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00')
    )
    unit_cost = models.DecimalField(
        _('unit cost'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    labor_hours = models.DecimalField(
        _('labor hours'),
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        null=True,
        blank=True
    )
    material_cost = models.DecimalField(
        _('material cost'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.description} ({self.change_order.id})"
