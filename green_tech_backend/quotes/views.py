from __future__ import annotations
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Quote, QuoteChatMessage, QuoteMessageReceipt, QuoteStatus
from .permissions import QuoteChatAccessPermission
from .notifications import notify_quote_chat_message
from .realtime import broadcast_quote_message
from .serializers import (
    QuoteActionSerializer,
    QuoteDetailSerializer,
    QuoteListSerializer,
    QuoteMessageSerializer,
    QuoteWriteSerializer,
)
from .services import handle_quote_event


class QuoteViewSet(viewsets.ModelViewSet):
    permission_classes = (AllowAny,)
    http_method_names = ['get', 'post', 'patch', 'put']
    queryset = Quote.objects.select_related(
        'build_request__plan', 'build_request__region', 'region'
    ).prefetch_related('items')

    def get_serializer_class(self):
        if self.action in {'create', 'update', 'partial_update'}:
            return QuoteWriteSerializer
        if self.action == 'retrieve':
            return QuoteDetailSerializer
        return QuoteListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        status_param = request.query_params.get('status')
        build_request = request.query_params.get('build_request')
        customer_email = request.query_params.get('customer_email')
        if status_param:
            queryset = queryset.filter(status=status_param)
        if build_request:
            queryset = queryset.filter(build_request_id=build_request)
        if customer_email:
            queryset = queryset.filter(build_request__contact_email__iexact=customer_email)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = QuoteWriteSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        quote = serializer.save()
        detail = QuoteDetailSerializer(quote, context=self.get_serializer_context())
        headers = self.get_success_headers(detail.data)
        return Response(detail.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = QuoteWriteSerializer(
            instance, data=request.data, partial=partial, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        quote = serializer.save()
        detail = QuoteDetailSerializer(quote, context=self.get_serializer_context())
        return Response(detail.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        quote = self.get_object()
        if quote.status in {QuoteStatus.ACCEPTED, QuoteStatus.DECLINED}:
            return Response(
                {'detail': 'Accepted or declined quotes cannot be re-sent.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        quote.recalculate_totals()
        quote.mark_sent()
        handle_quote_event(quote, 'sent')
        return Response(QuoteDetailSerializer(quote, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'], url_path='view')
    def mark_viewed(self, request, pk=None):
        quote = self.get_object()
        quote.mark_viewed()
        handle_quote_event(quote, 'viewed')
        return Response(QuoteDetailSerializer(quote, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        quote = self.get_object()
        if quote.status == QuoteStatus.ACCEPTED:
            return Response(
                {'detail': 'Quote already accepted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = QuoteActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        signature_name = serializer.validated_data.get('signature_name') or quote.recipient_name
        signature_email = serializer.validated_data.get('signature_email') or quote.recipient_email
        if not signature_name:
            return Response({'detail': 'Signature name required.'}, status=status.HTTP_400_BAD_REQUEST)
        quote.mark_accepted(signature_name, signature_email)
        handle_quote_event(quote, 'accepted')
        return Response(QuoteDetailSerializer(quote, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        quote = self.get_object()
        if quote.status == QuoteStatus.ACCEPTED:
            return Response(
                {'detail': 'Accepted quotes cannot be declined.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        quote.mark_declined()
        handle_quote_event(quote, 'declined')
        return Response(QuoteDetailSerializer(quote, context=self.get_serializer_context()).data)


class QuoteMessageViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """API endpoints for listing and creating quote chat messages."""

    serializer_class = QuoteMessageSerializer
    permission_classes = (IsAuthenticated, QuoteChatAccessPermission)

    def _quote_queryset(self):
        return Quote.objects.select_related('build_request__user')

    def _message_queryset(self):
        return QuoteChatMessage.objects.select_related('quote', 'sender').prefetch_related(
            'attachments',
            'receipts__user',
        )

    def get_quote(self):
        if not hasattr(self, '_quote'):
            quote = get_object_or_404(self._quote_queryset(), pk=self.kwargs['quote_pk'])
            self.check_object_permissions(self.request, quote)
            self._quote = quote
        return self._quote

    def get_queryset(self):
        quote = self.get_quote()
        return self._message_queryset().filter(quote=quote).order_by('created_at')

    def perform_create(self, serializer):
        quote = self.get_quote()
        user = self.request.user
        message = serializer.save(quote=quote, sender=user)
        QuoteMessageReceipt.objects.update_or_create(
            message=message,
            user=user,
            defaults={'read_at': timezone.now()},
        )
        broadcast_quote_message(message)
        notify_quote_chat_message(message)
        return message

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = self.perform_create(serializer)
        message = self._message_queryset().get(pk=message.pk)
        output = self.get_serializer(message)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)
