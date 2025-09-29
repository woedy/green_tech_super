from __future__ import annotations

from decimal import Decimal

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from accounts.serializers import UserSerializer
from locations.models import Region
from plans.models import BuildRequest

from .models import (
    Quote,
    QuoteChatMessage,
    QuoteLineItem,
    QuoteMessageAttachment,
    QuoteMessageReceipt,
)


class QuoteLineItemSerializer(serializers.ModelSerializer):
    quantity = serializers.DecimalField(max_digits=8, decimal_places=2, coerce_to_string=False)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    calculated_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
        read_only=True,
    )

    class Meta:
        model = QuoteLineItem
        fields = (
            'id',
            'kind',
            'label',
            'quantity',
            'unit_cost',
            'apply_region_multiplier',
            'calculated_total',
            'position',
            'metadata',
        )
        read_only_fields = ('id', 'calculated_total')


class QuoteListSerializer(serializers.ModelSerializer):
    subtotal_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False, read_only=True)
    allowance_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False, read_only=True)
    adjustment_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False, read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False, read_only=True)
    regional_multiplier = serializers.DecimalField(max_digits=6, decimal_places=2, coerce_to_string=False, read_only=True)
    customer_name = serializers.CharField(source='recipient_name', read_only=True)
    customer_email = serializers.EmailField(source='recipient_email', read_only=True)
    plan_name = serializers.CharField(source='build_request.plan.name', read_only=True)
    plan_slug = serializers.CharField(source='build_request.plan.slug', read_only=True)
    build_request_summary = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = (
            'id',
            'reference',
            'status',
            'status_display',
            'currency_code',
            'regional_multiplier',
            'subtotal_amount',
            'allowance_amount',
            'adjustment_amount',
            'total_amount',
            'customer_name',
            'customer_email',
            'plan_name',
            'plan_slug',
            'build_request',
            'build_request_summary',
            'valid_until',
            'sent_at',
            'viewed_at',
            'accepted_at',
            'declined_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def get_build_request_summary(self, obj: Quote) -> dict[str, object]:
        request = obj.build_request
        return {
            'id': str(request.id),
            'plan': {
                'name': request.plan.name,
                'slug': request.plan.slug,
                'base_price': str(request.plan.base_price),
            },
            'region': {
                'name': request.region.name,
                'slug': request.region.slug,
                'currency': request.region.currency_code,
                'multiplier': str(request.region.cost_multiplier),
            },
            'contact': {
                'name': request.contact_name,
                'email': request.contact_email,
            },
        }


class QuoteDetailSerializer(QuoteListSerializer):
    items = QuoteLineItemSerializer(many=True, read_only=True)
    notes = serializers.CharField(read_only=True)
    terms = serializers.CharField(read_only=True)
    document_html = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()

    class Meta(QuoteListSerializer.Meta):
        fields = QuoteListSerializer.Meta.fields + (
            'notes',
            'terms',
            'prepared_by_name',
            'prepared_by_email',
            'recipient_name',
            'recipient_email',
            'items',
            'document_html',
            'timeline',
        )

    def get_document_html(self, obj: Quote) -> str:
        return obj.render_document()

    def get_timeline(self, obj: Quote) -> list[dict[str, object]]:
        entries = []
        for entry in obj.timeline():
            if entry.timestamp:
                entries.append(
                    {
                        'status': entry.status,
                        'label': entry.label,
                        'timestamp': entry.timestamp,
                    }
                )
        return entries


class QuoteWriteSerializer(serializers.ModelSerializer):
    items = QuoteLineItemSerializer(many=True)
    build_request = serializers.PrimaryKeyRelatedField(queryset=BuildRequest.objects.all())
    region = serializers.SlugRelatedField(
        slug_field='slug', queryset=Region.objects.all(), required=False, allow_null=True
    )
    regional_multiplier = serializers.DecimalField(
        max_digits=6, decimal_places=2, coerce_to_string=False, required=False
    )

    class Meta:
        model = Quote
        fields = (
            'id',
            'build_request',
            'region',
            'currency_code',
            'regional_multiplier',
            'notes',
            'terms',
            'prepared_by_name',
            'prepared_by_email',
            'recipient_name',
            'recipient_email',
            'valid_until',
            'items',
        )
        read_only_fields = ('id',)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(_('At least one line item is required.'))
        return value

    def _ensure_region_defaults(self, quote: Quote) -> None:
        if not quote.region_id:
            quote.region = quote.build_request.region
        region = quote.region

        provided_multiplier = self.initial_data.get('regional_multiplier', None)
        is_new = quote._state.adding
        if is_new:
            if provided_multiplier is not None:
                quote.regional_multiplier = Decimal(str(provided_multiplier))
            else:
                quote.regional_multiplier = Decimal(str(region.cost_multiplier))
        elif provided_multiplier is not None:
            quote.regional_multiplier = Decimal(str(provided_multiplier))
        else:
            quote.regional_multiplier = Decimal(str(quote.regional_multiplier))

        if not quote.currency_code:
            quote.currency_code = region.currency_code

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        region = validated_data.pop('region', None)
        quote = Quote(**validated_data)
        if region is not None:
            quote.region = region
        self._ensure_region_defaults(quote)
        quote.save()
        self._replace_items(quote, items_data)
        quote.recalculate_totals()
        return quote

    def update(self, instance: Quote, validated_data):
        items_data = validated_data.pop('items', None)
        region = validated_data.pop('region', None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        if region is not None:
            instance.region = region
        self._ensure_region_defaults(instance)
        instance.save()
        if items_data is not None:
            self._replace_items(instance, items_data)
        instance.recalculate_totals()
        return instance

    def _replace_items(self, quote: Quote, items_data: list[dict[str, object]]):
        quote.items.all().delete()
        for idx, payload in enumerate(items_data):
            payload = dict(payload)
            payload.pop('id', None)
            payload.pop('calculated_total', None)
            metadata = payload.pop('metadata', {}) or {}
            QuoteLineItem.objects.create(
                quote=quote,
                position=payload.get('position', idx),
                metadata=metadata,
                **payload,
            )


class QuoteActionSerializer(serializers.Serializer):
    signature_name = serializers.CharField(required=False, allow_blank=False, max_length=120)
    signature_email = serializers.EmailField(required=False, allow_blank=True)


class QuoteMessageReceiptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = QuoteMessageReceipt
        fields = ('user', 'read_at')
        read_only_fields = fields


class QuoteMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()
    receipts = QuoteMessageReceiptSerializer(many=True, read_only=True)

    class Meta:
        model = QuoteChatMessage
        fields = (
            'id',
            'quote',
            'sender',
            'body',
            'attachments',
            'metadata',
            'created_at',
            'edited_at',
            'receipts',
        )
        read_only_fields = ('quote', 'sender', 'created_at', 'edited_at', 'receipts', 'attachments')

    def get_attachments(self, obj: QuoteChatMessage) -> list[dict[str, object]]:
        return [
            {
                'id': attachment.id,
                'file': attachment.file.url if attachment.file else None,
                'uploaded_at': attachment.uploaded_at,
            }
            for attachment in obj.attachments.all()
        ]


# Backwards compatible alias for existing integrations (notifications, etc.).
QuoteSerializer = QuoteDetailSerializer
