#!/usr/bin/env python3
"""
Experimental File Removal Script
Generated on: 2026-01-01T20:55:37.926659

This script safely removes experimental files that have no import references.
It creates backups before deletion for potential recovery.
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# Files safe to delete (no import references found)
SAFE_TO_DELETE = [
    "construction/urls_new.py",
    "notifications/minimal_test.py",
    "notifications/simple_test.py",
    "scripts/detect_experimental_files.py",
    "construction/api/project_views_temp.py",
]

def create_backup(file_path: Path, backup_dir: Path):
    """Create backup of file before deletion."""
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Preserve directory structure in backup
    relative_path = file_path.relative_to(Path.cwd())
    backup_file = backup_dir / relative_path
    backup_file.parent.mkdir(parents=True, exist_ok=True)
    
    shutil.copy2(file_path, backup_file)
    print(f"Backed up: {file_path} -> {backup_file}")

def remove_experimental_files(create_backups=True):
    """Remove experimental files with optional backup."""
    project_root = Path(__file__).parent.parent
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = project_root / "backups" / f"experimental_files_backup_{timestamp}"
    
    removed_files = []
    
    for file_path_str in SAFE_TO_DELETE:
        file_path = project_root / file_path_str
        
        if not file_path.exists():
            print(f"File not found: {file_path}")
            continue
            
        if create_backups:
            create_backup(file_path, backup_dir)
            
        try:
            file_path.unlink()
            removed_files.append(str(file_path))
            print(f"Removed: {file_path}")
        except OSError as e:
            print(f"Error removing {file_path}: {e}")
            
    print(f"\nRemoval complete. {len(removed_files)} files removed.")
    if create_backups and removed_files:
        print(f"Backups stored in: {backup_dir}")
        
    return removed_files

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--no-backup":
        remove_experimental_files(create_backups=False)
    else:
        remove_experimental_files(create_backups=True)
