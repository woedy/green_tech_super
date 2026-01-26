# Green Tech Africa Demo Data Generator

This document explains how to generate comprehensive demo data for the Green Tech Africa platform to support frontend development and testing.

## 🎯 What Gets Generated

The demo data generator creates realistic data across all platform models:

### **Core Data (8 Ghana Regions)**
- **Regions**: Greater Accra, Ashanti, Western, Eastern, Central, Volta, Northern, Upper East
- **Cost Multipliers**: Realistic regional pricing variations (0.80x to 1.20x)
- **Local Materials**: Region-specific available construction materials
- **Currency**: Ghana Cedis (GHS) with proper formatting

### **Users (20 by default)**
- **Admin Users**: Platform administrators
- **Agents**: Real estate agents (3-4 users)
- **Builders**: Construction contractors (2-3 users)  
- **Customers**: End users seeking properties/construction (12-15 users)
- **Authentication**: All users have password `password123` for testing

### **Building Plans (12 by default)**
- **Styles**: Modern, Contemporary, Bungalow, Villa, Townhouse, Traditional
- **Variety**: 2-5 bedrooms, different price ranges ($28K - $150K USD)
- **Sustainability**: Energy/water ratings, sustainability scores
- **Images**: Multiple gallery images per plan
- **Regional Pricing**: Cost multipliers applied per region
- **Features**: Garage, eco-features, specifications

### **Properties (30 by default)**
- **Types**: Apartments, Houses, Villas, Townhouses, Commercial
- **Listings**: For sale and for rent
- **Locations**: Distributed across Ghana regions and cities
- **Pricing**: Realistic pricing based on location and type
- **Features**: Amenities, highlights, sustainability scores
- **Images**: 4-8 images per property
- **GPS Coordinates**: Realistic latitude/longitude for Ghana

### **Build Requests (15 generated)**
- **Statuses**: NEW, IN_REVIEW, CONTACTED, ARCHIVED
- **Customizations**: Solar panels, swimming pools, premium finishes
- **Budget Ranges**: Based on selected plans and regions
- **Timeline**: 3-18 months with flexible options
- **Contact Info**: Mix of registered users and standalone contacts

### **Property Inquiries (20 generated)**
- **Realistic Messages**: Viewing requests, information requests
- **Contact Details**: Mix of registered and guest users
- **Viewing Appointments**: Scheduled appointments with agents
- **Status Tracking**: NEW, IN_PROGRESS, CLOSED

### **Quotes (12 generated)**
- **Types**: Build request quotes with line items
- **Statuses**: DRAFT, SENT, VIEWED, ACCEPTED, DECLINED
- **Pricing**: Detailed breakdown (foundation, walls, electrical, etc.)
- **Options**: Solar panels, swimming pools, premium upgrades
- **Terms**: Payment schedules and validity periods
- **References**: Auto-generated quote numbers (Q2025-0001, etc.)

### **Construction Projects (10 requests, 6 active projects)**
- **Types**: New construction, renovation, extension, landscaping
- **Eco Features**: 14 different sustainable features across 7 categories
- **Milestones**: Project phases with completion tracking
- **Team**: Project managers, site supervisors, contractors
- **Sustainability Targets**: Energy/water efficiency goals

### **Leads (18 generated)**
- **Sources**: From build requests and property inquiries
- **Assignment**: Distributed among agents
- **Priorities**: HIGH, MEDIUM, LOW with realistic distribution
- **Activities**: Status changes, notes, communications
- **Metadata**: Rich context about lead source and requirements

### **Notifications & Content**
- **Templates**: Email/SMS/in-app notification templates
- **User Preferences**: Notification settings per user
- **Site Content**: Terms of Service, Privacy Policy, About Us
- **System Notifications**: Welcome messages, updates, reminders

## 🚀 How to Generate Demo Data

### Method 1: Interactive Script (Recommended)
```bash
cd green_tech_backend
python run_demo_data.py
```

This interactive script will:
1. Ask if you want to clear existing data
2. Let you specify how many users/plans/properties to create
3. Show a summary before proceeding
4. Run the generation with progress updates

### Method 2: Direct Django Command
```bash
cd green_tech_backend
python manage.py generate_demo_data --clear --users 25 --plans 15 --properties 40
```

**Command Options:**
- `--clear`: Remove existing demo data first (keeps superusers)
- `--users N`: Number of users to create (default: 20)
- `--plans N`: Number of building plans (default: 12)  
- `--properties N`: Number of properties (default: 30)

### Method 3: Python Script
```python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import call_command
call_command('generate_demo_data', clear=True, users=20, plans=12, properties=30)
```

## 📊 Generated Data Summary

After running the generator, you'll have:

