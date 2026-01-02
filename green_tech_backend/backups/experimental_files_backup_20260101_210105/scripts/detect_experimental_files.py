#!/usr/bin/env python3
"""
Experimental File Detection Script

This script scans the Django project for experimental files with patterns like:
- _temp, _new, _old, _backup suffixes
- experimental, temp, test patterns in filenames
- Verifies no active imports exist for detected files
- Creates removal script with backup capability

Requirements: 3.1, 3.2, 3.4
"""

import os
import re
import ast
import sys
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple
from datetime import datetime


class ExperimentalFileDetector:
    """Detects experimental files and analyzes their import dependencies."""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.experimental_patterns = [
            r'.*_temp\.py$',
            r'.*_new\.py$', 
            r'.*_old\.py$',
            r'.*_backup\.py$',
            r'.*_test\.py$',
            r'.*experimental.*\.py$',
            r'.*temp.*\.py$',
            r'.*draft.*\.py$',
            r'.*wip.*\.py$',  # work in progress
        ]
        self.detected_files = []
        self.import_references = {}
        
    def scan_for_experimental_files(self) -> List[Path]:
        """Scan project for files matching experimental patterns."""
        experimental_files = []
        
        # Scan all Python files in the project
        for py_file in self.project_root.rglob('*.py'):
            # Skip __pycache__ and .venv directories
            if '__pycache__' in str(py_file) or '.venv' in str(py_file):
                continue
                
            filename = py_file.name
            
            # Check against experimental patterns
            for pattern in self.experimental_patterns:
                if re.match(pattern, filename, re.IGNORECASE):
                    experimental_files.append(py_file)
                    break
                    
        self.detected_files = experimental_files
        return experimental_files
    
    def analyze_imports(self) -> Dict[str, List[str]]:
        """Analyze all Python files to find imports of experimental files."""
        import_map = {}
        
        # Get all Python files for analysis
        all_py_files = [f for f in self.project_root.rglob('*.py') 
                       if '__pycache__' not in str(f) and '.venv' not in str(f)]
        
        for py_file in all_py_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Parse AST to find imports
                tree = ast.parse(content)
                imports = self._extract_imports(tree)
                
                if imports:
                    import_map[str(py_file)] = imports
                    
            except (SyntaxError, UnicodeDecodeError) as e:
                print(f"Warning: Could not parse {py_file}: {e}")
                continue
                
        return import_map
    
    def _extract_imports(self, tree: ast.AST) -> List[str]:
        """Extract import statements from AST."""
        imports = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    for alias in node.names:
                        full_import = f"{node.module}.{alias.name}"
                        imports.append(full_import)
                        imports.append(node.module)  # Also track module imports
                        
        return imports
    
    def check_import_references(self) -> Dict[Path, List[str]]:
        """Check if experimental files have any import references."""
        import_map = self.analyze_imports()
        references = {}
        
        for exp_file in self.detected_files:
            file_references = []
            
            # Convert file path to potential import paths
            relative_path = exp_file.relative_to(self.project_root)
            
            # Generate possible import patterns
            import_patterns = self._generate_import_patterns(relative_path)
            
            # Check each file's imports
            for file_path, imports in import_map.items():
                for import_stmt in imports:
                    for pattern in import_patterns:
                        if pattern in import_stmt:
                            file_references.append(f"{file_path}: {import_stmt}")
            
            if file_references:
                references[exp_file] = file_references
                
        self.import_references = references
        return references
    
    def _generate_import_patterns(self, file_path: Path) -> List[str]:
        """Generate possible import patterns for a file."""
        patterns = []
        
        # Remove .py extension
        path_without_ext = file_path.with_suffix('')
        
        # Convert path separators to dots for Python imports
        import_path = str(path_without_ext).replace(os.sep, '.')
        patterns.append(import_path)
        
        # Also check for partial matches (module names)
        parts = import_path.split('.')
        for i in range(len(parts)):
            partial = '.'.join(parts[i:])
            patterns.append(partial)
            
        # Check for filename without path
        patterns.append(file_path.stem)
        
        return patterns
    
    def generate_report(self) -> Dict:
        """Generate comprehensive report of experimental files."""
        report = {
            'scan_timestamp': datetime.now().isoformat(),
            'project_root': str(self.project_root),
            'experimental_files': [],
            'safe_to_delete': [],
            'has_references': [],
            'summary': {
                'total_experimental': len(self.detected_files),
                'safe_to_delete': 0,
                'has_references': 0
            }
        }
        
        for exp_file in self.detected_files:
            file_info = {
                'path': str(exp_file),
                'relative_path': str(exp_file.relative_to(self.project_root)),
                'size_bytes': exp_file.stat().st_size,
                'modified': datetime.fromtimestamp(exp_file.stat().st_mtime).isoformat()
            }
            
            if exp_file in self.import_references:
                file_info['references'] = self.import_references[exp_file]
                file_info['safe_to_delete'] = False
                report['has_references'].append(file_info)
                report['summary']['has_references'] += 1
            else:
                file_info['references'] = []
                file_info['safe_to_delete'] = True
                report['safe_to_delete'].append(file_info)
                report['summary']['safe_to_delete'] += 1
                
            report['experimental_files'].append(file_info)
            
        return report
    
    def create_removal_script(self, output_path: str = None) -> str:
        """Create a script to safely remove experimental files."""
        if not output_path:
            output_path = self.project_root / 'scripts' / 'remove_experimental_files.py'
        
        safe_files = [f for f in self.detected_files if f not in self.import_references]
        
        script_content = f'''#!/usr/bin/env python3
"""
Experimental File Removal Script
Generated on: {datetime.now().isoformat()}

This script safely removes experimental files that have no import references.
It creates backups before deletion for potential recovery.
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# Files safe to delete (no import references found)
SAFE_TO_DELETE = [
{chr(10).join(f'    "{str(f.relative_to(self.project_root))}",' for f in safe_files)}
]

def create_backup(file_path: Path, backup_dir: Path):
    """Create backup of file before deletion."""
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Preserve directory structure in backup
    relative_path = file_path.relative_to(Path.cwd())
    backup_file = backup_dir / relative_path
    backup_file.parent.mkdir(parents=True, exist_ok=True)
    
    shutil.copy2(file_path, backup_file)
    print(f"Backed up: {{file_path}} -> {{backup_file}}")

def remove_experimental_files(create_backups=True):
    """Remove experimental files with optional backup."""
    project_root = Path(__file__).parent.parent
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = project_root / "backups" / f"experimental_files_backup_{{timestamp}}"
    
    removed_files = []
    
    for file_path_str in SAFE_TO_DELETE:
        file_path = project_root / file_path_str
        
        if not file_path.exists():
            print(f"File not found: {{file_path}}")
            continue
            
        if create_backups:
            create_backup(file_path, backup_dir)
            
        try:
            file_path.unlink()
            removed_files.append(str(file_path))
            print(f"Removed: {{file_path}}")
        except OSError as e:
            print(f"Error removing {{file_path}}: {{e}}")
            
    print(f"\\nRemoval complete. {{len(removed_files)}} files removed.")
    if create_backups and removed_files:
        print(f"Backups stored in: {{backup_dir}}")
        
    return removed_files

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--no-backup":
        remove_experimental_files(create_backups=False)
    else:
        remove_experimental_files(create_backups=True)
'''
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
            
        # Make script executable
        os.chmod(output_path, 0o755)
        
        return str(output_path)


