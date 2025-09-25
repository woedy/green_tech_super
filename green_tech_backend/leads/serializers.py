from __future__ import annotations

from rest_framework import serializers

from .models import Lead, LeadActivity, LeadNote, LeadPriority, LeadStatus


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = (
            'id',
            'title',
            'contact_name',
            'contact_email',
            'contact_phone',
            'status',
            'priority',
            'is_unread',
            'source_type',
            'source_id',
            'metadata',
            'created_at',
            'updated_at',
            'last_activity_at',
        )
        read_only_fields = fields


class LeadUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=LeadStatus.choices, required=False)
    priority = serializers.ChoiceField(choices=LeadPriority.choices, required=False)
    is_unread = serializers.BooleanField(required=False)


class LeadNoteSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = LeadNote
        fields = ('id', 'body', 'created_at', 'author')
        read_only_fields = ('id', 'created_at', 'author')

    def get_author(self, obj: LeadNote) -> str:
        if obj.created_by and (obj.created_by.get_full_name() or obj.created_by.email):
            return obj.created_by.get_full_name() or obj.created_by.email
        return 'System'


class LeadActivitySerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = LeadActivity
        fields = ('id', 'kind', 'message', 'metadata', 'created_at', 'author')
        read_only_fields = fields

    def get_author(self, obj: LeadActivity) -> str:
        if obj.created_by and (obj.created_by.get_full_name() or obj.created_by.email):
            return obj.created_by.get_full_name() or obj.created_by.email
        return 'System'
