# Generated manually for sustainability field consolidation audit
from django.db import migrations


def audit_sustainability_fields(apps, schema_editor):
    """
    Audit sustainability fields across Property and Project models.
    
    This migration documents that sustainability fields have been audited
    and confirmed to be in their canonical locations:
    
    Property model:
    - sustainability_score: Overall sustainability score (0-100)
    - energy_rating: Energy efficiency rating (1-5)
    - water_rating: Water efficiency rating (1-5)
    
    Project model:
    - sustainability_score: Overall project sustainability score (0-100)
    - energy_efficiency_rating: Project energy efficiency (1-5)
    - water_efficiency_rating: Project water efficiency (1-5)
    - co2_emissions_saved: CO2 emissions saved in tons
    - water_saved: Water saved in cubic meters
    
    ConstructionRequest model:
    - target_sustainability_score: Target overall score (0-100)
    - target_energy_rating: Target energy rating (1-5)
    - target_water_rating: Target water rating (1-5)
    
    The redundant sustainability fields were in the deleted 'sustainability' app
    which contained over-engineered SustainabilityScore models that duplicated
    the simpler, more maintainable fields in the core models.
    """
    # This is a documentation-only migration
    pass


def reverse_audit_sustainability_fields(apps, schema_editor):
    """Reverse migration - no action needed."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('properties', '0004_remove_eco_features_json_field'),
        ('construction', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            audit_sustainability_fields,
            reverse_audit_sustainability_fields
        ),
    ]