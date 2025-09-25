from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from celery import shared_task

User = get_user_model()


@shared_task
def send_verification_email(user_id: int) -> None:
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    backend_verify_path = reverse('v1:accounts:verify-email')
    api_link = f"{settings.SITE_URL.rstrip('/')}{backend_verify_path}"
    frontend_link = (
        f"{settings.FRONTEND_URL.rstrip('/')}/auth/verify?uid={uid}&token={token}"
    )

    subject = 'Verify your Green Tech Africa account'
    message = (
        'Welcome to Green Tech Africa!\n\n'
        'To activate your account, confirm your email using one of the options below:\n'
        f'- Visit the API verification endpoint: {api_link}\n'
        f'- Or click the link in your browser: {frontend_link}\n\n'
        'If you did not create an account, no action is required.'
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
