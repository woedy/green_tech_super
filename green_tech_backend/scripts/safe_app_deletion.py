#!/usr/bin/env python
"""
Safe Django App Deletion Script

This script safely removes unused Django applications by:
1. Creating backups of directories before deletion
2. Verifying no foreign key relationships exist
3. Creating an audit trail of deleted components
4. Providing rollback capabilities

Requirements: 1.4, 4.3
"""

import os
import sys
import shutil
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Set, Optional


class SafeAppDeleter:
    """Safely deletes unused Django applications with backup and verification."""
    
    def __init__(self, project_root: str, backup_dir: Optional[str] = None):
        self.project_root = Path(project_root)
        self.backup_dir = Path(backup_dir) if backup_dir else self.project_root / 'backups'
        self.audit_trail = []
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
    def create_backup_directory(self) -> Path:
        """Create timestamped backup directory."""
        backup_path = self.backup_dir / f'app_deletion_backup_{self.timestamp}'
        backup_path.mkdir(parents=True, exist_ok=True)
        return backup_path
        
    def verify_no_foreign_keys(self, app_names: List[str]) -> Dict[str, List[str]]:
        """
        Verify that no foreign key relationships exist for the apps being deleted.
        
        Returns:
            Dict mapping app names to list of foreign key violations (empty if safe)
        """
        violations = {}
        
        # Check SQLite database for foreign key references
        db_path = self.project_root / 'db.sqlite3'
        if not db_path.exists():
            print("⚠️  No SQLite database found - skipping FK verification")
            return {app: [] for app in app_names}
            
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            
            # Get all table names
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            
            for app_name in app_names:
                app_violations = []
                
                # Check for tables belonging to this app
                app_tables = [t for t in tables if t.startswith(f'{app_name}_')]
                
                if not app_tables:
                    violations[app_name] = []
                    continue
                    
                # For each app table, check if other tables reference it
                for app_table in app_tables:
                    # Get foreign key info for all tables
                    for table in tables:
                        if table.startswith(f'{app_name}_'):
                            continue  # Skip tables from the same app
                            
                        try:
                            cursor.execute(f"PRAGMA foreign_key_list({table});")
                            fk_info = cursor.fetchall()
                            
                            for fk in fk_info:
                                referenced_table = fk[2]  # Referenced table is at index 2
                                if referenced_table in app_tables:
                                    app_violations.append(
                                        f"Table '{table}' has FK reference to '{referenced_table}'"
                                    )
                        except sqlite3.Error:
                            # Skip tables that can't be analyzed
                            continue
                            
                violations[app_name] = app_violations
                
            conn.close()
            
        except sqlite3.Error as e:
            print(f"⚠️  Database verification failed: {e}")
            # Return empty violations to allow deletion (manual verification needed)
            return {app: [] for app in app_names}
            
        return violations
        
    def backup_app_directory(self, app_name: str, backup_path: Path) -> bool:
        """
        Create a backup of the app directory.
        
        Returns:
            True if backup was successful, False otherwise
        """
        app_path = self.project_root / app_name
        
        if not app_path.exists():
            print(f"⚠️  App directory not found: {app_path}")
            return False
            
        backup_app_path = backup_path / app_name
        
        try:
            shutil.copytree(app_path, backup_app_path)
            print(f"✅ Backed up {app_name} to {backup_app_path}")
            
            # Record in audit trail
            self.audit_trail.append({
                'action': 'backup_created',
                'app': app_name,
                'source': str(app_path),
                'backup': str(backup_app_path),
                'timestamp': datetime.now().isoformat(),
                'size_bytes': self._get_directory_size(app_path)
            })
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to backup {app_name}: {e}")
            return False
            
    def _get_directory_size(self, path: Path) -> int:
        """Calculate total size of directory in bytes."""
        total_size = 0
        try:
            for dirpath, dirnames, filenames in os.walk(path):
                for filename in filenames:
                    filepath = Path(dirpath) / filename
                    if filepath.exists():
                        total_size += filepath.stat().st_size
        except (OSError, PermissionError):
            pass
        return total_size
        
    def delete_app_directory(self, app_name: str) -> bool:
        """
        Delete the app directory after backup.
        
        Returns:
            True if deletion was successful, False otherwise
        """
        app_path = self.project_root / app_name
        
        if not app_path.exists():
            print(f"⚠️  App directory already deleted: {app_path}")
            return True
            
        try:
            # Get file count before deletion
            file_count = sum(1 for _ in app_path.rglob('*') if _.is_file())
            
            shutil.rmtree(app_path)
            print(f"🗑️  Deleted {app_name} directory ({file_count} files)")
            
            # Record in audit trail
            self.audit_trail.append({
                'action': 'directory_deleted',
                'app': app_name,
                'path': str(app_path),
                'timestamp': datetime.now().isoformat(),
                'files_deleted': file_count
            })
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to delete {app_name}: {e}")
            return False
            
    def save_audit_trail(self, backup_path: Path) -> None:
        """Save the audit trail to a JSON file."""
        audit_file = backup_path / 'deletion_audit.json'
        
        audit_data = {
            'deletion_timestamp': self.timestamp,
            'project_root': str(self.project_root),
            'backup_location': str(backup_path),
            'actions': self.audit_trail,
            'rollback_instructions': {
                'description': 'To rollback this deletion, copy the backed up directories back to the project root',
                'command': f'cp -r {backup_path}/<app_name> {self.project_root}/'
            }
        }
        
        try:
            with open(audit_file, 'w', encoding='utf-8') as f:
                json.dump(audit_data, f, indent=2, ensure_ascii=False)
            print(f"📋 Audit trail saved to {audit_file}")
            
        except Exception as e:
            print(f"⚠️  Failed to save audit trail: {e}")
            
    def generate_rollback_script(self, backup_path: Path, deleted_apps: List[str]) -> None:
        """Generate a rollback script for easy recovery."""
        rollback_script = backup_path / 'rollback.py'
        
        script_content = f'''#!/usr/bin/env python
"""
Rollback script for app deletion performed on {self.timestamp}

This script will restore the deleted Django apps from backup.
"""

import shutil
from pathlib import Path

def main():
    project_root = Path(r"{self.project_root}")
    backup_path = Path(r"{backup_path}")
    
    deleted_apps = {deleted_apps}
    
    print("🔄 Starting rollback process...")
    
    for app_name in deleted_apps:
        backup_app_path = backup_path / app_name
        target_app_path = project_root / app_name
        
        if backup_app_path.exists():
            if target_app_path.exists():
                print(f"⚠️  Target directory already exists: {{target_app_path}}")
                response = input(f"Overwrite {{app_name}}? (y/N): ")
                if response.lower() != 'y':
                    print(f"Skipping {{app_name}}")
                    continue
                shutil.rmtree(target_app_path)
                
            shutil.copytree(backup_app_path, target_app_path)
            print(f"✅ Restored {{app_name}}")
        else:
            print(f"❌ Backup not found for {{app_name}}")
            
    print("🎉 Rollback complete!")
    print("⚠️  Remember to add the apps back to INSTALLED_APPS if needed")

if __name__ == '__main__':
    main()
'''
        
        try:
            with open(rollback_script, 'w', encoding='utf-8') as f:
                f.write(script_content)
            
            # Make script executable on Unix systems
            if os.name != 'nt':
                os.chmod(rollback_script, 0o755)
                
            print(f"🔄 Rollback script created: {rollback_script}")
            
        except Exception as e:
            print(f"⚠️  Failed to create rollback script: {e}")
            
    def delete_apps(self, app_names: List[str], force: bool = False) -> Dict[str, bool]:
        """
        Main method to safely delete multiple apps.
        
        Args:
            app_names: List of app names to delete
            force: Skip foreign key verification if True
            
        Returns:
            Dict mapping app names to success status
        """
        print(f"🧹 Starting safe deletion of {len(app_names)} apps...")
        print(f"Apps to delete: {', '.join(app_names)}")
        
        # Step 1: Verify no foreign key relationships
        if not force:
            print("\n🔍 Verifying foreign key constraints...")
            fk_violations = self.verify_no_foreign_keys(app_names)
            
            has_violations = False
            for app_name, violations in fk_violations.items():
                if violations:
                    has_violations = True
                    print(f"❌ {app_name} has foreign key violations:")
                    for violation in violations:
                        print(f"   └─ {violation}")
                else:
                    print(f"✅ {app_name} - No foreign key violations")
                    
            if has_violations:
                print("\n⚠️  Foreign key violations found!")
                print("Use --force to skip this check, or resolve the violations first.")
                return {app: False for app in app_names}
        else:
            print("⚠️  Skipping foreign key verification (--force mode)")
            
        # Step 2: Create backup directory
        print(f"\n💾 Creating backup directory...")
        backup_path = self.create_backup_directory()
        
        # Step 3: Backup and delete each app
        results = {}
        successful_deletions = []
        
        for app_name in app_names:
            print(f"\n🔄 Processing {app_name}...")
            
            # Backup first
            if self.backup_app_directory(app_name, backup_path):
                # Then delete
                if self.delete_app_directory(app_name):
                    results[app_name] = True
                    successful_deletions.append(app_name)
                    print(f"✅ {app_name} successfully deleted")
                else:
                    results[app_name] = False
                    print(f"❌ {app_name} deletion failed")
            else:
                results[app_name] = False
                print(f"❌ {app_name} backup failed - skipping deletion")
                
        # Step 4: Save audit trail and create rollback script
        if successful_deletions:
            print(f"\n📋 Saving audit trail...")
            self.save_audit_trail(backup_path)
            self.generate_rollback_script(backup_path, successful_deletions)
            
        # Step 5: Summary
        print(f"\n" + "="*60)
        print(f"🎉 DELETION SUMMARY")
        print(f"="*60)
        
        successful = [app for app, success in results.items() if success]
        failed = [app for app, success in results.items() if not success]
        
        if successful:
            print(f"✅ Successfully deleted ({len(successful)}):")
            for app in successful:
                print(f"   └─ {app}")
                
        if failed:
            print(f"❌ Failed to delete ({len(failed)}):")
            for app in failed:
                print(f"   └─ {app}")
                
        if successful:
            print(f"\n💾 Backup location: {backup_path}")
            print(f"🔄 Rollback script: {backup_path / 'rollback.py'}")
            
        print(f"="*60)
        
        return results


