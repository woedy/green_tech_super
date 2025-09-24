"""
Serializers for the dashboard API.
"""
from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """Base serializer for dashboard statistics."""
    role = serializers.CharField(read_only=True)
    
    class Meta:
        fields = ['role']


class AdminDashboardStatsSerializer(DashboardStatsSerializer):
    """Serializer for admin dashboard statistics."""
    total_properties = serializers.IntegerField()
    active_construction_requests = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    total_users = serializers.IntegerField()
    
    class Meta(DashboardStatsSerializer.Meta):
        fields = DashboardStatsSerializer.Meta.fields + [
            'total_properties',
            'active_construction_requests',
            'active_projects',
            'total_users',
        ]


class AgentDashboardStatsSerializer(DashboardStatsSerializer):
    """Serializer for agent dashboard statistics."""
    total_properties = serializers.IntegerField()
    active_listings = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    recent_inquiries = serializers.IntegerField()
    
    class Meta(DashboardStatsSerializer.Meta):
        fields = DashboardStatsSerializer.Meta.fields + [
            'total_properties',
            'active_listings',
            'pending_requests',
            'recent_inquiries',
        ]


class CustomerDashboardStatsSerializer(DashboardStatsSerializer):
    """Serializer for customer dashboard statistics."""
    saved_searches = serializers.IntegerField()
    active_inquiries = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    total_requests = serializers.IntegerField()
    
    class Meta(DashboardStatsSerializer.Meta):
        fields = DashboardStatsSerializer.Meta.fields + [
            'saved_searches',
            'active_inquiries',
            'active_projects',
            'total_requests',
        ]


class QuickActionSerializer(serializers.Serializer):
    """Serializer for quick action items."""
    label = serializers.CharField()
    url = serializers.URLField()


class AnalyticsDataPointSerializer(serializers.Serializer):
    """Serializer for analytics data points."""
    date = serializers.DateField()
    count = serializers.IntegerField()


class AnalyticsDataSerializer(serializers.Serializer):
    """Serializer for analytics data."""
    timeframe = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    property_views = AnalyticsDataPointSerializer(many=True)
    new_users = AnalyticsDataPointSerializer(many=True)
    construction_requests = AnalyticsDataPointSerializer(many=True)
