"""
URLs for the dashboard API.
"""
from django.urls import path
from .api.v1.views.dashboard import DashboardView, AnalyticsView
from .api.v1.views.consolidated import ConsolidatedView

app_name = 'dashboard'

urlpatterns = [
    # Dashboard endpoints
    path('', DashboardView.as_view(), name='dashboard'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('consolidated/', ConsolidatedView.as_view(), name='consolidated'),
]
