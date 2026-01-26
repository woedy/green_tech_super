"""
Django management command to generate comprehensive demo data for Green Tech Africa platform.
This command creates realistic data for all models to support frontend development and testing.
"""

import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

# Import all models
from accounts.models import User
from locations.models import Region
from plans.models import Plan, PlanImage, PlanFeature, PlanOption, PlanRegionalPricing, BuildRequest, BuildRequestAttachment
from properties.models import Property, PropertyImage, PropertyInquiry, ViewingAppointment
from construction.models import ConstructionRequest, ConstructionRequestEcoFeature, ConstructionMilestone, ConstructionDocument, Project
from quotes.models import Quote, QuoteLineItem, QuoteChatMessage
from leads.models import Lead, LeadActivity, LeadNote
from notifications.models import NotificationTemplate, Notification, UserNotificationPreference
from sitecontent.models import SiteDocument, SiteDocumentVersion

# Import EcoFeature separately to avoid circular import issues
from django.apps import apps
EcoFeature = apps.get_model('construction', 'EcoFeature')

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate comprehensive demo data for Green Tech Africa platform'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before generating new data',
        )
        parser.add_argument(
            '--users',
            type=int,
            default=20,
            help='Number of users to create (default: 20)',
        )
        parser.add_argument(
            '--plans',
            type=int,
            default=12,
            help='Number of building plans to create (default: 12)',
        )
        parser.add_argument(
            '--properties',
            type=int,
            default=30,
            help='Number of properties to create (default: 30)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()

        with transaction.atomic():
            self.stdout.write(self.style.SUCCESS('Starting demo data generation...'))
            
            # Create data in dependency order
            regions = self.create_regions()
            eco_features = self.create_eco_features()
            users = self.create_users(options['users'])
            plans = self.create_plans(options['plans'], regions)
            properties = self.create_properties(options['properties'], regions, users)
            build_requests = self.create_build_requests(plans, regions, users)
            property_inquiries = self.create_property_inquiries(properties, users)
            quotes = self.create_quotes(build_requests, regions, users)
            construction_requests = self.create_construction_requests(regions, users, eco_features)
            projects = self.create_projects(construction_requests, users, regions, properties)
            leads = self.create_leads(build_requests, property_inquiries, users)
            notifications = self.create_notifications(users)
            site_content = self.create_site_content(users)

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully generated demo data:\n'
                    f'  - {len(regions)} regions\n'
                    f'  - {len(eco_features)} eco features\n'
                    f'  - {len(users)} users\n'
                    f'  - {len(plans)} building plans\n'
                    f'  - {len(properties)} properties\n'
                    f'  - {len(build_requests)} build requests\n'
                    f'  - {len(property_inquiries)} property inquiries\n'
                    f'  - {len(quotes)} quotes\n'
                    f'  - {len(construction_requests)} construction requests\n'
                    f'  - {len(projects)} projects\n'
                    f'  - {len(leads)} leads\n'
                    f'  - Notification templates and preferences\n'
                    f'  - Site content pages'
                )
            )

    def clear_data(self):
        """Clear existing demo data (keep superusers)."""
        models_to_clear = [
            Notification, UserNotificationPreference, NotificationTemplate,
            SiteDocumentVersion, SiteDocument,
            LeadNote, LeadActivity, Lead,
            QuoteChatMessage, QuoteLineItem, Quote,
            ConstructionDocument, ConstructionMilestone, ConstructionRequestEcoFeature,
            Project, ConstructionRequest,
            ViewingAppointment, PropertyInquiry, PropertyImage, Property,
            BuildRequestAttachment, BuildRequest, PlanRegionalPricing, PlanOption,
            PlanFeature, PlanImage, Plan,
            EcoFeature, Region,
        ]
        
        for model in models_to_clear:
            model.objects.all().delete()
        
        # Clear non-superuser users
        User.objects.filter(is_superuser=False).delete()

    def create_regions(self):
        """Create Ghana regions with realistic data."""
        regions_data = [
            {
                'slug': 'gh-greater-accra',
                'name': 'Greater Accra',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('1.20'),
                'timezone': 'Africa/Accra',
                'capital': 'Accra',
                'ghana_region_name': 'Greater Accra Region',
                'local_materials_available': ['cement', 'sand', 'gravel', 'timber', 'clay_bricks', 'roofing_sheets']
            },
            {
                'slug': 'gh-ashanti',
                'name': 'Ashanti',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('1.10'),
                'timezone': 'Africa/Accra',
                'capital': 'Kumasi',
                'ghana_region_name': 'Ashanti Region',
                'local_materials_available': ['cement', 'sand', 'timber', 'clay_bricks', 'laterite', 'bamboo']
            },
            {
                'slug': 'gh-western',
                'name': 'Western',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('1.05'),
                'timezone': 'Africa/Accra',
                'capital': 'Sekondi-Takoradi',
                'ghana_region_name': 'Western Region',
                'local_materials_available': ['cement', 'sand', 'timber', 'clay_bricks', 'palm_fronds']
            },
            {
                'slug': 'gh-eastern',
                'name': 'Eastern',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('1.00'),
                'timezone': 'Africa/Accra',
                'capital': 'Koforidua',
                'ghana_region_name': 'Eastern Region',
                'local_materials_available': ['cement', 'sand', 'gravel', 'timber', 'clay_bricks', 'stone']
            },
            {
                'slug': 'gh-central',
                'name': 'Central',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('0.95'),
                'timezone': 'Africa/Accra',
                'capital': 'Cape Coast',
                'ghana_region_name': 'Central Region',
                'local_materials_available': ['cement', 'sand', 'timber', 'clay_bricks', 'coconut_fiber']
            },
            {
                'slug': 'gh-volta',
                'name': 'Volta',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('0.90'),
                'timezone': 'Africa/Accra',
                'capital': 'Ho',
                'ghana_region_name': 'Volta Region',
                'local_materials_available': ['cement', 'sand', 'timber', 'clay_bricks', 'bamboo', 'palm_fronds']
            },
            {
                'slug': 'gh-northern',
                'name': 'Northern',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('0.85'),
                'timezone': 'Africa/Accra',
                'capital': 'Tamale',
                'ghana_region_name': 'Northern Region',
                'local_materials_available': ['cement', 'sand', 'clay_bricks', 'mud_bricks', 'thatch', 'timber']
            },
            {
                'slug': 'gh-upper-east',
                'name': 'Upper East',
                'country': 'Ghana',
                'currency_code': 'GHS',
                'cost_multiplier': Decimal('0.80'),
                'timezone': 'Africa/Accra',
                'capital': 'Bolgatanga',
                'ghana_region_name': 'Upper East Region',
                'local_materials_available': ['cement', 'sand', 'clay_bricks', 'mud_bricks', 'thatch']
            }
        ]

        regions = []
        for data in regions_data:
            region, created = Region.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            regions.append(region)
            if created:
                self.stdout.write(f'Created region: {region.name}')

        return regions

    def create_eco_features(self):
        """Create eco-friendly features."""
        features_data = [
            # Solar Energy
            {
                'name': 'Solar Panel System (5kW)',
                'description': 'Complete 5kW solar panel system with inverter and battery backup',
                'category': 'SOLAR',
                'icon': 'solar-panel',
                'requires_specialist': True
            },
            {
                'name': 'Solar Water Heater',
                'description': 'Solar-powered water heating system for domestic use',
                'category': 'SOLAR',
                'icon': 'water-heater',
                'requires_specialist': True
            },
            # Water Conservation
            {
                'name': 'Rainwater Harvesting System',
                'description': 'Complete rainwater collection and storage system',
                'category': 'WATER',
                'icon': 'water-drop',
                'requires_specialist': False
            },
            {
                'name': 'Greywater Recycling System',
                'description': 'System to recycle greywater for irrigation',
                'category': 'WATER',
                'icon': 'recycle',
                'requires_specialist': True
            },
            # Eco-friendly Materials
            {
                'name': 'Bamboo Flooring',
                'description': 'Sustainable bamboo flooring throughout the house',
                'category': 'MATERIALS',
                'icon': 'bamboo',
                'requires_specialist': False
            },
            {
                'name': 'Recycled Steel Framework',
                'description': 'Use of recycled steel in construction framework',
                'category': 'MATERIALS',
                'icon': 'steel',
                'requires_specialist': True
            },
            # Waste Management
            {
                'name': 'Biogas Digester',
                'description': 'Organic waste processing system for cooking gas',
                'category': 'WASTE',
                'icon': 'gas',
                'requires_specialist': True
            },
            {
                'name': 'Composting System',
                'description': 'Integrated composting system for organic waste',
                'category': 'WASTE',
                'icon': 'compost',
                'requires_specialist': False
            },
            # Sustainable Landscaping
            {
                'name': 'Native Plant Garden',
                'description': 'Landscaping with native drought-resistant plants',
                'category': 'LANDSCAPING',
                'icon': 'tree',
                'requires_specialist': False
            },
            {
                'name': 'Permaculture Design',
                'description': 'Complete permaculture landscape design',
                'category': 'LANDSCAPING',
                'icon': 'leaf',
                'requires_specialist': True
            },
            # Insulation & Ventilation
            {
                'name': 'Natural Ventilation System',
                'description': 'Passive cooling through strategic window and vent placement',
                'category': 'INSULATION',
                'icon': 'wind',
                'requires_specialist': True
            },
            {
                'name': 'Eco-friendly Insulation',
                'description': 'Natural fiber insulation materials',
                'category': 'INSULATION',
                'icon': 'insulation',
                'requires_specialist': False
            },
            # Smart Home Technology
            {
                'name': 'Smart Energy Management',
                'description': 'IoT-based energy monitoring and control system',
                'category': 'SMART_HOME',
                'icon': 'smart-home',
                'requires_specialist': True
            },
            {
                'name': 'Smart Water Monitoring',
                'description': 'Automated water usage monitoring and leak detection',
                'category': 'SMART_HOME',
                'icon': 'water-meter',
                'requires_specialist': True
            }
        ]

        features = []
        for data in features_data:
            feature, created = EcoFeature.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            features.append(feature)
            if created:
                self.stdout.write(f'Created eco feature: {feature.name}')

        return features
    def create_users(self, count):
        """Create diverse users with different roles."""
        users_data = [
            # Admin users
            {
                'email': 'admin@greentech.africa',
                'first_name': 'Admin',
                'last_name': 'User',
                'user_type': 'ADMIN',
                'is_staff': True,
                'is_verified': True,
                'phone_number': '+233244123456'
            },
            # Agents
            {
                'email': 'kwame.asante@greentech.africa',
                'first_name': 'Kwame',
                'last_name': 'Asante',
                'user_type': 'AGENT',
                'is_verified': True,
                'phone_number': '+233244567890'
            },
            {
                'email': 'ama.osei@greentech.africa',
                'first_name': 'Ama',
                'last_name': 'Osei',
                'user_type': 'AGENT',
                'is_verified': True,
                'phone_number': '+233244567891'
            },
            {
                'email': 'kofi.mensah@greentech.africa',
                'first_name': 'Kofi',
                'last_name': 'Mensah',
                'user_type': 'AGENT',
                'is_verified': True,
                'phone_number': '+233244567892'
            },
            # Builders
            {
                'email': 'akosua.builder@greentech.africa',
                'first_name': 'Akosua',
                'last_name': 'Boateng',
                'user_type': 'BUILDER',
                'is_verified': True,
                'phone_number': '+233244567893'
            },
            {
                'email': 'yaw.constructor@greentech.africa',
                'first_name': 'Yaw',
                'last_name': 'Owusu',
                'user_type': 'BUILDER',
                'is_verified': True,
                'phone_number': '+233244567894'
            },
            # Customers
            {
                'email': 'customer1@example.com',
                'first_name': 'Abena',
                'last_name': 'Adjei',
                'user_type': 'CUSTOMER',
                'is_verified': True,
                'phone_number': '+233244567895'
            },
            {
                'email': 'customer2@example.com',
                'first_name': 'Kweku',
                'last_name': 'Antwi',
                'user_type': 'CUSTOMER',
                'is_verified': True,
                'phone_number': '+233244567896'
            },
            {
                'email': 'customer3@example.com',
                'first_name': 'Efua',
                'last_name': 'Darko',
                'user_type': 'CUSTOMER',
                'is_verified': False,
                'phone_number': '+233244567897'
            }
        ]

        # Generate additional random customers
        first_names = ['Kwame', 'Ama', 'Kofi', 'Akosua', 'Yaw', 'Abena', 'Kweku', 'Efua', 'Kojo', 'Adwoa']
        last_names = ['Asante', 'Osei', 'Mensah', 'Boateng', 'Owusu', 'Adjei', 'Antwi', 'Darko', 'Appiah', 'Gyasi']
        
        for i in range(len(users_data), count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            users_data.append({
                'email': f'user{i}@example.com',
                'first_name': first_name,
                'last_name': last_name,
                'user_type': random.choice(['CUSTOMER', 'CUSTOMER', 'CUSTOMER', 'AGENT', 'BUILDER']),
                'is_verified': random.choice([True, True, True, False]),
                'phone_number': f'+23324456789{i:02d}'
            })

        users = []
        for data in users_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    **data,
                    'password': 'pbkdf2_sha256$600000$dummy$dummy'  # Dummy password hash
                }
            )
            if created:
                user.set_password('password123')  # Set a simple password for demo
                user.save()
                self.stdout.write(f'Created user: {user.email} ({user.user_type})')
            users.append(user)

        return users

    def create_plans(self, count, regions):
        """Create building plans with various styles and features."""
        plans_data = [
            {
                'slug': 'modern-eco-villa-4br',
                'name': 'Modern Eco Villa - 4 Bedroom',
                'summary': 'Sustainable modern villa with solar panels and rainwater harvesting',
                'description': 'A stunning 4-bedroom modern villa designed with sustainability at its core. Features include solar panel system, rainwater harvesting, natural ventilation, and eco-friendly materials throughout.',
                'style': 'MODERN',
                'bedrooms': 4,
                'bathrooms': 3,
                'floors': 2,
                'area_sq_m': Decimal('280.50'),
                'base_price': Decimal('85000.00'),
                'base_currency': 'USD',
                'has_garage': True,
                'energy_rating': 5,
                'water_rating': 5,
                'sustainability_score': 95,
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'specs': {
                    'foundation': 'Reinforced concrete',
                    'walls': 'Insulated concrete blocks',
                    'roof': 'Clay tiles with solar panels',
                    'windows': 'Double-glazed energy efficient',
                    'flooring': 'Bamboo and ceramic tiles'
                },
                'tags': ['eco-friendly', 'solar-ready', 'modern', 'family-home'],
                'is_published': True
            },
            {
                'slug': 'traditional-bungalow-3br',
                'name': 'Traditional Bungalow - 3 Bedroom',
                'summary': 'Classic single-story bungalow with traditional Ghanaian design elements',
                'description': 'A beautiful 3-bedroom bungalow that combines traditional Ghanaian architectural elements with modern comfort. Features wide verandas, natural ventilation, and locally sourced materials.',
                'style': 'TRADITIONAL',
                'bedrooms': 3,
                'bathrooms': 2,
                'floors': 1,
                'area_sq_m': Decimal('180.00'),
                'base_price': Decimal('45000.00'),
                'base_currency': 'USD',
                'has_garage': False,
                'energy_rating': 3,
                'water_rating': 3,
                'sustainability_score': 70,
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'specs': {
                    'foundation': 'Stone and concrete',
                    'walls': 'Clay bricks with cement render',
                    'roof': 'Corrugated iron sheets',
                    'windows': 'Wooden frames with louvers',
                    'flooring': 'Terrazzo and ceramic tiles'
                },
                'tags': ['traditional', 'affordable', 'single-story', 'veranda'],
                'is_published': True
            },
            {
                'slug': 'contemporary-townhouse-3br',
                'name': 'Contemporary Townhouse - 3 Bedroom',
                'summary': 'Modern townhouse perfect for urban living',
                'description': 'A sleek 3-bedroom townhouse designed for modern urban families. Features open-plan living, rooftop terrace, and smart home integration.',
                'style': 'CONTEMPORARY',
                'bedrooms': 3,
                'bathrooms': 2,
                'floors': 3,
                'area_sq_m': Decimal('220.00'),
                'base_price': Decimal('65000.00'),
                'base_currency': 'USD',
                'has_garage': True,
                'energy_rating': 4,
                'water_rating': 4,
                'sustainability_score': 80,
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'specs': {
                    'foundation': 'Reinforced concrete',
                    'walls': 'Concrete blocks with insulation',
                    'roof': 'Flat roof with waterproofing',
                    'windows': 'Aluminum frames with glass',
                    'flooring': 'Polished concrete and tiles'
                },
                'tags': ['contemporary', 'urban', 'rooftop', 'smart-home'],
                'is_published': True
            },
            {
                'slug': 'luxury-villa-5br',
                'name': 'Luxury Villa - 5 Bedroom',
                'summary': 'Spacious luxury villa with premium finishes and amenities',
                'description': 'An elegant 5-bedroom luxury villa featuring premium finishes, swimming pool, landscaped gardens, and state-of-the-art amenities.',
                'style': 'VILLA',
                'bedrooms': 5,
                'bathrooms': 4,
                'floors': 2,
                'area_sq_m': Decimal('450.00'),
                'base_price': Decimal('150000.00'),
                'base_currency': 'USD',
                'has_garage': True,
                'energy_rating': 4,
                'water_rating': 3,
                'sustainability_score': 65,
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'specs': {
                    'foundation': 'Reinforced concrete with basement',
                    'walls': 'Brick and stone with premium finishes',
                    'roof': 'Clay tiles with insulation',
                    'windows': 'Premium aluminum with security features',
                    'flooring': 'Marble, hardwood, and premium tiles'
                },
                'tags': ['luxury', 'swimming-pool', 'landscaped', 'premium'],
                'is_published': True
            },
            {
                'slug': 'compact-bungalow-2br',
                'name': 'Compact Bungalow - 2 Bedroom',
                'summary': 'Affordable compact bungalow for small families',
                'description': 'A well-designed 2-bedroom bungalow that maximizes space efficiency while maintaining comfort. Perfect for young families or couples.',
                'style': 'BUNGALOW',
                'bedrooms': 2,
                'bathrooms': 1,
                'floors': 1,
                'area_sq_m': Decimal('120.00'),
                'base_price': Decimal('28000.00'),
                'base_currency': 'USD',
                'has_garage': False,
                'energy_rating': 3,
                'water_rating': 3,
                'sustainability_score': 60,
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'specs': {
                    'foundation': 'Concrete strip foundation',
                    'walls': 'Concrete blocks',
                    'roof': 'Corrugated sheets with ceiling',
                    'windows': 'Aluminum frames',
                    'flooring': 'Ceramic tiles throughout'
                },
                'tags': ['compact', 'affordable', 'starter-home', 'efficient'],
                'is_published': True
            }
        ]

        # Generate additional random plans
        styles = ['MODERN', 'CONTEMPORARY', 'BUNGALOW', 'VILLA', 'TOWNHOUSE', 'TRADITIONAL']
        for i in range(len(plans_data), count):
            style = random.choice(styles)
            bedrooms = random.randint(2, 5)
            bathrooms = max(1, bedrooms - 1)
            floors = 1 if style == 'BUNGALOW' else random.randint(1, 3)
            area = Decimal(str(random.randint(100, 400)))
            base_price = area * Decimal(str(random.randint(200, 400)))
            
            plans_data.append({
                'slug': f'{style.lower()}-plan-{i}',
                'name': f'{style.title()} Plan {i} - {bedrooms} Bedroom',
                'summary': f'Beautiful {bedrooms}-bedroom {style.lower()} home',
                'description': f'A well-designed {bedrooms}-bedroom {style.lower()} home with modern amenities and sustainable features.',
                'style': style,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'floors': floors,
                'area_sq_m': area,
                'base_price': base_price,
                'base_currency': 'USD',
                'has_garage': random.choice([True, False]),
                'energy_rating': random.randint(2, 5),
                'water_rating': random.randint(2, 5),
                'sustainability_score': random.randint(50, 95),
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'specs': {
                    'foundation': 'Reinforced concrete',
                    'walls': 'Concrete blocks',
                    'roof': 'Metal sheets',
                    'windows': 'Aluminum frames',
                    'flooring': 'Ceramic tiles'
                },
                'tags': [style.lower(), f'{bedrooms}br', 'modern'],
                'is_published': True
            })

        plans = []
        for data in plans_data:
            plan, created = Plan.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                plan.published_at = timezone.now()
                plan.save()
                
                # Create plan images
                for j in range(random.randint(3, 6)):
                    PlanImage.objects.create(
                        plan=plan,
                        image_url='https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                        caption=f'{plan.name} - View {j+1}',
                        is_primary=(j == 0),
                        order=j
                    )
                
                # Create regional pricing
                for region in regions:
                    PlanRegionalPricing.objects.create(
                        plan=plan,
                        region=region,
                        cost_multiplier=region.cost_multiplier,
                        currency_code=region.currency_code
                    )
                
                self.stdout.write(f'Created plan: {plan.name}')
            plans.append(plan)

        return plans

    def create_properties(self, count, regions, users):
        """Create property listings."""
        agents = [u for u in users if u.user_type == 'AGENT']
        property_types = ['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'COMMERCIAL']
        listing_types = ['SALE', 'RENT']
        cities = ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Ho', 'Koforidua', 'Bolgatanga']
        
        properties = []
        for i in range(count):
            property_type = random.choice(property_types)
            listing_type = random.choice(listing_types)
            region = random.choice(regions)
            city = random.choice(cities)
            bedrooms = random.randint(1, 6) if property_type != 'COMMERCIAL' else 0
            bathrooms = max(1, bedrooms - 1) if property_type != 'COMMERCIAL' else random.randint(1, 4)
            area = Decimal(str(random.randint(50, 500)))
            
            # Price based on type and location
            base_price_per_sqm = {
                'APARTMENT': random.randint(800, 1500),
                'HOUSE': random.randint(600, 1200),
                'VILLA': random.randint(1200, 2500),
                'TOWNHOUSE': random.randint(900, 1800),
                'COMMERCIAL': random.randint(1000, 3000)
            }
            
            price = area * Decimal(str(base_price_per_sqm[property_type]))
            if listing_type == 'RENT':
                price = price / 12  # Monthly rent
            
            property_data = {
                'slug': f'{property_type.lower()}-{city.lower()}-{i}',
                'title': f'{property_type.title()} in {city}',
                'summary': f'Beautiful {bedrooms}BR {property_type.lower()} for {listing_type.lower()}',
                'description': f'A well-maintained {property_type.lower()} located in the heart of {city}. Features modern amenities and sustainable design elements.',
                'property_type': property_type,
                'listing_type': listing_type,
                'status': random.choice(['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'UNDER_OFFER']),
                'price': price,
                'currency': region.currency_code,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'area_sq_m': area,
                'plot_sq_m': area * Decimal(str(random.uniform(1.5, 3.0))) if property_type in ['HOUSE', 'VILLA'] else None,
                'year_built': random.randint(2010, 2024),
                'hero_image_url': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                'sustainability_score': random.randint(40, 90),
                'energy_rating': random.randint(2, 5),
                'water_rating': random.randint(2, 5),
                'amenities': random.sample([
                    'Swimming Pool', 'Gym', 'Security', 'Parking', 'Garden', 
                    'Balcony', 'Air Conditioning', 'Solar Panels', 'Generator'
                ], random.randint(2, 5)),
                'highlights': random.sample([
                    'Prime Location', 'Modern Design', 'Eco-Friendly', 'Gated Community',
                    'Near Schools', 'Shopping Centers', 'Public Transport', 'Hospital Nearby'
                ], random.randint(2, 4)),
                'city': city,
                'country': 'Ghana',
                'region': region,
                'address': f'{random.randint(1, 999)} {random.choice(["Main", "Oak", "First", "Second"])} Street',
                'latitude': Decimal(str(random.uniform(4.5, 11.0))),
                'longitude': Decimal(str(random.uniform(-3.5, 1.5))),
                'featured': random.choice([True, False, False, False]),  # 25% featured
                'listed_by': random.choice(agents) if agents else None
            }
            
            property_obj = Property.objects.create(**property_data)
            
            # Create property images
            for j in range(random.randint(4, 8)):
                PropertyImage.objects.create(
                    property=property_obj,
                    image_url='https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?cs=srgb&dl=pexels-binyamin-mellish-106399.jpg&fm=jpg',
                    caption=f'{property_obj.title} - Image {j+1}',
                    is_primary=(j == 0),
                    order=j
                )
            
            properties.append(property_obj)
            if i % 10 == 0:
                self.stdout.write(f'Created {i+1} properties...')

        self.stdout.write(f'Created {len(properties)} properties')
        return properties

    def create_build_requests(self, plans, regions, users):
        """Create build requests from customers."""
        customers = [u for u in users if u.user_type == 'CUSTOMER']
        statuses = ['NEW', 'IN_REVIEW', 'CONTACTED', 'ARCHIVED']
        
        build_requests = []
        for i in range(15):
            plan = random.choice(plans)
            region = random.choice(regions)
            customer = random.choice(customers) if customers and random.choice([True, False]) else None
            
            # Generate contact info (either from user or standalone)
            if customer:
                contact_name = f'{customer.first_name} {customer.last_name}'
                contact_email = customer.email
                contact_phone = customer.phone_number
            else:
                first_names = ['Kwame', 'Ama', 'Kofi', 'Akosua', 'Yaw', 'Abena']
                last_names = ['Asante', 'Osei', 'Mensah', 'Boateng', 'Owusu', 'Adjei']
                contact_name = f'{random.choice(first_names)} {random.choice(last_names)}'
                contact_email = f'customer{i}@example.com'
                contact_phone = f'+23324456789{i:02d}'
            
            build_request = BuildRequest.objects.create(
                plan=plan,
                region=region,
                user=customer,
                contact_name=contact_name,
                contact_email=contact_email,
                contact_phone=contact_phone,
                budget_currency=region.currency_code,
                budget_min=plan.base_price * region.cost_multiplier * Decimal('0.8'),
                budget_max=plan.base_price * region.cost_multiplier * Decimal('1.2'),
                timeline=random.choice(['3-6 months', '6-12 months', '12-18 months', 'Flexible']),
                customizations=random.choice([
                    'Add solar panels and rainwater harvesting',
                    'Extend kitchen and add pantry',
                    'Add swimming pool and landscaping',
                    'Upgrade to premium finishes',
                    'Add garage and storage room'
                ]),
                options=random.sample([
                    'solar_panels', 'rainwater_harvesting', 'swimming_pool',
                    'garage', 'garden_landscaping', 'security_system'
                ], random.randint(1, 3)),
                intake_data={
                    'family_size': random.randint(2, 8),
                    'special_requirements': random.choice([
                        'Wheelchair accessible',
                        'Home office space',
                        'Large kitchen for catering',
                        'Guest quarters',
                        'Workshop space'
                    ]),
                    'preferred_materials': random.choice([
                        'Eco-friendly materials',
                        'Local materials',
                        'Premium finishes',
                        'Cost-effective options'
                    ])
                },
                status=random.choice(statuses),
                submitted_at=timezone.now() - timedelta(days=random.randint(1, 90))
            )
            
            build_requests.append(build_request)
            if i % 5 == 0:
                self.stdout.write(f'Created {i+1} build requests...')

        self.stdout.write(f'Created {len(build_requests)} build requests')
        return build_requests
    def create_property_inquiries(self, properties, users):
        """Create property inquiries from customers."""
        customers = [u for u in users if u.user_type == 'CUSTOMER']
        statuses = ['NEW', 'IN_PROGRESS', 'CLOSED']
        
        inquiries = []
        for i in range(20):
            property_obj = random.choice(properties)
            customer = random.choice(customers) if customers and random.choice([True, False]) else None
            
            # Generate contact info
            if customer:
                name = f'{customer.first_name} {customer.last_name}'
                email = customer.email
                phone = customer.phone_number
            else:
                first_names = ['Kwame', 'Ama', 'Kofi', 'Akosua', 'Yaw', 'Abena']
                last_names = ['Asante', 'Osei', 'Mensah', 'Boateng', 'Owusu', 'Adjei']
                name = f'{random.choice(first_names)} {random.choice(last_names)}'
                email = f'inquiry{i}@example.com'
                phone = f'+23324456789{i:02d}'
            
            messages = [
                f'I am interested in viewing this {property_obj.property_type.lower()}. When would be a good time?',
                f'Could you provide more information about the {property_obj.title}?',
                f'I would like to schedule a viewing for this property. I am available weekends.',
                f'Is this property still available? I am very interested and can view anytime.',
                f'What are the payment terms for this {property_obj.property_type.lower()}?'
            ]
            
            inquiry = PropertyInquiry.objects.create(
                property=property_obj,
                name=name,
                email=email,
                phone=phone,
                message=random.choice(messages),
                status=random.choice(statuses),
                created_at=timezone.now() - timedelta(days=random.randint(1, 60))
            )
            
            # Create viewing appointments for some inquiries
            if random.choice([True, False]) and property_obj.listed_by:
                ViewingAppointment.objects.create(
                    inquiry=inquiry,
                    property=property_obj,
                    agent=property_obj.listed_by,
                    scheduled_for=timezone.now() + timedelta(days=random.randint(1, 14)),
                    notes=f'Viewing scheduled for {name}',
                    status=random.choice(['PENDING', 'CONFIRMED', 'COMPLETED'])
                )
            
            inquiries.append(inquiry)

        self.stdout.write(f'Created {len(inquiries)} property inquiries')
        return inquiries

    def create_quotes(self, build_requests, regions, users):
        """Create quotes for build requests."""
        agents = [u for u in users if u.user_type in ['AGENT', 'BUILDER']]
        statuses = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED']
        
        quotes = []
        for i, build_request in enumerate(build_requests[:12]):  # Create quotes for first 12 requests
            if not agents:
                continue
                
            agent = random.choice(agents)
            status = random.choice(statuses)
            
            # Calculate quote amounts
            base_amount = build_request.plan.base_price * build_request.region.cost_multiplier
            subtotal = base_amount * Decimal(str(random.uniform(0.9, 1.3)))  # Add variation
            tax_rate = Decimal('0.125')  # 12.5% VAT in Ghana
            tax_amount = subtotal * tax_rate
            total_amount = subtotal + tax_amount
            
            quote = Quote.objects.create(
                reference=f'Q{timezone.now().year}{i+1:04d}',
                quote_type='BUILD_REQUEST',
                build_request=build_request,
                region=build_request.region,
                status=status,
                currency_code=build_request.region.currency_code,
                regional_multiplier=build_request.region.cost_multiplier,
                subtotal_amount=subtotal,
                tax_amount=tax_amount,
                total_amount=total_amount,
                valid_until=timezone.now() + timedelta(days=30),
                prepared_by_name=f'{agent.first_name} {agent.last_name}',
                prepared_by_email=agent.email,
                recipient_name=build_request.contact_name,
                recipient_email=build_request.contact_email,
                notes='Quote prepared based on your build request specifications.',
                terms='Payment terms: 30% deposit, 40% at foundation completion, 30% at project completion.'
            )
            
            if status in ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED']:
                quote.sent_at = timezone.now() - timedelta(days=random.randint(1, 30))
            if status in ['VIEWED', 'ACCEPTED', 'DECLINED']:
                quote.viewed_at = quote.sent_at + timedelta(hours=random.randint(1, 48))
            if status == 'ACCEPTED':
                quote.accepted_at = quote.viewed_at + timedelta(hours=random.randint(1, 72))
            elif status == 'DECLINED':
                quote.declined_at = quote.viewed_at + timedelta(hours=random.randint(1, 72))
            
            quote.save()
            
            # Create quote line items
            line_items = [
                {
                    'label': 'Foundation and Structure',
                    'quantity': 1,
                    'unit_cost': subtotal * Decimal('0.35'),
                    'kind': 'BASE'
                },
                {
                    'label': 'Walls and Roofing',
                    'quantity': 1,
                    'unit_cost': subtotal * Decimal('0.25'),
                    'kind': 'BASE'
                },
                {
                    'label': 'Electrical and Plumbing',
                    'quantity': 1,
                    'unit_cost': subtotal * Decimal('0.20'),
                    'kind': 'BASE'
                },
                {
                    'label': 'Finishes and Fixtures',
                    'quantity': 1,
                    'unit_cost': subtotal * Decimal('0.15'),
                    'kind': 'BASE'
                },
                {
                    'label': 'Project Management',
                    'quantity': 1,
                    'unit_cost': subtotal * Decimal('0.05'),
                    'kind': 'BASE'
                }
            ]
            
            # Add optional items
            if 'solar_panels' in build_request.options:
                line_items.append({
                    'label': 'Solar Panel System (5kW)',
                    'quantity': 1,
                    'unit_cost': Decimal('15000.00'),
                    'kind': 'OPTION'
                })
            
            if 'swimming_pool' in build_request.options:
                line_items.append({
                    'label': 'Swimming Pool Construction',
                    'quantity': 1,
                    'unit_cost': Decimal('25000.00'),
                    'kind': 'OPTION'
                })
            
            for j, item_data in enumerate(line_items):
                QuoteLineItem.objects.create(
                    quote=quote,
                    position=j,
                    **item_data
                )
            
            quotes.append(quote)

        self.stdout.write(f'Created {len(quotes)} quotes')
        return quotes

    def create_construction_requests(self, regions, users, eco_features):
        """Create construction project requests."""
        customers = [u for u in users if u.user_type == 'CUSTOMER']
        construction_types = ['NEW', 'RENO', 'EXT', 'LAND', 'INT']
        statuses = ['DRAFT', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']
        steps = ['PROJECT_DETAILS', 'LOCATION', 'ECO_FEATURES', 'BUDGET', 'REVIEW']
        
        requests = []
        for i in range(10):
            customer = random.choice(customers) if customers else None
            region = random.choice(regions)
            construction_type = random.choice(construction_types)
            status = random.choice(statuses)
            current_step = random.choice(steps) if status == 'DRAFT' else 'REVIEW'
            
            request = ConstructionRequest.objects.create(
                title=f'{construction_type} Construction Project {i+1}',
                current_step=current_step,
                is_completed=(status != 'DRAFT'),
                construction_type=construction_type,
                status=status,
                address=f'{random.randint(1, 999)} {random.choice(["Main", "Oak", "First"])} Street',
                city=random.choice(['Accra', 'Kumasi', 'Tamale', 'Cape Coast']),
                region=region,
                start_date=timezone.now().date() + timedelta(days=random.randint(30, 180)),
                estimated_end_date=timezone.now().date() + timedelta(days=random.randint(180, 540)),
                budget=Decimal(str(random.randint(20000, 150000))),
                currency=region.currency_code,
                estimated_cost=Decimal(str(random.randint(25000, 180000))),
                target_energy_rating=random.randint(3, 5),
                target_water_rating=random.randint(3, 5),
                target_sustainability_score=random.randint(70, 95),
                client=customer,
                customization_data={
                    'special_requirements': random.choice([
                        'Wheelchair accessible design',
                        'Home office integration',
                        'Large entertainment area',
                        'Workshop space',
                        'Guest quarters'
                    ]),
                    'preferred_style': random.choice(['Modern', 'Traditional', 'Contemporary']),
                    'budget_priority': random.choice(['Cost-effective', 'Premium quality', 'Balanced'])
                }
            )
            
            # Add eco features to some requests
            selected_features = random.sample(eco_features, random.randint(2, 5))
            for feature in selected_features:
                ConstructionRequestEcoFeature.objects.create(
                    construction_request=request,
                    eco_feature=feature,
                    quantity=random.randint(1, 3),
                    estimated_cost=Decimal(str(random.randint(1000, 15000))),  # Random cost since base_cost not available
                    custom_specifications=f'Customized {feature.name} for this project'
                )
            
            # Add milestones for non-draft requests
            if status != 'DRAFT':
                milestones = [
                    'Site preparation and permits',
                    'Foundation and structure',
                    'Walls and roofing',
                    'Electrical and plumbing rough-in',
                    'Insulation and drywall',
                    'Flooring and finishes',
                    'Final inspections and cleanup'
                ]
                
                for j, milestone_title in enumerate(milestones):
                    due_date = request.start_date + timedelta(days=j * 30)
                    is_completed = (status == 'COMPLETED') or (status == 'IN_PROGRESS' and j < 3)
                    
                    ConstructionMilestone.objects.create(
                        construction_request=request,
                        title=milestone_title,
                        description=f'Complete {milestone_title.lower()} phase of construction',
                        due_date=due_date,
                        completed_date=due_date if is_completed else None,
                        is_completed=is_completed
                    )
            
            requests.append(request)

        self.stdout.write(f'Created {len(requests)} construction requests')
        return requests

    def create_projects(self, construction_requests, users, regions, properties):
        """Create active construction projects."""
        builders = [u for u in users if u.user_type == 'BUILDER']
        agents = [u for u in users if u.user_type == 'AGENT']
        statuses = ['PLANNING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']
        
        projects = []
        for i, request in enumerate(construction_requests[:6]):  # Create projects for first 6 requests
            if request.status in ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] and properties:
                project_manager = random.choice(agents) if agents else None
                site_supervisor = random.choice(builders) if builders else None
                # Assign a random property to the project
                property_obj = random.choice(properties)
                
                project = Project.objects.create(
                    title=f'Project: {request.title}',
                    description=f'Construction project based on {request.title}',
                    status=random.choice(statuses),
                    construction_request=request,
                    property=property_obj,  # Required field
                    planned_start_date=request.start_date,
                    planned_end_date=request.estimated_end_date,
                    estimated_budget=request.estimated_cost,
                    actual_cost=request.estimated_cost * Decimal(str(random.uniform(0.9, 1.1))),
                    currency=request.currency,
                    project_manager=project_manager,
                    site_supervisor=site_supervisor,
                    created_by=request.client
                )
                
                projects.append(project)

        self.stdout.write(f'Created {len(projects)} projects')
        return projects

    def create_leads(self, build_requests, property_inquiries, users):
        """Create leads from build requests and property inquiries."""
        agents = [u for u in users if u.user_type == 'AGENT']
        statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'CLOSED']
        priorities = ['HIGH', 'MEDIUM', 'LOW']
        
        leads = []
        
        # Create leads from build requests
        for request in build_requests[:10]:
            lead = Lead.objects.create(
                source_type='BUILD_REQUEST',
                source_id=str(request.id),
                title=f'Build Request: {request.plan.name}',
                contact_name=request.contact_name,
                contact_email=request.contact_email,
                contact_phone=request.contact_phone,
                status=random.choice(statuses),
                priority=random.choice(priorities),
                is_unread=random.choice([True, False]),
                metadata={
                    'plan_name': request.plan.name,
                    'region': request.region.name,
                    'budget_range': f'{request.budget_min} - {request.budget_max} {request.budget_currency}',
                    'timeline': request.timeline
                },
                assigned_to=random.choice(agents) if agents and random.choice([True, False]) else None,
                created_at=request.submitted_at,
                last_activity_at=request.submitted_at + timedelta(hours=random.randint(1, 48))
            )
            leads.append(lead)
            
            # Add lead activities
            activities = [
                ('CREATED', 'Lead created from build request'),
                ('STATUS_CHANGED', f'Status changed to {lead.status}'),
                ('NOTE_ADDED', 'Initial assessment completed')
            ]
            
            for activity_type, message in activities:
                LeadActivity.objects.create(
                    lead=lead,
                    kind=activity_type,
                    message=message,
                    created_by=lead.assigned_to,
                    created_at=lead.created_at + timedelta(hours=random.randint(1, 24))
                )
        
        # Create leads from property inquiries
        for inquiry in property_inquiries[:8]:
            lead = Lead.objects.create(
                source_type='PROPERTY_INQUIRY',
                source_id=str(inquiry.id),
                title=f'Property Inquiry: {inquiry.property.title}',
                contact_name=inquiry.name,
                contact_email=inquiry.email,
                contact_phone=inquiry.phone,
                status=random.choice(statuses),
                priority=random.choice(priorities),
                is_unread=random.choice([True, False]),
                metadata={
                    'property_title': inquiry.property.title,
                    'property_type': inquiry.property.property_type,
                    'listing_type': inquiry.property.listing_type,
                    'price': f'{inquiry.property.price} {inquiry.property.currency}',
                    'location': f'{inquiry.property.city}, {inquiry.property.region.name}'
                },
                assigned_to=inquiry.property.listed_by,
                created_at=inquiry.created_at,
                last_activity_at=inquiry.created_at + timedelta(hours=random.randint(1, 48))
            )
            leads.append(lead)

        self.stdout.write(f'Created {len(leads)} leads')
        return leads

    def create_notifications(self, users):
        """Create notification templates and user notifications."""
        # Create notification templates
        templates_data = [
            {
                'name': 'build_request_received',
                'subject': 'New Build Request Received',
                'template': 'A new build request has been submitted for {{ plan_name }} in {{ region_name }}.',
                'notification_type': 'EMAIL'
            },
            {
                'name': 'quote_sent',
                'subject': 'Quote Sent Successfully',
                'template': 'Your quote {{ quote_reference }} has been sent to {{ recipient_name }}.',
                'notification_type': 'EMAIL'
            },
            {
                'name': 'quote_accepted',
                'subject': 'Quote Accepted!',
                'template': 'Great news! Your quote {{ quote_reference }} has been accepted by {{ client_name }}.',
                'notification_type': 'EMAIL'
            },
            {
                'name': 'project_milestone',
                'subject': 'Project Milestone Completed',
                'template': 'Milestone "{{ milestone_name }}" has been completed for project {{ project_name }}.',
                'notification_type': 'IN_APP'
            },
            {
                'name': 'property_inquiry',
                'subject': 'New Property Inquiry',
                'template': 'You have received a new inquiry for {{ property_title }} from {{ inquirer_name }}.',
                'notification_type': 'EMAIL'
            }
        ]
        
        for template_data in templates_data:
            NotificationTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
        
        # Create user notification preferences
        for user in users:
            UserNotificationPreference.objects.get_or_create(
                user=user,
                defaults={
                    'email_notifications': True,
                    'sms_notifications': random.choice([True, False]),
                    'push_notifications': True,
                    'in_app_notifications': True,
                    'project_updates': True,
                    'quote_updates': True,
                    'payment_reminders': True,
                    'system_alerts': True,
                    'marketing': random.choice([True, False])
                }
            )
        
        # Create some sample notifications
        customers = [u for u in users if u.user_type == 'CUSTOMER']
        agents = [u for u in users if u.user_type == 'AGENT']
        
        notification_messages = [
            ('Your build request has been received and is under review.', 'NORMAL'),
            ('A new quote is available for your review.', 'HIGH'),
            ('Your project milestone has been completed.', 'NORMAL'),
            ('Payment reminder: Invoice due in 3 days.', 'HIGH'),
            ('Welcome to Green Tech Africa platform!', 'LOW')
        ]
        
        for user in customers[:5]:
            for message, priority in random.sample(notification_messages, 3):
                Notification.objects.create(
                    recipient=user,
                    subject='Platform Update',
                    message=message,
                    notification_type='IN_APP',
                    priority=priority,
                    status=random.choice(['SENT', 'DELIVERED', 'READ'])
                )

        self.stdout.write('Created notification templates and preferences')

    def create_site_content(self, users):
        """Create site content pages."""
        admin_users = [u for u in users if u.user_type == 'ADMIN']
        admin_user = admin_users[0] if admin_users else users[0]
        
        documents_data = [
            {
                'slug': 'terms-of-service',
                'title': 'Terms of Service',
                'category': 'LEGAL',
                'description': 'Terms and conditions for using Green Tech Africa platform',
                'content': '''
# Terms of Service

## 1. Acceptance of Terms
By accessing and using the Green Tech Africa platform, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Services
Green Tech Africa provides a platform connecting customers with sustainable construction and real estate services across Africa.

## 3. User Responsibilities
Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.

## 4. Privacy
Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the platform.

## 5. Limitation of Liability
Green Tech Africa shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

## 6. Changes to Terms
We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.

Contact us at legal@greentech.africa for any questions about these terms.
                '''
            },
            {
                'slug': 'privacy-policy',
                'title': 'Privacy Policy',
                'category': 'LEGAL',
                'description': 'How we collect, use, and protect your personal information',
                'content': '''
# Privacy Policy

## Information We Collect
We collect information you provide directly to us, such as when you create an account, submit a build request, or contact us.

## How We Use Your Information
We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.

## Information Sharing
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

## Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Contact Us
If you have any questions about this Privacy Policy, please contact us at privacy@greentech.africa.
                '''
            },
            {
                'slug': 'about-us',
                'title': 'About Green Tech Africa',
                'category': 'GENERAL',
                'description': 'Learn about our mission and values',
                'content': '''
# About Green Tech Africa

## Our Mission
To make sustainable construction and property transactions simpler and transparent across Africa, highlighting green building best practices.

## Our Vision
A future where every building in Africa is designed and constructed with sustainability at its core.

## Our Values
- **Sustainability**: Promoting eco-friendly construction practices
- **Transparency**: Clear and honest communication in all transactions
- **Innovation**: Leveraging technology to improve the construction industry
- **Community**: Building stronger, more sustainable communities

## Our Team
We are a diverse team of architects, engineers, real estate professionals, and technology experts passionate about sustainable development in Africa.

Contact us at info@greentech.africa to learn more about our services.
                '''
            }
        ]
        
        for doc_data in documents_data:
            document, created = SiteDocument.objects.get_or_create(
                slug=doc_data['slug'],
                defaults={
                    'title': doc_data['title'],
                    'category': doc_data['category'],
                    'description': doc_data['description']
                }
            )
            
            if created:
                version = SiteDocumentVersion.objects.create(
                    document=document,
                    version=1,
                    status='PUBLISHED',
                    title=doc_data['title'],
                    summary=doc_data['description'],
                    body=doc_data['content'],
                    created_by=admin_user,
                    notes='Initial version'
                )
                document.current_version = version
                document.save()

        self.stdout.write('Created site content pages')