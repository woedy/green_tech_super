#!/usr/bin/env python3
"""
Comprehensive test runner for Green Tech Africa platform.
Runs backend tests, frontend tests, and integration tests with Ghana market simulation.
"""
import os
import sys
import subprocess
import time
import signal
import threading
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.processes = []
        self.test_results = {}
        
    def run_command(self, command, cwd=None, timeout=300):
        """Run a command and return the result."""
        try:
            print(f"Running: {command}")
            if cwd:
                print(f"Working directory: {cwd}")
            
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'stdout': '',
                'stderr': f'Command timed out after {timeout} seconds',
                'returncode': -1
            }
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def get_venv_python_command(self):
        """Get the correct Python command for the virtual environment."""
        if os.name == 'nt':  # Windows
            return ".venv\\Scripts\\python.exe"
        else:  # Unix/Linux/macOS
            return ".venv/bin/python"
    
    def get_venv_activate_command(self):
        """Get the command to activate virtual environment."""
        if os.name == 'nt':  # Windows
            return ".venv\\Scripts\\activate"
        else:  # Unix/Linux/macOS
            return "source .venv/bin/activate"
    
    def run_backend_command(self, command, cwd="green_tech_backend", timeout=300):
        """Run a command in the backend with virtual environment activated."""
        venv_python = self.get_venv_python_command()
        
        # Replace 'python' with the venv python path
        if command.startswith('python '):
            command = command.replace('python ', f'{venv_python} ', 1)
        
        return self.run_command(command, cwd=cwd, timeout=timeout)
    
    def start_backend_server(self):
        """Start the Django backend server for testing."""
        print("Starting Django backend server...")
        
        # Check if virtual environment exists
        venv_path = Path("green_tech_backend/.venv")
        if not venv_path.exists():
            print("Virtual environment not found. Please create it first:")
            print("cd green_tech_backend && python -m venv .venv")
            print("Then activate it and install requirements:")
            print("pip install -r requirements.txt")
            return False
        
        # Run migrations first
        migrate_result = self.run_backend_command(
            "python manage.py migrate --run-syncdb"
        )
        
        if not migrate_result['success']:
            print("Failed to run migrations:")
            print(migrate_result['stderr'])
            return False
        
        # Start server in background
        venv_python = self.get_venv_python_command()
        server_process = subprocess.Popen(
            [venv_python, "manage.py", "runserver", "8000"],
            cwd="green_tech_backend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        self.processes.append(server_process)
        
        # Wait for server to start
        time.sleep(5)
        
        # Check if server is running
        try:
            import requests
            response = requests.get("http://localhost:8000/api/health/", timeout=10)
            if response.status_code == 200:
                print("Backend server started successfully")
                return True
        except:
            pass
        
        print("Failed to start backend server")
        return False    

    def run_backend_tests(self):
        """Run Django backend tests."""
        print("\n" + "="*50)
        print("RUNNING BACKEND TESTS")
        print("="*50)
        
        # Run Django tests with virtual environment
        result = self.run_backend_command(
            "python manage.py test --verbosity=2",
            timeout=600
        )
        
        self.test_results['backend'] = result
        
        if result['success']:
            print("✅ Backend tests passed")
        else:
            print("❌ Backend tests failed")
            print(result['stderr'])
        
        return result['success']
    
    def run_frontend_tests(self):
        """Run frontend tests for all portals."""
        print("\n" + "="*50)
        print("RUNNING FRONTEND TESTS")
        print("="*50)
        
        frontends = [
            ("green-tech-africa", "Customer Portal"),
            ("green-agent-frontend", "Agent Portal"),
            ("green-admin-frontend", "Admin Portal")
        ]
        
        all_passed = True
        
        for frontend_dir, name in frontends:
            print(f"\nTesting {name}...")
            
            # Install dependencies
            install_result = self.run_command(
                "npm install",
                cwd=frontend_dir
            )
            
            if not install_result['success']:
                print(f"❌ Failed to install dependencies for {name}")
                all_passed = False
                continue
            
            # Run tests
            test_result = self.run_command(
                "npm run test -- --run",
                cwd=frontend_dir,
                timeout=300
            )
            
            self.test_results[f'frontend_{frontend_dir}'] = test_result
            
            if test_result['success']:
                print(f"✅ {name} tests passed")
            else:
                print(f"❌ {name} tests failed")
                print(test_result['stderr'])
                all_passed = False
        
        return all_passed
    
    def run_e2e_tests(self):
        """Run end-to-end tests with Playwright."""
        print("\n" + "="*50)
        print("RUNNING END-TO-END TESTS")
        print("="*50)
        
        # Install Playwright if needed
        install_result = self.run_command(
            "npx playwright install",
            cwd="green-tech-africa"
        )
        
        if not install_result['success']:
            print("❌ Failed to install Playwright")
            return False
        
        # Run E2E tests
        result = self.run_command(
            "npx playwright test",
            cwd="green-tech-africa",
            timeout=900  # 15 minutes for E2E tests
        )
        
        self.test_results['e2e'] = result
        
        if result['success']:
            print("✅ End-to-end tests passed")
        else:
            print("❌ End-to-end tests failed")
            print(result['stderr'])
        
        return result['success']
    
    def run_ghana_simulation_tests(self):
        """Run Ghana market simulation tests."""
        print("\n" + "="*50)
        print("RUNNING GHANA MARKET SIMULATION TESTS")
        print("="*50)
        
        # Set environment variable for Ghana simulation
        env = os.environ.copy()
        env['GHANA_SIMULATION'] = 'true'
        
        # Run specific Ghana simulation tests
        result = self.run_command(
            "npx playwright test --grep 'Ghana Market Simulation'",
            cwd="green-tech-africa"
        )
        
        self.test_results['ghana_simulation'] = result
        
        if result['success']:
            print("✅ Ghana simulation tests passed")
        else:
            print("❌ Ghana simulation tests failed")
            print(result['stderr'])
        
        return result['success']
    
    def cleanup(self):
        """Clean up processes and resources."""
        print("\nCleaning up...")
        
        for process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        self.processes.clear()
    
    def print_summary(self):
        """Print test results summary."""
        print("\n" + "="*50)
        print("TEST RESULTS SUMMARY")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result['success'] else "❌ FAILED"
            print(f"{test_name.upper()}: {status}")
        
        print(f"\nOverall: {passed_tests}/{total_tests} test suites passed")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed!")
            return True
        else:
            print("💥 Some tests failed!")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence."""
        try:
            print("Green Tech Africa - Comprehensive Test Suite")
            print("=" * 50)
            
            # Start backend server
            if not self.start_backend_server():
                print("❌ Failed to start backend server")
                return False
            
            # Run tests in order
            tests = [
                ("Backend Tests", self.run_backend_tests),
                ("Frontend Tests", self.run_frontend_tests),
                ("End-to-End Tests", self.run_e2e_tests),
                ("Ghana Simulation Tests", self.run_ghana_simulation_tests),
            ]
            
            for test_name, test_func in tests:
                print(f"\nStarting {test_name}...")
                test_func()
            
            # Print summary
            return self.print_summary()
            
        except KeyboardInterrupt:
            print("\n\nTests interrupted by user")
            return False
        except Exception as e:
            print(f"\n\nUnexpected error: {e}")
            return False
        finally:
            self.cleanup()


def main():
    """Main entry point."""
    runner = TestRunner()
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\nReceived interrupt signal, cleaning up...")
        runner.cleanup()
        sys.exit(1)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Run tests
    success = runner.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()