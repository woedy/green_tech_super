from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo users for testing authentication'

    def handle(self, *args, **options):
        # Create admin user
        admin_email = 'admin@greentech.africa'
        if not User.objects.filter(email=admin_email).exists():
            admin = User.objects.create_user(
                email=admin_email,
                password='admin123',
                first_name='Admin',
                last_name='User',
                user_type=User.UserType.ADMIN,
                is_verified=True,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {admin_email} / admin123')
            )
        else:
            self.stdout.write(f'Admin user {admin_email} already exists')

        # Create agent user
        agent_email = 'agent@greentech.africa'
        if not User.objects.filter(email=agent_email).exists():
            agent = User.objects.create_user(
                email=agent_email,
                password='agent123',
                first_name='Demo',
                last_name='Agent',
                user_type=User.UserType.AGENT,
                is_verified=True,
                phone_number='+233 24 123 4567'
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created agent user: {agent_email} / agent123')
            )
        else:
            self.stdout.write(f'Agent user {agent_email} already exists')

        # Create builder user
        builder_email = 'builder@greentech.africa'
        if not User.objects.filter(email=builder_email).exists():
            builder = User.objects.create_user(
                email=builder_email,
                password='builder123',
                first_name='Demo',
                last_name='Builder',
                user_type=User.UserType.BUILDER,
                is_verified=True,
                phone_number='+233 24 987 6543'
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created builder user: {builder_email} / builder123')
            )
        else:
            self.stdout.write(f'Builder user {builder_email} already exists')

        # Create customer user
        customer_email = 'customer@greentech.africa'
        if not User.objects.filter(email=customer_email).exists():
            customer = User.objects.create_user(
                email=customer_email,
                password='customer123',
                first_name='Demo',
                last_name='Customer',
                user_type=User.UserType.CUSTOMER,
                is_verified=True,
                phone_number='+233 24 555 1234'
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created customer user: {customer_email} / customer123')
            )
        else:
            self.stdout.write(f'Customer user {customer_email} already exists')

        self.stdout.write(
            self.style.SUCCESS('\nDemo users created successfully!')
        )
        self.stdout.write('You can now test authentication with these credentials.')