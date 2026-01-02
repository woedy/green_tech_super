# Design Document

## Overview

This design outlines a systematic approach to clean up the Green Tech Africa Django backend by removing unused applications, consolidating redundant models, and simplifying over-engineered components. The cleanup will be performed in three carefully orchestrated phases to ensure zero data loss and minimal risk to the production system.

## Architecture

### Current State Analysis

The backend currently contains 13 Django applications with significant redundancy:

**Core Applications (Keep - 9 apps):**
- `accounts` - User authentication and role management
- `locations` - Geographic regions and pricing zones  
- `plans` - Building plan catalog and build requests
- `properties` - Property listings and management
- `leads` - Lead capture and management system
- `quotes` - Quote generation and management
- `construction` - Project management and tracking
- `notifications` - Multi-channel notification system
- `sitecontent` - CMS for legal pages and content

**Unused Applications (Delete - 4 apps):**
- `community` - Never registered in INSTALLED_APPS, 500+ lines of dead code
- `dashboard` - Incomplete implementation, no models.py
- `finances` - Never registered, out of scope for MVP
- `sustainability` - Never registered, functionality duplicated elsewhere

### Target State Architecture

After cleanup, the backend will have 9 focused applications with clear boundaries and no redundant functionality. The consolidation will follow these principles:

1. **Single Source of Truth**: Each business concept represented by one canonical model
2. **Clear Separation**: Each app handles one distinct business domain
3. **Minimal Complexity**: Remove over-engineered file structures
4. **Data Preservation**: All existing data maintained through safe migrations

## Components and Interfaces

### Phase 1: Safe Deletion of Unused Apps

**Component**: Unused App Detector
- **Input**: Django project structure, INSTALLED_APPS, URL patterns
- **Output**: List of safe-to-delete applications
- **Interface**: Command-line verification script

**Component**: Dependency Analyzer  
- **Input**: Application directory, Python import statements
- **Output**: Cross-reference report showing no dependencies
- **Interface**: Static analysis tool

### Phase 2: Model Consolidation

**Component**: Eco-Features Consolidator
- **Current State**: 
  - `construction.ghana.models.EcoFeature` (proper model)
  - `properties.models.Property.eco_features` (JSON field)
  - `construction.models.ConstructionRequestEcoFeature` (junction table)
- **Target State**: Use EcoFeature model as single source of truth
- **Interface**: Data migration script

**Component**: Regional Data Merger
- **Current State**:
  - `locations.models.Region` (generic regions)
  - `construction.ghana.models.GhanaRegion` (Ghana-specific)
- **Target State**: Enhanced Region model with Ghana-specific fields
- **Interface**: Schema migration with data preservation

**Component**: Sustainability Field Consolidator
- **Current State**: Sustainability scores in Property, Project, and unused sustainability app
- **Target State**: Maintain in Property and Project models only
- **Interface**: Field removal migration

**Component**: Quote System Consolidator
- **Current State**:
  - `quotes.models.Quote` (build request quotes, customer-facing)
  - `construction.models.Quote` (construction project quotes, internal)
  - Duplicate functionality with different workflows
- **Target State**: Unified quote system with polymorphic relationships
- **Interface**: Model consolidation migration with workflow preservation

### Phase 3: Structural Simplification

**Component**: Construction App Simplifier
- **Current State**: 15+ utility files, excessive modularization
- **Target State**: Consolidated essential components
- **Interface**: File reorganization with import updates

## Data Models

### Enhanced Region Model (Post-Consolidation)

```python
class Region(models.Model):
    # Existing fields
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pricing_multiplier = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Consolidated Ghana-specific fields
    capital = models.CharField(max_length=100, blank=True)
    ghana_region_name = models.CharField(max_length=50, blank=True)
    local_materials_available = models.JSONField(default=list)
    
    class Meta:
        unique_together = ['name', 'country']
```

### Unified Quote Model (Post-Consolidation)

