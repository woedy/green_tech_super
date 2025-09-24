"""
Serializers for the consolidated view API.
"""
from rest_framework import serializers


class ActionSerializer(serializers.Serializer):
    """Serializer for action items."""
    label = serializers.CharField()
    url = serializers.URLField()


class ConsolidatedItemSerializer(serializers.Serializer):
    """Base serializer for items in the consolidated view."""
    type = serializers.CharField()
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    last_updated = serializers.DateTimeField()
    image = serializers.URLField(allow_null=True)
    url = serializers.URLField()
    actions = serializers.ListField(child=ActionSerializer())


class ProjectItemSerializer(ConsolidatedItemSerializer):
    """Serializer for project items in the consolidated view."""
    progress = serializers.IntegerField(min_value=0, max_value=100)


class PropertyItemSerializer(ConsolidatedItemSerializer):
    """Serializer for property items in the consolidated view."""
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    location = serializers.CharField()


class ConsolidatedViewSerializer(serializers.Serializer):
    """Serializer for the consolidated view response."""
    count = serializers.IntegerField(min_value=0)
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = serializers.ListField(child=serializers.DictField())
    
    def to_representation(self, instance):
        """Custom representation to handle different item types."""
        ret = super().to_representation(instance)
        
        # Serialize each result with the appropriate serializer based on type
        serialized_results = []
        for item in ret['results']:
            if item.get('type') == 'project':
                serializer = ProjectItemSerializer(data=item)
            elif item.get('type') == 'property':
                serializer = PropertyItemSerializer(data=item)
            else:
                continue
                
            if serializer.is_valid(raise_exception=True):
                serialized_results.append(serializer.validated_data)
        
        ret['results'] = serialized_results
        return ret
