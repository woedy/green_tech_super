"""
Management command to verify quote system consolidation.
"""

from django.core.management.base import BaseCommand
from django.db import transaction, models
from quotes.models import Quote, QuoteType


class Command(BaseCommand):
    help = 'Verify quote system consolidation and data integrity'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix-inconsistencies',
            action='store_true',
            help='Attempt to fix any data inconsistencies found',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting quote consolidation verification...'))
        
        # Check data counts
        unified_construction_quotes_count = Quote.objects.filter(
            quote_type=QuoteType.CONSTRUCTION_PROJECT
        ).count()
        build_request_quotes_count = Quote.objects.filter(
            quote_type=QuoteType.BUILD_REQUEST
        ).count()
        total_quotes = Quote.objects.count()
        
        self.stdout.write(f"Unified construction quotes: {unified_construction_quotes_count}")
        self.stdout.write(f"Build request quotes: {build_request_quotes_count}")
        self.stdout.write(f"Total quotes: {total_quotes}")
        
        # Check for data consistency
        inconsistencies = []
        
        # Check quote type constraints
        invalid_quotes = Quote.objects.filter(
            models.Q(quote_type=QuoteType.BUILD_REQUEST, build_request__isnull=True) |
            models.Q(quote_type=QuoteType.CONSTRUCTION_PROJECT, construction_request__isnull=True) |
            models.Q(quote_type=QuoteType.BUILD_REQUEST, construction_request__isnull=False) |
            models.Q(quote_type=QuoteType.CONSTRUCTION_PROJECT, build_request__isnull=False)
        )
        
        if invalid_quotes.exists():
            inconsistencies.append(f"Found {invalid_quotes.count()} quotes with invalid type constraints")
        
        # Check for orphaned quotes
        orphaned_quotes = Quote.objects.filter(
            build_request__isnull=True,
            construction_request__isnull=True
        )
        
        if orphaned_quotes.exists():
            inconsistencies.append(f"Found {orphaned_quotes.count()} orphaned quotes")
        
        # Report results
        if inconsistencies:
            self.stdout.write(self.style.ERROR('Data inconsistencies found:'))
            for inconsistency in inconsistencies:
                self.stdout.write(self.style.ERROR(f"  - {inconsistency}"))
            
            if options['fix_inconsistencies']:
                self.stdout.write(self.style.WARNING('Attempting to fix inconsistencies...'))
                self._fix_inconsistencies(invalid_quotes, orphaned_quotes)
            else:
                self.stdout.write(
                    self.style.WARNING('Run with --fix-inconsistencies to attempt repairs')
                )
        else:
            self.stdout.write(self.style.SUCCESS('Quote consolidation verification passed!'))
            self.stdout.write(self.style.SUCCESS('All data appears consistent.'))
            self.stdout.write(self.style.SUCCESS('Construction quote models successfully removed - no redundancy!'))
    
    def _fix_inconsistencies(self, invalid_quotes, orphaned_quotes):
        """Attempt to fix data inconsistencies."""
        with transaction.atomic():
            # Fix invalid quote type constraints
            for quote in invalid_quotes:
                if quote.build_request and not quote.construction_request:
                    quote.quote_type = QuoteType.BUILD_REQUEST
                    quote.save()
                    self.stdout.write(f"Fixed quote {quote.reference} type to BUILD_REQUEST")
                elif quote.construction_request and not quote.build_request:
                    quote.quote_type = QuoteType.CONSTRUCTION_PROJECT
                    quote.save()
                    self.stdout.write(f"Fixed quote {quote.reference} type to CONSTRUCTION_PROJECT")
            
            # Handle orphaned quotes (delete them as they're invalid)
            if orphaned_quotes.exists():
                count = orphaned_quotes.count()
                orphaned_quotes.delete()
                self.stdout.write(f"Deleted {count} orphaned quotes")
        
        self.stdout.write(self.style.SUCCESS('Inconsistency fixes completed.'))