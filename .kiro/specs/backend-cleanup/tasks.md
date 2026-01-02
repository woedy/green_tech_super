# Implementation Plan: Backend Cleanup

## Overview

This implementation plan systematically cleans up the Green Tech Africa Django backend through three carefully orchestrated phases. Each phase builds on the previous one, with verification checkpoints to ensure data integrity and system stability throughout the process.

## Tasks

- [x] 1. Phase 1 - Safe Deletion of Unused Applications
  - Create Python scripts to analyze and safely remove unused Django apps
  - Verify zero dependencies before deletion
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Create unused app detection script
  - Write Python script to scan INSTALLED_APPS vs filesystem directories
  - Implement URL pattern analysis to detect unused imports
  - Add cross-reference checking for import dependencies
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.2 Write property test for unused app detection
  - **Property 1: Unused App Detection Accuracy**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1.3 Create safe app deletion script
  - Implement directory removal with backup creation
  - Add verification of no foreign key relationships
  - Create audit trail of deleted components
  - _Requirements: 1.4, 4.3_

- [ ]* 1.4 Write property test for safe app deletion
  - **Property 2: Safe App Deletion Completeness**
  - **Validates: Requirements 1.4, 3.5**

- [ ]* 1.5 Write property test for foreign key verification
  - **Property 5: Foreign Key Constraint Verification**
  - **Validates: Requirements 4.3**

- [x] 1.6 Execute Phase 1 deletion
  - Run detection script to identify unused apps
  - Verify community/, dashboard/, finances/, sustainability/ are safe to delete
  - Execute deletion with backup creation
  - _Requirements: 1.5_

- [x] 1.7 Phase 1 Checkpoint - Verify deletion success
  - Ensure all tests pass, ask the user if questions arise.

- [-] 2. Phase 2 - Model Consolidation and Data Migration
  - Consolidate redundant models while preserving all data
  - Create safe database migrations for schema changes
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Create eco-features consolidation migration
  - Remove Property.eco_features JSON field
  - Create PropertyEcoFeature junction table
  - Migrate existing eco-features data to proper FK relationships
  - _Requirements: 2.2_

- [ ]* 2.2 Write property test for eco-features consolidation
  - **Property 3: Data Migration Preservation**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 2.3 Create regional data consolidation migration
  - Add Ghana-specific fields to Region model
  - Migrate GhanaRegion data to enhanced Region model
  - Remove GhanaRegion model after data migration
  - _Requirements: 2.3_

- [x] 2.4 Create sustainability field consolidation
  - Audit sustainability fields across Property and Project models
  - Remove redundant sustainability scoring fields
  - Preserve data in canonical locations
  - _Requirements: 2.4_

- [x] 2.5 Create quote system consolidation migration
  - Analyze quotes app and construction app quote models
  - Design unified quote model with polymorphic relationships
  - Create migration to consolidate quote data
  - Preserve both build request and construction project workflows
  - _Requirements: 2.5_

- [ ]* 2.6 Write property test for quote system consolidation
  - **Property 9: Quote System Consolidation**
  - **Validates: Requirements 2.5, 5.2, 5.4**

- [ ]* 2.7 Write property test for data migration preservation
  - Test data counts match before/after migration
  - Verify no data loss during consolidation
  - **Validates: Requirements 2.5, 4.1, 4.2**

- [x] 2.6 Create database backup script
  - Implement automated backup before schema changes
  - Create rollback procedures for each migration
  - _Requirements: 4.4, 4.5_

- [ ]* 2.8 Write property test for backup and rollback
  - **Property 6: Backup and Rollback Capability**
  - **Validates: Requirements 4.4, 4.5, 7.3**

- [x] 2.9 Execute Phase 2 migrations
  - Create database backup
  - Run eco-features consolidation migration
  - Run regional data consolidation migration
  - Run sustainability field consolidation
  - Run quote system consolidation migration
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 2.10 Phase 2 Checkpoint - Verify data integrity
  - Ensure all tests pass, ask the user if questions arise.

- [-] 3. Phase 3 - Structural Simplification
  - Simplify over-engineered components and file structures
  - Remove experimental files and unused utilities
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_

- [x] 3.1 Create experimental file detection script
  - Scan for files with "_temp", "_new", experimental patterns
  - Verify no active imports exist for detected files
  - Create removal script with backup capability
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 3.2 Write property test for experimental file detection
  - **Property 4: Experimental File Detection**
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [x] 3.3 Remove specific experimental files
  - Delete construction/urls_new.py
  - Delete construction/api/project_views_temp.py
  - Verify no broken imports remain
  - _Requirements: 3.3_

- [-] 3.4 Consolidate construction app structure
  - Audit 15+ utility files in construction app
  - Merge related serializers and views
  - Remove unused utility modules
  - Maintain clear separation of concerns
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 3.5 Write property test for component consolidation
  - **Property 10: Component Consolidation Correctness**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 3.6 Update API endpoints for consolidated models
  - Ensure API responses remain consistent
  - Maintain backward compatibility
  - Update serializers for consolidated models
  - _Requirements: 5.2, 5.4_

- [ ]* 3.7 Write property test for API compatibility
  - **Property 8: API Backward Compatibility**
  - **Validates: Requirements 5.2, 5.4**

- [ ] 3.8 Execute Phase 3 simplification
  - Run experimental file detection and removal
  - Execute construction app consolidation
  - Update API endpoints
  - _Requirements: 3.3, 6.4_

- [ ] 3.9 Phase 3 Checkpoint - Verify system integrity
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Final Integration and Documentation
  - Verify complete system functionality
  - Generate comprehensive cleanup documentation
  - _Requirements: 5.1, 5.3, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4.1 Run comprehensive system verification
  - Execute full test suite
  - Verify no broken imports remain
  - Test frontend application functionality
  - _Requirements: 5.1, 5.3, 5.5_

- [ ]* 4.2 Write property test for system integrity
  - **Property 7: System Integrity Preservation**
  - **Validates: Requirements 5.1, 5.3, 7.2**

- [ ] 4.3 Generate cleanup documentation
  - Create summary of all changes made
  - Document model consolidation mappings
  - List all removed components
  - Generate before/after complexity metrics
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 4.4 Write property test for audit trail completeness
  - **Property 11: Audit Trail Completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 4.5 Create rollback documentation
  - Document rollback procedures for each phase
  - Create emergency recovery scripts
  - Test rollback procedures in development
  - _Requirements: 7.3_

- [ ] 4.6 Final Checkpoint - Complete cleanup verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster execution
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user review
- Property tests validate universal correctness properties across all scenarios
- Unit tests validate specific examples and edge cases
- All database operations include backup and rollback procedures
- Phase dependencies must be respected - each phase builds on the previous one
- Quote system consolidation preserves both build request and construction project workflows while eliminating code duplication