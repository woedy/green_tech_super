"""
Management command to ensure all ADMIN users have is_staff=True
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Ensure all users with user_type=ADMIN have is_staff=True'

    def handle(self, *args, **options):
        admin_users = User.objects.filter(user_type='ADMIN', is_staff=False)
        count = admin_users.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No admin users need updating.'))
            return
        
        admin_users.update(is_staff=True)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {count} admin user(s) to have is_staff=True')
        )
