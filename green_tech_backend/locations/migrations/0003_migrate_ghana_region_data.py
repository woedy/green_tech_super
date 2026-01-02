# Generated manually for Ghana region data consolidation
from django.db import migrations


def migrate_ghana_region_data(apps, schema_editor):
    """
    Migrate GhanaRegion data to enhanced Region model.
    """
    Region = apps.get_model('locations', 'Region')
    
    # Try to get GhanaRegion model - it might not exist if already deleted
    try:
        GhanaRegion = apps.get_model('construction', 'GhanaRegion')
    except LookupError:
        # GhanaRegion model doesn't exist, skip migration
        return
    
    # Mapping of Ghana region names to display names
    region_name_mapping = {
        'GREATER_ACCRA': 'Greater Accra',
        'ASHANTI': 'Ashanti',
        'EASTERN': 'Eastern',
        'WESTERN': 'Western',
        'CENTRAL': 'Central',
        'VOLTA': 'Volta',
        'NORTHERN': 'Northern',
        'UPPER_EAST': 'Upper East',
        'UPPER_WEST': 'Upper West',
        'BRONG_AHAFO': 'Brong Ahafo',
        'OTI': 'Oti',
        'SAVANNAH': 'Savannah',
        'NORTH_EAST': 'North East',
        'WESTERN_NORTH': 'Western North',
        'AHAFO': 'Ahafo',
        'BONO_EAST': 'Bono East',
    }
    
    # Migrate each GhanaRegion to Region
    for ghana_region in GhanaRegion.objects.all():
        display_name = region_name_mapping.get(ghana_region.name, ghana_region.name)
        
        # Create or update Region with Ghana-specific data
        region, created = Region.objects.get_or_create(
            name=display_name,
            country='Ghana',
            defaults={
                'currency_code': 'GHS',
                'cost_multiplier': ghana_region.cost_multiplier,
                'capital': ghana_region.capital,
                'ghana_region_name': ghana_region.name,
                'local_materials_available': [],
                'is_active': ghana_region.is_active,
                'timezone': 'Africa/Accra'
            }
        )
        
        if not created:
            # Update existing region with Ghana-specific data
            region.capital = ghana_region.capital
            region.ghana_region_name = ghana_region.name
            region.cost_multiplier = ghana_region.cost_multiplier
            region.currency_code = 'GHS'
            region.is_active = ghana_region.is_active
            region.save()


def reverse_migrate_ghana_region_data(apps, schema_editor):
    """
    Reverse migration: recreate GhanaRegion data from Region model.
    """
    Region = apps.get_model('locations', 'Region')
    
    try:
        GhanaRegion = apps.get_model('construction', 'GhanaRegion')
    except LookupError:
        # GhanaRegion model doesn't exist, can't reverse
        return
    
    # Recreate GhanaRegion entries from Ghana regions
    for region in Region.objects.filter(country='Ghana'):
        if region.ghana_region_name:
            GhanaRegion.objects.get_or_create(
                name=region.ghana_region_name,
                defaults={
                    'capital': region.capital or '',
                    'cost_multiplier': region.cost_multiplier,
                    'is_active': region.is_active
                }
            )


class Migration(migrations.Migration):
    dependencies = [
        ('locations', '0002_add_ghana_specific_fields'),
        ('construction', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            migrate_ghana_region_data,
            reverse_migrate_ghana_region_data
        ),
    ]