from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Load initial Ghana regions, eco-features, and pricing data'

    def handle(self, *args, **options):
        self.stdout.write('Loading Ghana regions...')
        call_command('loaddata', 'ghana_regions.json', app_label='construction')
        
        self.stdout.write('Loading eco-features...')
        call_command('loaddata', 'eco_features.json', app_label='construction')
        
        self.stdout.write('Loading Ghana pricing data...')
        call_command('loaddata', 'ghana_pricing.json', app_label='construction')
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded all Ghana data!'))
