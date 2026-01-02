#!/usr/bin/env python
"""
Unused Django App Detection Script

This script analyzes the Django project to identify unused applications by:
1. Comparing INSTALLED_APPS with filesystem directories
2. Analyzing URL pattern imports to detect unused imports
3. Cross-referencing import dependencies across the codebase

Requirements: 1.1, 1.2, 1.3
"""

import os
import sys
import ast
import re
from pathlib import Path
from typing import Set, Dict, List, Tuple


class UnusedAppDetector:
    """Detects unused Django applications in the project."""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.installed_apps = set()
        self.filesystem_apps = set()
        self.url_imported_apps = set()
        self.cross_referenced_apps = set()
        
    def load_installed_apps(self) -> Set[str]:
        """Extract INSTALLED_APPS from Django settings."""
        settings_path = self.project_root / 'core' / 'settings.py'
        
        if not settings_path.exists():
            raise FileNotFoundError(f"Settings file not found: {settings_path}")
            
        with open(settings_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse the Python file to extract INSTALLED_APPS
        tree = ast.parse(content)
        
        for node in ast.walk(tree):
            if (isinstance(node, ast.Assign) and 
                len(node.targets) == 1 and 
                isinstance(node.targets[0], ast.Name) and 
                node.targets[0].id == 'INSTALLED_APPS'):
                
                if isinstance(node.value, ast.List):
                    for item in node.value.elts:
                        if isinstance(item, ast.Constant) and isinstance(item.value, str):
                            app_name = item.value
                            # Extract just the app name (before .apps.Config)
                            if '.apps.' in app_name:
                                app_name = app_name.split('.apps.')[0]
                            # Skip Django core and third-party apps
                            if not app_name.startswith('django.') and not self._is_third_party_app(app_name):
                                self.installed_apps.add(app_name)
                                
        return self.installed_apps
    
    def _is_third_party_app(self, app_name: str) -> bool:
        """Check if an app is a third-party package."""
        third_party_apps = {
            'channels', 'corsheaders', 'django_filters', 'drf_yasg', 
            'rest_framework', 'rest_framework_simplejwt'
        }
        return app_name in third_party_apps
    
    def scan_filesystem_apps(self) -> Set[str]:
        """Scan filesystem for Django app directories."""
        for item in self.project_root.iterdir():
            if (item.is_dir() and 
                not item.name.startswith('.') and 
                not item.name.startswith('__') and
                item.name not in {'core', 'templates', 'static', 'media', 'scripts', 'docker'}):
                
                # Check if it looks like a Django app (has apps.py or models.py)
                if (item / 'apps.py').exists() or (item / 'models.py').exists():
                    self.filesystem_apps.add(item.name)
                    
        return self.filesystem_apps
    
    def analyze_url_imports(self) -> Set[str]:
        """Analyze URL patterns to find imported apps."""
        urls_path = self.project_root / 'core' / 'urls.py'
        
        if not urls_path.exists():
            return self.url_imported_apps
            
        with open(urls_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Look for include() patterns that reference app URLs
        include_patterns = re.findall(r"include\(\s*['\"]([^'\"]+)\.urls['\"]", content)
        include_patterns.extend(re.findall(r"include\(\s*\(\s*['\"]([^'\"]+)\.urls['\"]", content))
        
        for pattern in include_patterns:
            # Extract app name from patterns like 'app.urls' or 'app.api.urls'
            app_name = pattern.split('.')[0]
            if app_name in self.filesystem_apps:
                self.url_imported_apps.add(app_name)
                
        return self.url_imported_apps
    
    def check_cross_references(self) -> Set[str]:
        """Check for cross-references between apps (imports, foreign keys, etc.)."""
        for app_dir in self.filesystem_apps:
            app_path = self.project_root / app_dir
            
            # Check all Python files in the app
            for py_file in app_path.rglob('*.py'):
                if py_file.name == '__pycache__':
                    continue
                    
                try:
                    with open(py_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Look for imports from other apps
                    for other_app in self.filesystem_apps:
                        if other_app != app_dir:
                            # Check for various import patterns
                            patterns = [
                                rf"from {other_app}",
                                rf"import {other_app}",
                                rf"'{other_app}\.",  # Foreign key references
                                rf'"{other_app}\.',  # Foreign key references
                            ]
                            
                            for pattern in patterns:
                                if re.search(pattern, content):
                                    self.cross_referenced_apps.add(other_app)
                                    break
                                    
                except (UnicodeDecodeError, PermissionError):
                    # Skip files that can't be read
                    continue
                    
        return self.cross_referenced_apps
    
    def detect_unused_apps(self) -> Dict[str, List[str]]:
        """Main method to detect unused apps and return detailed analysis."""
        print("🔍 Analyzing Django project structure...")
        
        # Load data
        self.load_installed_apps()
        self.scan_filesystem_apps()
        self.analyze_url_imports()
        self.check_cross_references()
        
        # Determine unused apps
        unused_apps = self.filesystem_apps - self.installed_apps
        
        # Further filter by checking URL imports and cross-references
        truly_unused = set()
        for app in unused_apps:
            if (app not in self.url_imported_apps and 
                app not in self.cross_referenced_apps):
                truly_unused.add(app)
        
        # Generate detailed report
        report = {
            'unused_apps': list(truly_unused),
            'filesystem_apps': list(self.filesystem_apps),
            'installed_apps': list(self.installed_apps),
            'url_imported_apps': list(self.url_imported_apps),
            'cross_referenced_apps': list(self.cross_referenced_apps),
            'analysis': []
        }
        
        # Add detailed analysis for each app
        for app in self.filesystem_apps:
            status = "UNUSED"
            reasons = []
            
            if app in self.installed_apps:
                status = "INSTALLED"
                reasons.append("Listed in INSTALLED_APPS")
            
            if app in self.url_imported_apps:
                status = "URL_IMPORTED"
                reasons.append("URLs imported in main urls.py")
                
            if app in self.cross_referenced_apps:
                status = "CROSS_REFERENCED"
                reasons.append("Referenced by other apps")
                
            if not reasons:
                reasons.append("No references found - safe to delete")
                
            report['analysis'].append({
                'app': app,
                'status': status,
                'reasons': reasons
            })
            
        return report
    
    def print_report(self, report: Dict) -> None:
        """Print a formatted report of the analysis."""
        print("\n" + "="*60)
        print("🧹 UNUSED DJANGO APPS DETECTION REPORT")
        print("="*60)
        
        print(f"\n📊 SUMMARY:")
        print(f"   • Total apps in filesystem: {len(report['filesystem_apps'])}")
        print(f"   • Apps in INSTALLED_APPS: {len(report['installed_apps'])}")
        print(f"   • Apps with URL imports: {len(report['url_imported_apps'])}")
        print(f"   • Apps with cross-references: {len(report['cross_referenced_apps'])}")
        print(f"   • Unused apps found: {len(report['unused_apps'])}")
        
        if report['unused_apps']:
            print(f"\n🗑️  UNUSED APPS (Safe to delete):")
            for app in report['unused_apps']:
                print(f"   ❌ {app}")
        else:
            print(f"\n✅ No unused apps found!")
            
        print(f"\n📋 DETAILED ANALYSIS:")
        for analysis in report['analysis']:
            status_emoji = {
                'UNUSED': '❌',
                'INSTALLED': '✅', 
                'URL_IMPORTED': '🔗',
                'CROSS_REFERENCED': '🔄'
            }.get(analysis['status'], '❓')
            
            print(f"   {status_emoji} {analysis['app']:<15} - {analysis['status']}")
            for reason in analysis['reasons']:
                print(f"      └─ {reason}")
                
        print("\n" + "="*60)


def main():
    """Main entry point for the script."""
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        # Default to current directory's parent (assuming script is in scripts/)
        project_root = Path(__file__).parent.parent
        
    try:
        detector = UnusedAppDetector(project_root)
        report = detector.detect_unused_apps()
        detector.print_report(report)
        
        # Return appropriate exit code
        if report['unused_apps']:
            print(f"\n💡 Found {len(report['unused_apps'])} unused apps that can be safely deleted.")
            return 0
        else:
            print(f"\n✨ All apps are being used - no cleanup needed!")
            return 0
            
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())