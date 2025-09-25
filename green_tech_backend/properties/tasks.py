from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import PropertyInquiry, ViewingAppointment, ViewingStatus

logger = logging.getLogger(__name__)


@shared_task
def send_inquiry_notifications(inquiry_id: str):
    inquiry = PropertyInquiry.objects.select_related('property', 'property__region').get(id=inquiry_id)
    subject = f"Inquiry received • {inquiry.property.title}"
    message = render_to_string('emails/property_inquiry_confirmation.txt', {'inquiry': inquiry})
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [inquiry.email])

    staff_email = getattr(settings, 'SALES_TEAM_EMAIL', settings.DEFAULT_FROM_EMAIL)
    staff_message = render_to_string('emails/property_inquiry_staff.txt', {'inquiry': inquiry})
    send_mail(subject, staff_message, settings.DEFAULT_FROM_EMAIL, [staff_email])

    appointment = inquiry.appointments.select_related('agent').first()
    if appointment:
        appointment.status = ViewingStatus.CONFIRMED
        appointment.save(update_fields=('status',))
        if appointment.agent:
            logger.info(
                "Viewing appointment confirmed for %s with agent %s", inquiry.property, appointment.agent
            )

    if inquiry.phone:
        sms_body = render_to_string('emails/property_inquiry_sms.txt', {'inquiry': inquiry})
        logger.info('SMS to %s: %s', inquiry.phone, sms_body)
