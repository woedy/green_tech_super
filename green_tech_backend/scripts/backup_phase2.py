#!/usr/bin/env python
"""
Convenience script to create a backup before Phase 2 model consolidation.
"""

import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from database_backup import DatabaseBackupManager


def main():
    """Create backup for Phase 2 model consolidation."""
    print("Creating backup before Phase 2 - Model Consolidation and Data Migration...")
    
    manager = DatabaseBackupManager()
    
    try:
        backup_info = manager.create_backup('phase2_model_consolidation')
        
        print("\n" + "="*60)
        print("BACKUP COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"Phase: {backup_info['phase']}")
        print(f"Timestamp: {backup_info['timestamp']}")
        print(f"Database dump: {backup_info['files']['database_dump']}")
        print(f"Rollback script: {backup_info['files']['rollback_script']}")
        print("\nTo rollback this phase, run:")
        print(f"python {backup_info['files']['rollback_script']}")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"\nERROR: Backup failed: {e}")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)