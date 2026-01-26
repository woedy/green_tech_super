#!/usr/bin/env python
"""
Simple script to generate demo data for Green Tech Africa platform.
Run this from the green_tech_backend directory.
"""

import os
import sys
import django

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Now run the management command
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    print("🌱 Green Tech Africa Demo Data Generator")
    print("=" * 50)
    
    # Check if we should clear existing data
    clear_data = input("Clear existing data first? (y/N): ").lower().strip() == 'y'
    
    # Get counts
    try:
        users = int(input("Number of users to create (default 20): ") or "20")
        plans = int(input("Number of building plans (default 12): ") or "12")
        properties = int(input("Number of properties (default 30): ") or "30")
    except ValueError:
        print("Using default values...")
        users, plans, properties = 20, 12, 30
    
    # Build command
    cmd = ['manage.py', 'generate_demo_data']
    if clear_data:
        cmd.append('--clear')
    cmd.extend([
        '--users', str(users),
        '--plans', str(plans),
        '--properties', str(properties)
    ])
    
    print(f"\nGenerating demo data...")
    print(f"Users: {users}, Plans: {plans}, Properties: {properties}")
    if clear_data:
        print("⚠️  Will clear existing data first!")
    
    confirm = input("\nProceed? (Y/n): ").lower().strip()
    if confirm in ['', 'y', 'yes']:
        execute_from_command_line(cmd)
        print("\n✅ Demo data generation completed!")
        print("\nYou can now:")
        print("1. Start the Django development server: python manage.py runserver")
        print("2. Access the admin panel: http://localhost:8000/admin/")
        print("3. Test the API endpoints: http://localhost:8000/api/")
        print("4. Use the frontend applications with realistic data")
    else:
        print("Cancelled.")