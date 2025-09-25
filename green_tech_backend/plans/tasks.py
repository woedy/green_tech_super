from __future__ import annotations

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import BuildRequest


@shared_task
def dispatch_build_request_confirmation(build_request_id: str):
    request = BuildRequest.objects.select_related('plan', 'region').get(id=build_request_id)
    subject = f"We received your request for {request.plan.name}"
    message = render_to_string(
        'emails/build_request_confirmation.txt',
        {
            'request': request,
        },
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [request.contact_email])


@shared_task
def dispatch_build_request_internal_alert(build_request_id: str):
    request = BuildRequest.objects.select_related('plan', 'region').get(id=build_request_id)
    subject = f"New build request • {request.plan.name}"
    message = render_to_string(
        'emails/build_request_internal_alert.txt',
        {
            'request': request,
        },
    )
    staff_email = getattr(settings, 'SALES_TEAM_EMAIL', settings.DEFAULT_FROM_EMAIL)
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [staff_email])