| Model | Count | Description |
|-------|-------|-------------|
| Regions | 8 | Ghana regions with cost multipliers |
| Eco Features | 14 | Sustainable construction features |
| Users | 20+ | Mix of customers, agents, builders, admins |
| Building Plans | 12+ | Various styles and price ranges |
| Properties | 30+ | Listings across Ghana |
| Build Requests | 15 | Customer construction requests |
| Property Inquiries | 20 | Property viewing requests |
| Quotes | 12 | Detailed construction quotes |
| Construction Requests | 10 | Multi-step project requests |
| Active Projects | 6 | Ongoing construction projects |
| Leads | 18 | Sales leads from various sources |
| Notifications | 15+ | System and user notifications |

## 🔐 Test User Accounts

All generated users have the password: `password123`

**Key Test Accounts:**
- **Admin**: `admin@greentech.africa`
- **Agent**: `kwame.asante@greentech.africa`
- **Builder**: `akosua.builder@greentech.africa`
- **Customer**: `customer1@example.com`

## 🌍 Regional Data

The generator creates realistic Ghana-specific data:

| Region | Capital | Cost Multiplier | Currency |
|--------|---------|----------------|----------|
| Greater Accra | Accra | 1.20x | GHS |
| Ashanti | Kumasi | 1.10x | GHS |
| Western | Sekondi-Takoradi | 1.05x | GHS |
| Eastern | Koforidua | 1.00x | GHS |
| Central | Cape Coast | 0.95x | GHS |
| Volta | Ho | 0.90x | GHS |
| Northern | Tamale | 0.85x | GHS |
| Upper East | Bolgatanga | 0.80x | GHS |

## 🏗️ Eco Features Generated

14 sustainable features across 7 categories:

**Solar Energy**
- Solar Panel System (5kW) - GHS 15,000
- Solar Water Heater - GHS 3,500

**Water Conservation**  
- Rainwater Harvesting System - GHS 5,000
- Greywater Recycling System - GHS 4,000

**Eco-friendly Materials**
- Bamboo Flooring - GHS 8,000
- Recycled Steel Framework - GHS 12,000

**Waste Management**
- Biogas Digester - GHS 6,000
- Composting System - GHS 1,500

**Sustainable Landscaping**
- Native Plant Garden - GHS 3,000
- Permaculture Design - GHS 5,000

**Insulation & Ventilation**
- Natural Ventilation System - GHS 2,000
- Eco-friendly Insulation - GHS 4,000

**Smart Home Technology**
- Smart Energy Management - GHS 7,000
- Smart Water Monitoring - GHS 3,000

## 🔄 Data Relationships

The generated data maintains proper relationships:

1. **Plans** → **Regional Pricing** (cost multipliers per region)
2. **Build Requests** → **Quotes** → **Line Items**
3. **Properties** → **Inquiries** → **Viewing Appointments**
4. **Construction Requests** → **Projects** → **Milestones**
5. **All Sources** → **Leads** → **Activities**
6. **Users** → **Notification Preferences**

## 🧪 Testing Scenarios

The demo data supports testing these user stories:

### **Customer Journey**
1. Browse building plans with regional pricing
2. Submit build request with customizations
3. Receive and review quotes
4. Track project progress and milestones
5. Browse and inquire about properties

### **Agent Workflow**
1. Manage incoming leads from multiple sources
2. Create and send quotes with line items
3. Schedule property viewings
4. Track lead conversion and activities
5. Manage property listings

### **Builder Operations**
1. Review construction requests
2. Manage project milestones and teams
3. Track sustainability metrics
4. Handle project documentation

### **Admin Functions**
1. Manage users and permissions
2. Configure regional pricing
3. Manage eco features catalog
4. Monitor platform activity

## 🚨 Important Notes

1. **Password**: All users have password `password123`
2. **Images**: Uses Unsplash placeholder URLs
3. **Emails**: Uses example.com domains for test users
4. **Phone Numbers**: Uses Ghana format (+233) with dummy numbers
5. **Addresses**: Generated addresses for testing only
6. **Pricing**: Realistic but not actual market prices

## 🔧 Customization

To modify the generated data:

1. **Edit the command**: `green_tech_backend/core/management/commands/generate_demo_data.py`
2. **Adjust quantities**: Change the ranges in each `create_*` method
3. **Modify data**: Update the data arrays with your preferred values
4. **Add new models**: Extend the command to include additional models

## 🐛 Troubleshooting

**Common Issues:**

1. **Import Errors**: Ensure all Django apps are in `INSTALLED_APPS`
2. **Database Errors**: Run migrations first: `python manage.py migrate`
3. **Permission Errors**: Ensure database write permissions
4. **Memory Issues**: Reduce the number of items generated

**Reset Everything:**
```bash
python manage.py flush --noinput
python manage.py migrate
python manage.py createsuperuser
python run_demo_data.py
```

## 📈 Next Steps

After generating demo data:

1. **Start the server**: `python manage.py runserver`
2. **Test the API**: Visit `http://localhost:8000/api/`
3. **Admin panel**: `http://localhost:8000/admin/`
4. **Frontend testing**: Use the data in your React applications
5. **API documentation**: `http://localhost:8000/swagger/`

The generated data provides a comprehensive foundation for developing and testing all aspects of the Green Tech Africa platform! 🌱