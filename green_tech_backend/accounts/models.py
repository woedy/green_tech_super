from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    """Custom user model manager where email is the unique identifier."""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user model for Green Tech Africa."""
    
    class UserType(models.TextChoices):
        CUSTOMER = 'CUSTOMER', _('Customer')
        AGENT = 'AGENT', _('Real Estate Agent')
        BUILDER = 'BUILDER', _('Builder/Contractor')
        ADMIN = 'ADMIN', _('Admin')
    
    username = None
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True)
    user_type = models.CharField(
        _('user type'),
        max_length=20,
        choices=UserType.choices,
        default=UserType.CUSTOMER
    )
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    profile_picture = models.ImageField(
        _('profile picture'),
        upload_to='profile_pics/',
        null=True,
        blank=True
    )
    is_verified = models.BooleanField(_('verified'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']


class UserProfile(models.Model):
    """Extended user profile information."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField(_('bio'), blank=True)
    company_name = models.CharField(_('company name'), max_length=100, blank=True)
    license_number = models.CharField(_('license number'), max_length=50, blank=True)
    years_of_experience = models.PositiveIntegerField(_('years of experience'), default=0)
    website = models.URLField(_('website'), blank=True)
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    country = models.CharField(_('country'), max_length=100, blank=True, default='Ghana')
    
    # Social media links
    facebook = models.URLField(_('facebook profile'), blank=True)
    twitter = models.URLField(_('twitter profile'), blank=True)
    linkedin = models.URLField(_('linkedin profile'), blank=True)
    instagram = models.URLField(_('instagram profile'), blank=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s profile"

    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')


class EmailVerificationOTP(models.Model):
    """OTP codes for email verification."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='verification_otps'
    )
    otp_code = models.CharField(_('OTP code'), max_length=4)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    expires_at = models.DateTimeField(_('expires at'))
    is_used = models.BooleanField(_('is used'), default=False)

    class Meta:
        verbose_name = _('email verification OTP')
        verbose_name_plural = _('email verification OTPs')
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP {self.otp_code} for {self.user.email}"

    def save(self, *args, **kwargs):
        # Set expiration time to 10 minutes from creation if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        """Check if OTP is valid (not expired and not used)."""
        return not self.is_used and timezone.now() <= self.expires_at

    def mark_as_used(self):
        """Mark OTP as used."""
        self.is_used = True
        self.save(update_fields=['is_used'])
