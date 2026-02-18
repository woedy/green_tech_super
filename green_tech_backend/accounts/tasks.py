from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from celery import shared_task
import random

User = get_user_model()


@shared_task
def send_verification_email(user_id: int) -> None:
    """Send OTP verification email to user."""
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return

    # Import here to avoid circular imports
    from .models import EmailVerificationOTP

    # Generate 4-digit OTP
    otp_code = ''.join([str(random.randint(0, 9)) for _ in range(4)])

    # Invalidate any existing unused OTPs for this user
    EmailVerificationOTP.objects.filter(user=user, is_used=False).update(is_used=True)

    # Create new OTP
    EmailVerificationOTP.objects.create(user=user, otp_code=otp_code)

    subject = 'Your Green Tech Africa Verification Code'
    message = (
        f'Welcome to Green Tech Africa!\n\n'
        f'Your verification code is: {otp_code}\n\n'
        f'This code will expire in 10 minutes.\n\n'
        f'If you did not create an account, please ignore this email.'
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
