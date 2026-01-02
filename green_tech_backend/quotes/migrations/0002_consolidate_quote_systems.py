# Generated migration for quote system consolidation

from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal
import uuid


def migrate_construction_quotes_to_unified(apps, schema_editor):
    """
    Migrate construction app quotes to the unified quote system.
    """
    # Get models
    ConstructionQuote = apps.get_model('construction', 'Quote')
    ConstructionQuoteItem = apps.get_model('construction', 'QuoteItem')
    UnifiedQuote = apps.get_model('quotes', 'Quote')
    UnifiedQuoteLineItem = apps.get_model('quotes', 'QuoteLineItem')
    
    # Migrate construction quotes
    for construction_quote in ConstructionQuote.objects.all():
        # Create unified quote
        unified_quote = UnifiedQuote.objects.create(
            id=construction_quote.id,
            reference=construction_quote.quote_number,
            quote_type='CONSTRUCTION_PROJECT',
            construction_request=construction_quote.construction_request,
            region=construction_quote.construction_request.region if hasattr(construction_quote.construction_request, 'region') else None,
            status=map_construction_status_to_unified(construction_quote.status),
            currency_code='GHS',  # Default for construction quotes
            regional_multiplier=Decimal('1.00'),
            subtotal_amount=construction_quote.subtotal,
            tax_amount=construction_quote.tax_amount,
            discount_amount=construction_quote.discount_amount,
            total_amount=construction_quote.total_amount,
            notes=construction_quote.notes,
            terms=construction_quote.terms_and_conditions,
            version=construction_quote.version,
            parent_quote=None,  # Will be set in second pass
            valid_until=construction_quote.valid_until,
            created_at=construction_quote.created,
            updated_at=construction_quote.modified,
        )
        
        # Migrate quote items
        for construction_item in construction_quote.items.all():
            UnifiedQuoteLineItem.objects.create(
                id=construction_item.id,
                quote=unified_quote,
                kind='BASE',  # Default kind for construction items
                label=construction_item.description,
                quantity=construction_item.quantity,
                unit_cost=construction_item.unit_price,
                apply_region_multiplier=True,
                calculated_total=construction_item.total_amount,
                position=0,  # Will be updated if needed
                metadata={
                    'tax_rate': float(construction_item.tax_rate),
                    'discount_amount': float(construction_item.discount_amount),
                    'migrated_from': 'construction_quote_item'
                },
                created_at=construction_item.created,
                updated_at=construction_item.modified,
            )
    
    # Second pass: Set parent quote relationships
    for construction_quote in ConstructionQuote.objects.all():
        if construction_quote.parent_quote:
            try:
                unified_quote = UnifiedQuote.objects.get(id=construction_quote.id)
                parent_unified = UnifiedQuote.objects.get(id=construction_quote.parent_quote.id)
                unified_quote.parent_quote = parent_unified
                unified_quote.save()
            except UnifiedQuote.DoesNotExist:
                pass  # Skip if parent doesn't exist


def map_construction_status_to_unified(construction_status):
    """Map construction quote status to unified quote status."""
    status_mapping = {
        'DRAFT': 'draft',
        'PENDING_APPROVAL': 'sent',
        'APPROVED': 'accepted',
        'REJECTED': 'declined',
        'EXPIRED': 'declined',
        'ACCEPTED': 'accepted',
        'REVISED': 'sent',
    }
    return status_mapping.get(construction_status, 'draft')


def reverse_migrate_construction_quotes(apps, schema_editor):
    """
    Reverse migration - restore construction quotes from unified system.
    """
    # Get models
    UnifiedQuote = apps.get_model('quotes', 'Quote')
    ConstructionQuote = apps.get_model('construction', 'Quote')
    
    # Only restore construction project quotes
    construction_quotes = UnifiedQuote.objects.filter(quote_type='CONSTRUCTION_PROJECT')
    
    for unified_quote in construction_quotes:
        # Restore construction quote
        ConstructionQuote.objects.create(
            id=unified_quote.id,
            quote_number=unified_quote.reference,
            construction_request=unified_quote.construction_request,
            version=unified_quote.version,
            parent_quote=None,  # Will be set in second pass
            status=reverse_map_unified_to_construction_status(unified_quote.status),
            valid_until=unified_quote.valid_until,
            notes=unified_quote.notes,
            terms_and_conditions=unified_quote.terms,
            subtotal=unified_quote.subtotal_amount,
            tax_amount=unified_quote.tax_amount,
            discount_amount=unified_quote.discount_amount,
            total_amount=unified_quote.total_amount,
            created_by_id=1,  # Default user - adjust as needed
            created=unified_quote.created_at,
            modified=unified_quote.updated_at,
        )


def reverse_map_unified_to_construction_status(unified_status):
    """Map unified quote status back to construction quote status."""
    status_mapping = {
        'draft': 'DRAFT',
        'sent': 'PENDING_APPROVAL',
        'viewed': 'PENDING_APPROVAL',
        'accepted': 'APPROVED',
        'declined': 'REJECTED',
    }
    return status_mapping.get(unified_status, 'DRAFT')


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0001_initial'),
        ('construction', '0001_initial'),  # Adjust based on actual migration
        ('plans', '0001_initial'),  # For BuildRequest relationship
        ('locations', '0001_initial'),  # For Region relationship
    ]

    operations = [
        # Add new fields to existing Quote model for consolidation
        migrations.AddField(
            model_name='quote',
            name='quote_type',
            field=models.CharField(
                choices=[('BUILD_REQUEST', 'Build Request Quote'), ('CONSTRUCTION_PROJECT', 'Construction Project Quote')],
                default='BUILD_REQUEST',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='quote',
            name='construction_request',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='unified_quotes',
                to='construction.constructionrequest'
            ),
        ),
        migrations.AddField(
            model_name='quote',
            name='tax_amount',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12),
        ),
        migrations.AddField(
            model_name='quote',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12),
        ),
        migrations.AddField(
            model_name='quote',
            name='version',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='quote',
            name='parent_quote',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='revisions',
                to='quotes.quote'
            ),
        ),
        
        # Add constraint to ensure quote type consistency
        migrations.AddConstraint(
            model_name='quote',
            constraint=models.CheckConstraint(
                check=models.Q(
                    models.Q(quote_type='BUILD_REQUEST', build_request__isnull=False, construction_request__isnull=True) |
                    models.Q(quote_type='CONSTRUCTION_PROJECT', build_request__isnull=True, construction_request__isnull=False)
                ),
                name='quote_type_consistency'
            ),
        ),
        
        # Migrate data from construction quotes to unified system
        migrations.RunPython(
            migrate_construction_quotes_to_unified,
            reverse_migrate_construction_quotes,
        ),
    ]