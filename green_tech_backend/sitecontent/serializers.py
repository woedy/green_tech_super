from __future__ import annotations

from rest_framework import serializers

from .models import DocumentStatus, SiteDocument, SiteDocumentVersion


class SiteDocumentVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SiteDocumentVersion
        fields = (
            'id',
            'version',
            'status',
            'title',
            'summary',
            'body',
            'preview_url',
            'created_at',
            'created_by',
            'created_by_name',
            'notes',
        )
        read_only_fields = ('version', 'created_at', 'created_by_name')

    def get_created_by_name(self, obj: SiteDocumentVersion) -> str:
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email or obj.created_by.username
        return ''

    def create(self, validated_data):
        request = self.context.get('request') if self.context else None
        if request and request.user.is_authenticated:
            validated_data.setdefault('created_by', request.user)
        return super().create(validated_data)


class SiteDocumentSerializer(serializers.ModelSerializer):
    versions = SiteDocumentVersionSerializer(many=True, read_only=True)
    current_version = SiteDocumentVersionSerializer(read_only=True)

    class Meta:
        model = SiteDocument
        fields = (
            'id',
            'slug',
            'title',
            'category',
            'description',
            'current_version',
            'created_at',
            'updated_at',
            'versions',
        )
        read_only_fields = ('created_at', 'updated_at', 'current_version', 'versions')


class SiteDocumentUpsertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteDocument
        fields = ('id', 'slug', 'title', 'category', 'description')

    def create(self, validated_data):
        return SiteDocument.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class SiteDocumentVersionCreateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=DocumentStatus.choices, default=DocumentStatus.DRAFT)

    class Meta:
        model = SiteDocumentVersion
        fields = ('id', 'document', 'status', 'title', 'summary', 'body', 'preview_url', 'notes')
        read_only_fields = ('id',)

    def create(self, validated_data):
        request = self.context.get('request') if self.context else None
        if request and request.user.is_authenticated:
            validated_data.setdefault('created_by', request.user)
        version = super().create(validated_data)
        return version
