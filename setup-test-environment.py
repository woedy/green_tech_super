#!/usr/bin/env python3
"""
Setup script for Green Tech Africa test environment.
Creates virtual environments and installs dependencies.
"""
import os
import sys
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return success status."""
    try:
        print(f"Running: {command}")
        if cwd:
            print(f"Working directory: {cwd}")
        
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Command failed with return code {e.returncode}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def setup_backend():
    """Set up the Django backend environment."""
    print("\n" + "="*50)
    print("SETTING UP BACKEND ENVIRONMENT")
    print("="*50)
    
    backend_dir = Path("green_tech_backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Create virtual environment
    venv_path = backend_dir / ".venv"
    if not venv_path.exists():
        print("Creating virtual environment...")
        if not run_command("python -m venv .venv", cwd=backend_dir):
            return False
    else:
        print("Virtual environment already exists")
    
    # Determine activation command and python path
    if os.name == 'nt':  # Windows
        activate_cmd = ".venv\\Scripts\\activate"
        python_cmd = ".venv\\Scripts\\python.exe"
        pip_cmd = ".venv\\Scripts\\pip.exe"
    else:  # Unix/Linux/macOS
        activate_cmd = "source .venv/bin/activate"
        python_cmd = ".venv/bin/python"
        pip_cmd = ".venv/bin/pip"
    
    # Install requirements
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        print("Installing Python dependencies...")
        if not run_command(f"{pip_cmd} install -r requirements.txt", cwd=backend_dir):
            return False
    else:
        print("⚠️  requirements.txt not found, installing basic dependencies...")
        basic_deps = [
            "django>=4.2",
            "djangorestframework",
            "channels",
            "channels-redis",
            "django-cors-headers",
            "django-filter",
            "celery",
            "redis",
            "python-dotenv",
            "pillow",
            "requests"
        ]
        
        for dep in basic_deps:
            if not run_command(f"{pip_cmd} install {dep}", cwd=backend_dir):
                print(f"Failed to install {dep}")
                return False
    
    # Run migrations
    print("Running database migrations...")
    if not run_command(f"{python_cmd} manage.py migrate", cwd=backend_dir):
        return False
    
    print("✅ Backend environment setup complete")
    return True

def setup_frontend(frontend_dir, name):
    """Set up a frontend environment."""
    print(f"\nSetting up {name}...")
    
    if not Path(frontend_dir).exists():
        print(f"❌ {frontend_dir} directory not found!")
        return False
    
    # Install npm dependencies
    if not run_command("npm install", cwd=frontend_dir):
        return False
    
    print(f"✅ {name} setup complete")
    return True

def setup_frontends():
    """Set up all frontend environments."""
    print("\n" + "="*50)
    print("SETTING UP FRONTEND ENVIRONMENTS")
    print("="*50)
    
    frontends = [
        ("green-tech-africa", "Customer Portal"),
        ("green-agent-frontend", "Agent Portal"),
        ("green-admin-frontend", "Admin Portal")
    ]
    
    all_success = True
    for frontend_dir, name in frontends:
        if not setup_frontend(frontend_dir, name):
            all_success = False
    
    return all_success

def setup_playwright():
    """Set up Playwright for E2E testing."""
    print("\n" + "="*50)
    print("SETTING UP PLAYWRIGHT")
    print("="*50)
    
    # Install Playwright in the main frontend
    if not run_command("npm install -D @playwright/test", cwd="green-tech-africa"):
        return False
    
    # Install Playwright browsers
    if not run_command("npx playwright install", cwd="green-tech-africa"):
        return False
    
    print("✅ Playwright setup complete")
    return True

def create_env_files():
    """Create example environment files."""
    print("\n" + "="*50)
    print("CREATING ENVIRONMENT FILES")
    print("="*50)
    
    # Backend .env
    backend_env = Path("green_tech_backend/.env")
    if not backend_env.exists():
        env_content = """# Django settings
DJANGO_SECRET_KEY=dev-secret-key-for-testing
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,testserver

# Database (SQLite for development)
# POSTGRES_DB=
# POSTGRES_USER=
# POSTGRES_PASSWORD=
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432

# Redis/Celery
REDIS_URL=redis://localhost:6379/0
CELERY_TASK_ALWAYS_EAGER=true

# CORS
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Email (console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@greentechafrica.com
"""
        backend_env.write_text(env_content)
        print("Created backend .env file")
    
    # Frontend .env files
    frontend_dirs = ["green-tech-africa", "green-agent-frontend", "green-admin-frontend"]
    for frontend_dir in frontend_dirs:
        frontend_env = Path(f"{frontend_dir}/.env")
        if not frontend_env.exists():
            env_content = """# API Configuration
VITE_API_URL=http://localhost:8000

# WebSocket Configuration
VITE_WS_URL=ws://localhost:8000

# Environment
NODE_ENV=development
"""
            frontend_env.write_text(env_content)
            print(f"Created {frontend_dir} .env file")
    
    print("✅ Environment files created")
    return True

def main():
    """Main setup function."""
    print("Green Tech Africa - Test Environment Setup")
    print("=" * 50)
    
    try:
        # Check Python version
        if sys.version_info < (3, 8):
            print("❌ Python 3.8 or higher is required")
            return False
        
        # Check if Node.js is available
        try:
            subprocess.run(["node", "--version"], check=True, capture_output=True)
            subprocess.run(["npm", "--version"], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ Node.js and npm are required")
            return False
        
        # Setup steps
        steps = [
            ("Create environment files", create_env_files),
            ("Setup backend", setup_backend),
            ("Setup frontends", setup_frontends),
            ("Setup Playwright", setup_playwright),
        ]
        
        for step_name, step_func in steps:
            print(f"\n🔄 {step_name}...")
            if not step_func():
                print(f"❌ Failed: {step_name}")
                return False
        
        print("\n" + "="*50)
        print("🎉 SETUP COMPLETE!")
        print("="*50)
        print("\nYou can now run tests with:")
        print("  python test-runner.py")
        print("\nOr run individual components:")
        print("  Backend: cd green_tech_backend && .venv/bin/python manage.py runserver")
        print("  Customer: cd green-tech-africa && npm run dev")
        print("  Agent: cd green-agent-frontend && npm run dev")
        print("  Admin: cd green-admin-frontend && npm run dev")
        
        return True
        
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user")
        return False
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)