def main():
    """Main execution function."""
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        # Default to current directory's parent (assuming we're in scripts/)
        project_root = Path(__file__).parent.parent
    
    detector = ExperimentalFileDetector(project_root)
    
    print("🔍 Scanning for experimental files...")
    experimental_files = detector.scan_for_experimental_files()
    
    if not experimental_files:
        print("✅ No experimental files found!")
        return
    
    print(f"📁 Found {len(experimental_files)} experimental files:")
    for f in experimental_files:
        print(f"  - {f.relative_to(detector.project_root)}")
    
    print("\n🔗 Analyzing import references...")
    references = detector.check_import_references()
    
    print("\n📊 Generating report...")
    report = detector.generate_report()
    
    # Save report
    report_path = detector.project_root / 'scripts' / 'experimental_files_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(f"📄 Report saved to: {report_path}")
    
    # Print summary
    print(f"\n📈 Summary:")
    print(f"  Total experimental files: {report['summary']['total_experimental']}")
    print(f"  Safe to delete: {report['summary']['safe_to_delete']}")
    print(f"  Has references: {report['summary']['has_references']}")
    
    if report['summary']['has_references'] > 0:
        print(f"\n⚠️  Files with references (NOT safe to delete):")
        for file_info in report['has_references']:
            print(f"  - {file_info['relative_path']}")
            for ref in file_info['references']:
                print(f"    Referenced in: {ref}")
    
    if report['summary']['safe_to_delete'] > 0:
        print(f"\n✅ Files safe to delete:")
        for file_info in report['safe_to_delete']:
            print(f"  - {file_info['relative_path']}")
        
        print("\n🛠️  Creating removal script...")
        script_path = detector.create_removal_script()
        print(f"📜 Removal script created: {script_path}")
        print("   Run with: python scripts/remove_experimental_files.py")
        print("   Run without backup: python scripts/remove_experimental_files.py --no-backup")


if __name__ == "__main__":
    main()