```python
class QuoteType(models.TextChoices):
    BUILD_REQUEST = 'BUILD_REQUEST', 'Build Request Quote'
    CONSTRUCTION_PROJECT = 'CONSTRUCTION_PROJECT', 'Construction Project Quote'

class Quote(models.Model):
    # Universal fields
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    reference = models.CharField(max_length=32, unique=True, editable=False)
    quote_type = models.CharField(max_length=20, choices=QuoteType.choices)
    status = models.CharField(max_length=20, choices=QuoteStatus.choices, default=QuoteStatus.DRAFT)
    
    # Polymorphic relationships
    build_request = models.ForeignKey('plans.BuildRequest', null=True, blank=True, on_delete=models.PROTECT)
    construction_request = models.ForeignKey('construction.ConstructionRequest', null=True, blank=True, on_delete=models.PROTECT)
    
    # Common quote fields
    region = models.ForeignKey('locations.Region', on_delete=models.PROTECT)
    currency_code = models.CharField(max_length=3, default='USD')
    regional_multiplier = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('1.00'))
    
    # Financial fields
    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Workflow fields
    version = models.PositiveIntegerField(default=1)
    parent_quote = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Timestamps and metadata
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(quote_type='BUILD_REQUEST', build_request__isnull=False, construction_request__isnull=True) |
                    models.Q(quote_type='CONSTRUCTION_PROJECT', build_request__isnull=True, construction_request__isnull=False)
                ),
                name='quote_type_consistency'
            )
        ]
```

### Simplified Property Model (Post-Cleanup)

```python
class Property(models.Model):
    # Core fields maintained
    title = models.CharField(max_length=200)
    location = models.ForeignKey(Region, on_delete=models.CASCADE)
    
    # Remove redundant eco_features JSON field
    # Use proper FK relationship via PropertyEcoFeature junction table
    
    # Keep sustainability_score (consolidated from multiple sources)
    sustainability_score = models.IntegerField(default=0)
```

### EcoFeature Junction Tables

```python
class PropertyEcoFeature(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    eco_feature = models.ForeignKey(EcoFeature, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['property', 'eco_feature']

class ConstructionRequestEcoFeature(models.Model):
    # Keep existing - already properly structured
    construction_request = models.ForeignKey(ConstructionRequest, on_delete=models.CASCADE)
    eco_feature = models.ForeignKey(EcoFeature, on_delete=models.CASCADE)
```

## Correctness Properties

Now I'll analyze the acceptance criteria for testability:

<function_calls>
<invoke name="prework">
<parameter name="featureName">backend-cleanup

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several redundant properties that can be consolidated:

- Properties about file deletion (1.4, 3.4, 3.5) can be combined into a comprehensive file management property
- Properties about data migration (2.3, 2.4, 2.5, 4.1, 4.2) can be consolidated into data preservation properties
- Properties about verification (5.1, 5.3, 7.2) can be combined into system integrity verification

The following properties represent the unique validation requirements after removing redundancy:

### Property 1: Unused App Detection Accuracy
*For any* Django project structure, when analyzing applications against INSTALLED_APPS and URL patterns, all apps not registered and not imported should be correctly identified as unused
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Safe App Deletion Completeness  
*For any* unused Django application, when performing deletion, the entire directory and all associated files should be removed while maintaining a backup list for recovery
**Validates: Requirements 1.4, 3.5**

### Property 3: Data Migration Preservation
*For any* model consolidation operation, all existing data should be preserved in the canonical location with no data loss during the migration process
**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 4.1, 4.2**

### Property 4: Experimental File Detection
*For any* codebase scan, files with experimental patterns ("_temp", "_new", etc.) and no active imports should be correctly identified for removal
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 5: Foreign Key Constraint Verification
*For any* app deletion operation, the system should verify no foreign key relationships exist before allowing deletion
**Validates: Requirements 4.3**

### Property 6: Backup and Rollback Capability
*For any* cleanup operation, database backups should be created beforehand and rollback procedures should successfully restore the previous state
**Validates: Requirements 4.4, 4.5, 7.3**

### Property 7: System Integrity Preservation
*For any* completed cleanup phase, all existing tests should pass and no broken imports should remain in the codebase
**Validates: Requirements 5.1, 5.3, 7.2**

