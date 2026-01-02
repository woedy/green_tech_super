#!/usr/bin/env python
"""
Database backup and rollback script for Green Tech Africa backend cleanup.

This script provides automated backup functionality before schema changes
and rollback procedures for each migration phase.
"""

import os
import sys
import json
import subprocess
import shutil
from datetime import datetime
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.management import call_command
from django.db import connection
from django.conf import settings


class DatabaseBackupManager:
    """Manages database backups and rollback procedures for cleanup operations."""
    
    def __init__(self):
        self.backup_dir = project_root / 'backups' / 'database_backups'
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
    def create_backup(self, phase_name):
        """
        Create a comprehensive backup before a cleanup phase.
        
        Args:
            phase_name (str): Name of the cleanup phase (e.g., 'phase2_model_consolidation')
            
        Returns:
            dict: Backup information including file paths and metadata
        """
        backup_info = {
            'phase': phase_name,
            'timestamp': self.timestamp,
            'database_engine': settings.DATABASES['default']['ENGINE'],
            'files': {},
            'migration_state': {}
        }
        
        phase_backup_dir = self.backup_dir / f"{phase_name}_{self.timestamp}"
        phase_backup_dir.mkdir(exist_ok=True)
        
        print(f"Creating backup for {phase_name}...")
        
        # 1. Database dump
        db_backup_file = self._create_database_dump(phase_backup_dir)
        backup_info['files']['database_dump'] = str(db_backup_file)
        
        # 2. Migration state snapshot
        migration_state = self._capture_migration_state()
        backup_info['migration_state'] = migration_state
        
        # 3. Save backup metadata
        metadata_file = phase_backup_dir / 'backup_metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(backup_info, f, indent=2)
        
        # 4. Create rollback script
        rollback_script = self._create_rollback_script(phase_backup_dir, backup_info)
        backup_info['files']['rollback_script'] = str(rollback_script)
        
        print(f"Backup completed: {phase_backup_dir}")
        return backup_info
    
    def _create_database_dump(self, backup_dir):
        """Create a database dump file."""
        db_config = settings.DATABASES['default']
        engine = db_config['ENGINE']
        
        if 'sqlite' in engine:
            return self._backup_sqlite(backup_dir, db_config)
        elif 'postgresql' in engine:
            return self._backup_postgresql(backup_dir, db_config)
        else:
            raise ValueError(f"Unsupported database engine: {engine}")
    
    def _backup_sqlite(self, backup_dir, db_config):
        """Backup SQLite database."""
        db_path = Path(db_config['NAME'])
        backup_file = backup_dir / f"database_{self.timestamp}.sqlite3"
        
        if db_path.exists():
            shutil.copy2(db_path, backup_file)
            print(f"SQLite database backed up to: {backup_file}")
        else:
            print("Warning: SQLite database file not found")
            
        return backup_file
    
    def _backup_postgresql(self, backup_dir, db_config):
        """Backup PostgreSQL database."""
        backup_file = backup_dir / f"database_{self.timestamp}.sql"
        
        # Build pg_dump command
        cmd = [
            'pg_dump',
            '--host', db_config.get('HOST', 'localhost'),
            '--port', str(db_config.get('PORT', 5432)),
            '--username', db_config['USER'],
            '--dbname', db_config['NAME'],
            '--file', str(backup_file),
            '--verbose',
            '--no-password'  # Assumes .pgpass or environment variables
        ]
        
        # Set password environment variable if provided
        env = os.environ.copy()
        if db_config.get('PASSWORD'):
            env['PGPASSWORD'] = db_config['PASSWORD']
        
        try:
            subprocess.run(cmd, env=env, check=True, capture_output=True, text=True)
            print(f"PostgreSQL database backed up to: {backup_file}")
        except subprocess.CalledProcessError as e:
            print(f"Error backing up PostgreSQL database: {e}")
            print(f"Command output: {e.stdout}")
            print(f"Command error: {e.stderr}")
            raise
            
        return backup_file
    
    def _capture_migration_state(self):
        """Capture the current state of all migrations."""
        from django.db.migrations.executor import MigrationExecutor
        from django.db.migrations.loader import MigrationLoader
        
        executor = MigrationExecutor(connection)
        loader = MigrationLoader(connection)
        
        migration_state = {}
        
        # Get applied migrations
        applied_migrations = executor.loader.applied_migrations
        
        for app_label in loader.migrated_apps:
            app_migrations = []
            for migration_name in loader.disk_migrations:
                if migration_name[0] == app_label:
                    is_applied = migration_name in applied_migrations
                    app_migrations.append({
                        'name': migration_name[1],
                        'applied': is_applied
                    })
            
            migration_state[app_label] = app_migrations
        
        return migration_state
    
    def _create_rollback_script(self, backup_dir, backup_info):
        """Create a rollback script for this backup."""
        rollback_script = backup_dir / 'rollback.py'
        
        script_content = f'''#!/usr/bin/env python
"""
Rollback script for {backup_info['phase']} backup created on {backup_info['timestamp']}.

This script will restore the database to the state before the cleanup phase.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.management import call_command
from django.conf import settings


def rollback_database():
    """Restore database from backup."""
    db_config = settings.DATABASES['default']
    engine = db_config['ENGINE']
    
    backup_file = Path(__file__).parent / "{Path(backup_info['files']['database_dump']).name}"
    
    if 'sqlite' in engine:
        # Restore SQLite database
        db_path = Path(db_config['NAME'])
        if backup_file.exists():
            shutil.copy2(backup_file, db_path)
            print(f"SQLite database restored from: {{backup_file}}")
        else:
            print(f"Error: Backup file not found: {{backup_file}}")
            return False
            
    elif 'postgresql' in engine:
        # Restore PostgreSQL database
        cmd = [
            'psql',
            '--host', db_config.get('HOST', 'localhost'),
            '--port', str(db_config.get('PORT', 5432)),
            '--username', db_config['USER'],
            '--dbname', db_config['NAME'],
            '--file', str(backup_file),
            '--quiet'
        ]
        
        # Set password environment variable if provided
        env = os.environ.copy()
        if db_config.get('PASSWORD'):
            env['PGPASSWORD'] = db_config['PASSWORD']
        
        try:
            # First, drop and recreate the database (requires superuser privileges)
            print("Warning: This will drop and recreate the database!")
            confirm = input("Are you sure you want to continue? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Rollback cancelled.")
                return False
                
            subprocess.run(cmd, env=env, check=True)
            print(f"PostgreSQL database restored from: {{backup_file}}")
        except subprocess.CalledProcessError as e:
            print(f"Error restoring PostgreSQL database: {{e}}")
            return False
    
    return True


def rollback_migrations():
    """Rollback migrations to the state before the cleanup phase."""
    migration_state = {json.dumps(backup_info['migration_state'], indent=8)}
    
    print("Rolling back migrations...")
    
    # This is a simplified rollback - in practice, you would need to
    # identify which migrations to rollback based on the phase
    apps_to_rollback = ['properties', 'locations', 'construction']
    
    for app in apps_to_rollback:
        if app in migration_state:
            # Find the last applied migration before the cleanup
            last_migration = None
            for migration in migration_state[app]:
                if migration['applied']:
                    last_migration = migration['name']
            
            if last_migration:
                try:
                    call_command('migrate', app, last_migration)
                    print(f"Rolled back {{app}} to {{last_migration}}")
                except Exception as e:
                    print(f"Error rolling back {{app}}: {{e}}")


if __name__ == '__main__':
    print("Starting rollback for {backup_info['phase']}...")
    
    # Rollback database
    if rollback_database():
        print("Database rollback completed successfully.")
    else:
        print("Database rollback failed.")
        sys.exit(1)
    
    # Rollback migrations
    rollback_migrations()
    
    print("Rollback completed.")
'''
        
        with open(rollback_script, 'w') as f:
            f.write(script_content)
        
        # Make script executable
        rollback_script.chmod(0o755)
        
        return rollback_script
    
    def list_backups(self):
        """List all available backups."""
        backups = []
        
        for backup_dir in self.backup_dir.iterdir():
            if backup_dir.is_dir():
                metadata_file = backup_dir / 'backup_metadata.json'
                if metadata_file.exists():
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    backups.append({
                        'path': str(backup_dir),
                        'metadata': metadata
                    })
        
        return sorted(backups, key=lambda x: x['metadata']['timestamp'], reverse=True)
    
    def verify_backup(self, backup_path):
        """Verify the integrity of a backup."""
        backup_dir = Path(backup_path)
        metadata_file = backup_dir / 'backup_metadata.json'
        
        if not metadata_file.exists():
            return False, "Metadata file not found"
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        # Check if database dump exists
        db_dump_path = Path(metadata['files']['database_dump'])
        if not db_dump_path.exists():
            return False, f"Database dump not found: {db_dump_path}"
        
        # Check if rollback script exists
        rollback_script_path = Path(metadata['files']['rollback_script'])
        if not rollback_script_path.exists():
            return False, f"Rollback script not found: {rollback_script_path}"
        
        return True, "Backup verification successful"


def main():
    """Main function for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database backup and rollback manager')
    parser.add_argument('action', choices=['backup', 'list', 'verify'], 
                       help='Action to perform')
    parser.add_argument('--phase', help='Phase name for backup')
    parser.add_argument('--path', help='Backup path for verification')
    
    args = parser.parse_args()
    
    manager = DatabaseBackupManager()
    
    if args.action == 'backup':
        if not args.phase:
            print("Error: --phase is required for backup action")
            sys.exit(1)
        
        backup_info = manager.create_backup(args.phase)
        print(f"Backup created successfully: {backup_info}")
    
    elif args.action == 'list':
        backups = manager.list_backups()
        if backups:
            print("Available backups:")
            for backup in backups:
                metadata = backup['metadata']
                print(f"  {metadata['phase']} - {metadata['timestamp']} - {backup['path']}")
        else:
            print("No backups found.")
    
    elif args.action == 'verify':
        if not args.path:
            print("Error: --path is required for verify action")
            sys.exit(1)
        
        is_valid, message = manager.verify_backup(args.path)
        print(f"Verification result: {message}")
        sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()