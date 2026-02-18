from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    class Meta:
        model = UserProfile
        fields = (
            'bio',
            'company_name',
            'license_number',
            'years_of_experience',
            'website',
            'address',
            'city',
            'country',
            'facebook',
            'twitter',
            'linkedin',
            'instagram',
        )


class UserAdminSerializer(serializers.ModelSerializer):
    """Serializer for user admin list and detail views."""
    profile = UserProfileSerializer(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'user_type',
            'is_active',
            'is_verified',
            'is_staff',
            'is_superuser',
            'date_of_birth',
            'profile_picture',
            'created_at',
            'updated_at',
            'last_login',
            'profile',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_login')


class UserAdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users via admin."""
    password = serializers.CharField(write_only=True, required=False)
    profile = UserProfileSerializer(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = (
            'email',
            'password',
            'first_name',
            'last_name',
            'phone_number',
            'user_type',
            'is_active',
            'is_verified',
            'is_staff',
            'date_of_birth',
            'profile',
        )

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(_('A user with this email already exists.'))
        return email

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        # Create user
        if password:
            user = User.objects.create_user(password=password, **validated_data)
        else:
            # Generate random password if not provided
            import secrets
            random_password = secrets.token_urlsafe(16)
            user = User.objects.create_user(password=random_password, **validated_data)
        
        # Set is_staff for ADMIN users
        if user.user_type == 'ADMIN' and not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        
        # Create or update profile
        if profile_data:
            UserProfile.objects.update_or_create(
                user=user,
                defaults=profile_data
            )
        
        return user


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users via admin."""
    profile = UserProfileSerializer(required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = (
            'email',
            'password',
            'first_name',
            'last_name',
            'phone_number',
            'user_type',
            'is_active',
            'is_verified',
            'is_staff',
            'date_of_birth',
            'profile',
        )

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        # Check if email exists for a different user
        if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError(_('A user with this email already exists.'))
        return email

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        # Ensure ADMIN users have is_staff=True
        if instance.user_type == 'ADMIN' and not instance.is_staff:
            instance.is_staff = True
        
        instance.save()
        
        # Update or create profile
        if profile_data is not None:
            UserProfile.objects.update_or_create(
                user=instance,
                defaults=profile_data
            )
        
        return instance