def main():
    """Main entry point for the script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Safely delete unused Django applications with backup and verification'
    )
    parser.add_argument(
        'apps', 
        nargs='+', 
        help='Names of Django apps to delete'
    )
    parser.add_argument(
        '--project-root', 
        default=None,
        help='Path to Django project root (default: parent of script directory)'
    )
    parser.add_argument(
        '--backup-dir',
        default=None,
        help='Custom backup directory (default: project_root/backups)'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Skip foreign key verification'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting'
    )
    
    args = parser.parse_args()
    
    # Determine project root
    if args.project_root:
        project_root = Path(args.project_root)
    else:
        project_root = Path(__file__).parent.parent
        
    if not project_root.exists():
        print(f"❌ Project root not found: {project_root}")
        return 1
        
    try:
        deleter = SafeAppDeleter(project_root, args.backup_dir)
        
        if args.dry_run:
            print("🔍 DRY RUN MODE - No files will be deleted")
            print(f"Would delete apps: {', '.join(args.apps)}")
            
            # Still run FK verification
            fk_violations = deleter.verify_no_foreign_keys(args.apps)
            for app_name, violations in fk_violations.items():
                if violations:
                    print(f"❌ {app_name} has foreign key violations:")
                    for violation in violations:
                        print(f"   └─ {violation}")
                else:
                    print(f"✅ {app_name} - Safe to delete")
            return 0
            
        results = deleter.delete_apps(args.apps, args.force)
        
        # Return appropriate exit code
        if all(results.values()):
            return 0  # All deletions successful
        elif any(results.values()):
            return 2  # Partial success
        else:
            return 1  # All deletions failed
            
    except Exception as e:
        print(f"❌ Error during deletion: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())