### Property 8: API Backward Compatibility
*For any* model consolidation, all public API endpoints should maintain the same response structure and behavior
**Validates: Requirements 5.2, 5.4**

### Property 9: Quote System Consolidation
*For any* quote consolidation operation, both build request quotes and construction project quotes should be accessible through their respective workflows while using the unified underlying model
**Validates: Requirements 2.5, 5.2, 5.4**

### Property 10: Component Consolidation Correctness
*For any* over-engineered component, related functionality should be properly grouped while maintaining clear separation of concerns
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 11: Audit Trail Completeness
*For any* cleanup operation, comprehensive documentation should be generated including change summaries, consolidation mappings, and complexity metrics
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

## Error Handling

### Phase 1 Error Scenarios
- **Foreign Key Discovery**: If unused apps have unexpected FK relationships, halt deletion and report dependencies
- **Import Detection Failure**: If static analysis misses imports, provide manual verification step
- **File System Errors**: If deletion fails due to permissions, provide clear error messages and manual steps

### Phase 2 Error Scenarios  
- **Migration Failure**: If data migration fails, automatically rollback to previous state
- **Data Loss Detection**: If data counts don't match pre/post migration, halt and investigate
- **Schema Conflict**: If consolidated models have conflicting constraints, provide resolution options

### Phase 3 Error Scenarios
- **Import Breakage**: If file consolidation breaks imports, provide automatic import fixing
- **Test Failures**: If cleanup breaks existing tests, provide detailed failure analysis
- **API Changes**: If consolidation affects API responses, provide compatibility layer

### Rollback Procedures

**Phase 1 Rollback**: Restore deleted apps from backup directory
```bash
# Restore from backup
cp -r backup/unused_apps/* green_tech_backend/
# Re-add to INSTALLED_APPS if needed
```

**Phase 2 Rollback**: Use Django migration rollback
```bash
# Rollback migrations
python manage.py migrate app_name previous_migration
# Restore model definitions from git
git checkout HEAD~1 -- app_name/models.py
```

**Phase 3 Rollback**: Restore file structure from git
```bash
# Restore file organization
git checkout HEAD~1 -- construction/
# Reinstall dependencies if needed
pip install -r requirements.txt
```

## Testing Strategy

### Dual Testing Approach

This cleanup project requires both **unit tests** and **property-based tests** to ensure comprehensive validation:

**Unit Tests** will verify:
- Specific examples of app deletion (community, dashboard, finances, sustainability)
- Exact file removal scenarios (urls_new.py, project_views_temp.py)  
- Integration points between cleanup phases
- Error conditions and edge cases

**Property-Based Tests** will verify:
- Universal properties across all Django project structures
- Data preservation across various migration scenarios
- Import integrity across different codebase configurations
- API compatibility across different model consolidation patterns

### Property Test Configuration

Each property test will run a minimum of 100 iterations using **pytest-hypothesis** for Python property-based testing. Tests will be tagged with:

**Feature: backend-cleanup, Property 1: Unused App Detection Accuracy**
**Feature: backend-cleanup, Property 2: Safe App Deletion Completeness**
**Feature: backend-cleanup, Property 3: Data Migration Preservation**
**Feature: backend-cleanup, Property 4: Experimental File Detection**
**Feature: backend-cleanup, Property 5: Foreign Key Constraint Verification**
**Feature: backend-cleanup, Property 6: Backup and Rollback Capability**
**Feature: backend-cleanup, Property 7: System Integrity Preservation**
**Feature: backend-cleanup, Property 8: API Backward Compatibility**
**Feature: backend-cleanup, Property 9: Quote System Consolidation**
**Feature: backend-cleanup, Property 10: Component Consolidation Correctness**
**Feature: backend-cleanup, Property 11: Audit Trail Completeness**

### Testing Balance

- **Unit tests**: Focus on specific cleanup scenarios and error conditions
- **Property tests**: Verify universal correctness across all possible inputs
- **Integration tests**: Ensure frontend applications continue functioning
- **Manual verification**: Confirm business logic decisions are correct

The combination ensures both concrete bug detection (unit tests) and general correctness verification (property tests) for comprehensive coverage of the cleanup operations.