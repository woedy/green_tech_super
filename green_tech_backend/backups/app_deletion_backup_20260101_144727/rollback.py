#!/usr/bin/env python
"""
Rollback script for app deletion performed on 20260101_144727

This script will restore the deleted Django apps from backup.
"""

import shutil
from pathlib import Path

def main():
    project_root = Path(r"C:\Users\Mawu\Desktop\GilbyProjects\SuperProjects\green_tech_super\green_tech_super\green_tech_backend")
    backup_path = Path(r"C:\Users\Mawu\Desktop\GilbyProjects\SuperProjects\green_tech_super\green_tech_super\green_tech_backend\backups\app_deletion_backup_20260101_144727")
    
    deleted_apps = ['community', 'dashboard', 'finances', 'sustainability']
    
    print("🔄 Starting rollback process...")
    
    for app_name in deleted_apps:
        backup_app_path = backup_path / app_name
        target_app_path = project_root / app_name
        
        if backup_app_path.exists():
            if target_app_path.exists():
                print(f"⚠️  Target directory already exists: {target_app_path}")
                response = input(f"Overwrite {app_name}? (y/N): ")
                if response.lower() != 'y':
                    print(f"Skipping {app_name}")
                    continue
                shutil.rmtree(target_app_path)
                
            shutil.copytree(backup_app_path, target_app_path)
            print(f"✅ Restored {app_name}")
        else:
            print(f"❌ Backup not found for {app_name}")
            
    print("🎉 Rollback complete!")
    print("⚠️  Remember to add the apps back to INSTALLED_APPS if needed")

if __name__ == '__main__':
    main()
