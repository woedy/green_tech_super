import os
import django

def run():
    # Set up Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    # Now we can import Django's management commands
    from django.core.management import call_command
    
    print("Running makemigrations for plans app...")
    call_command('makemigrations', 'plans')
    
    print("Running migrate for plans app...")
    call_command('migrate', 'plans')
    
    print("Migrations completed successfully!")

if __name__ == "__main__":
    run()
