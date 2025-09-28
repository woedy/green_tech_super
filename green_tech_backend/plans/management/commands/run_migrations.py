from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Run migrations for the plans app'

    def handle(self, *args, **options):
        self.stdout.write('Running migrations for the plans app...')
        
        # Import the migrations module
        from django.core.management import call_command
        
        # Run makemigrations
        call_command('makemigrations', 'plans', interactive=False)
        
        # Run migrate
        call_command('migrate', 'plans', interactive=False)
        
        self.stdout.write(self.style.SUCCESS('Successfully ran migrations for the plans app'))
