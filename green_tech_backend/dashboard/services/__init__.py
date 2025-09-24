# This file makes the directory a Python package
from .dashboard_service import DashboardService

# Expose the get_consolidated_view method
get_consolidated_view = DashboardService.get_consolidated_view
