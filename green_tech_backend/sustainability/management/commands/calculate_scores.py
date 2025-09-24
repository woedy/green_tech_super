from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from properties.models import Property
from construction.ghana.models import EcoFeature
from ...models import SustainabilityScore, SustainabilityFeatureImpact

class Command(BaseCommand):
    help = 'Calculate and update sustainability scores for properties based on their eco-features'

    def add_arguments(self, parser):
        parser.add_argument(
            '--property',
            type=int,
            help='ID of a specific property to calculate scores for',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Calculate scores for all properties',
        )

    def handle(self, *args, **options):
        property_id = options.get('property')
        process_all = options.get('all')

        if not (property_id or process_all):
            self.stdout.write(
                self.style.ERROR('Please specify --property ID or --all to process all properties')
            )
            return

        if property_id:
            try:
                properties = [Property.objects.get(id=property_id)]
                self.stdout.write(f'Calculating scores for property ID: {property_id}')
            except Property.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Property with ID {property_id} does not exist'))
                return
        else:
            properties = Property.objects.all()
            self.stdout.write(f'Calculating scores for all properties ({properties.count()} total)')

        total_updated = 0
        for property in properties:
            updated = self.calculate_property_scores(property)
            if updated:
                total_updated += 1
                if property_id:
                    self.stdout.write(self.style.SUCCESS(
                        f'Updated scores for property ID: {property.id} - {property.title}'
                    ))

        self.stdout.write(self.style.SUCCESS(
            f'Successfully updated scores for {total_updated} properties'
        ))

    def calculate_property_scores(self, property):
        """Calculate and update sustainability scores for a single property."""
        # Get all eco-features for this property
        eco_features = property.eco_features.all()
        
        if not eco_features.exists():
            # If no eco-features, set all scores to 0
            self.update_score(property, 'ENERGY', 0)
            self.update_score(property, 'WATER', 0)
            self.update_score(property, 'MATERIALS', 0)
            self.update_score(property, 'WASTE', 0)
            self.update_score(property, 'OVERALL', 0)
            return True
        
        # Get all impacts for the property's eco-features
        impacts = SustainabilityFeatureImpact.objects.filter(
            eco_feature__in=eco_features
        )
        
        if not impacts.exists():
            # If no impacts defined, set all scores to 0
            self.update_score(property, 'ENERGY', 0)
            self.update_score(property, 'WATER', 0)
            self.update_score(property, 'MATERIALS', 0)
            self.update_score(property, 'WASTE', 0)
            self.update_score(property, 'OVERALL', 0)
            return True
        
        from ..models import SustainabilityScore
        
        # Calculate base scores for each category
        energy_score = min(100, sum(imp.energy_impact for imp in impacts))
        water_score = min(100, sum(imp.water_impact for imp in impacts))
        materials_score = min(100, sum(imp.materials_impact for imp in impacts))
        waste_score = min(100, sum(imp.waste_impact for imp in impacts))
        
        # Calculate weighted overall score
        category_scores = {
            'ENERGY': energy_score,
            'WATER': water_score,
            'MATERIALS': materials_score,
            'WASTE': waste_score
        }
        overall_score = SustainabilityScore.calculate_overall_score(category_scores)
        
        # Determine certification level
        certification_level = SustainabilityScore.get_certification_level(overall_score)
        
        # Update scores
        with transaction.atomic():
            self.update_score(property, 'ENERGY', energy_score, {
                'features': [{
                    'id': imp.eco_feature.id,
                    'name': imp.eco_feature.name,
                    'impact': imp.energy_impact
                } for imp in impacts if imp.energy_impact > 0]
            })
            
            self.update_score(property, 'WATER', water_score, {
                'features': [{
                    'id': imp.eco_feature.id,
                    'name': imp.eco_feature.name,
                    'impact': imp.water_impact
                } for imp in impacts if imp.water_impact > 0]
            })
            
            self.update_score(property, 'MATERIALS', materials_score, {
                'features': [{
                    'id': imp.eco_feature.id,
                    'name': imp.eco_feature.name,
                    'impact': imp.materials_impact
                } for imp in impacts if imp.materials_impact > 0]
            })
            
            self.update_score(property, 'WASTE', waste_score, {
                'features': [{
                    'id': imp.eco_feature.id,
                    'name': imp.eco_feature.name,
                    'impact': imp.waste_impact
                } for imp in impacts if imp.waste_impact > 0]
            })
            
            # Update overall score with certification level and detailed breakdown
            self.update_score(property, 'OVERALL', overall_score, {
                'category_scores': {
                    'ENERGY': energy_score,
                    'WATER': water_score,
                    'MATERIALS': materials_score,
                    'WASTE': waste_score
                },
                'certification_level': certification_level,
                'calculated_at': timezone.now().isoformat(),
                'feature_breakdown': {
                    'energy': [{
                        'id': imp.eco_feature.id,
                        'name': imp.eco_feature.name,
                        'impact': imp.energy_impact,
                        'category': 'ENERGY'
                    } for imp in impacts if imp.energy_impact > 0],
                    'water': [{
                        'id': imp.eco_feature.id,
                        'name': imp.eco_feature.name,
                        'impact': imp.water_impact,
                        'category': 'WATER'
                    } for imp in impacts if imp.water_impact > 0],
                    'materials': [{
                        'id': imp.eco_feature.id,
                        'name': imp.eco_feature.name,
                        'impact': imp.materials_impact,
                        'category': 'MATERIALS'
                    } for imp in impacts if imp.materials_impact > 0],
                    'waste': [{
                        'id': imp.eco_feature.id,
                        'name': imp.eco_feature.name,
                        'impact': imp.waste_impact,
                        'category': 'WASTE'
                    } for imp in impacts if imp.waste_impact > 0]
                }
            })
        
        return True
    
    def update_score(self, property, category, score, details=None):
        """
        Update or create a sustainability score record.
        
        Args:
            property: Property instance
            category: Score category (e.g., 'ENERGY', 'WATER', 'OVERALL')
            score: Numeric score (0-100)
            details: Optional dictionary with additional score details
        """
        if details is None:
            details = {}
            
        # Add timestamp if not provided
        if 'calculated_at' not in details:
            details['calculated_at'] = timezone.now().isoformat()
            
        # Ensure score is within valid range
        score = max(0, min(100, score))
        
        # Update or create the score record
        SustainabilityScore.objects.update_or_create(
            property=property,
            category=category,
            defaults={
                'score': round(score, 2),  # Store with 2 decimal places
                'max_possible': 100,
                'details': details,
                'last_updated': timezone.now()
            }
        )
        
        # If this is an overall score, update the property's cached score
        if category == 'OVERALL':
            property.sustainability_score = score
            property.save(update_fields=['sustainability_score', 'updated_at'])
            
            # Log the score update
            self.stdout.write(
                self.style.SUCCESS(
                    f'Updated {category} score for property {property.id} to {score}%'
                )
            )
