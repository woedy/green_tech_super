# Generated manually for eco-features consolidation
from django.db import migrations, models
import json


def migrate_eco_features_data(apps, schema_editor):
    """
    Migrate existing eco_features JSON data to PropertyEcoFeature relationships.
    """
    Property = apps.get_model('properties', 'Property')
    PropertyEcoFeature = apps.get_model('properties', 'PropertyEcoFeature')
    EcoFeature = apps.get_model('construction', 'EcoFeature')
    
    # Create a mapping of eco feature names to EcoFeature objects
    eco_feature_map = {}
    for feature in EcoFeature.objects.all():
        eco_feature_map[feature.name.lower()] = feature
    
    # Process each property with eco_features data
    for property_obj in Property.objects.exclude(eco_features__isnull=True).exclude(eco_features__exact=[]):
        if isinstance(property_obj.eco_features, list):
            for feature_name in property_obj.eco_features:
                if isinstance(feature_name, str):
                    # Try to find matching EcoFeature
                    feature_key = feature_name.lower().strip()
                    if feature_key in eco_feature_map:
                        # Create PropertyEcoFeature relationship if it doesn't exist
                        PropertyEcoFeature.objects.get_or_create(
                            property=property_obj,
                            eco_feature=eco_feature_map[feature_key]
                        )
                    else:
                        # Create a new EcoFeature if it doesn't exist
                        eco_feature, created = EcoFeature.objects.get_or_create(
                            name=feature_name.strip(),
                            defaults={
                                'category': 'MATERIALS',  # Default category
                                'description': f'Migrated from property: {property_obj.title}',
                                'is_available': True
                            }
                        )
                        if created:
                            eco_feature_map[feature_key] = eco_feature
                        
                        # Create the relationship
                        PropertyEcoFeature.objects.get_or_create(
                            property=property_obj,
                            eco_feature=eco_feature
                        )


def reverse_migrate_eco_features_data(apps, schema_editor):
    """
    Reverse migration: populate eco_features JSON field from PropertyEcoFeature relationships.
    """
    Property = apps.get_model('properties', 'Property')
    PropertyEcoFeature = apps.get_model('properties', 'PropertyEcoFeature')
    
    for property_obj in Property.objects.all():
        eco_features = []
        for prop_eco_feature in PropertyEcoFeature.objects.filter(property=property_obj):
            eco_features.append(prop_eco_feature.eco_feature.name)
        
        property_obj.eco_features = eco_features
        property_obj.save()


class Migration(migrations.Migration):
    dependencies = [
        ('properties', '0002_consolidate_eco_features'),
        ('construction', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            migrate_eco_features_data,
            reverse_migrate_eco_features_data
        ),
    ]