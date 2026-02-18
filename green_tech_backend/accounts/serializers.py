from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'user_type',
            'is_verified',
        )
        read_only_fields = ('id', 'is_verified')


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'email',
            'password',
            'confirm_password',
            'first_name',
            'last_name',
            'phone_number',
            'user_type',
        )

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(_('A user with this email already exists.'))
        return email

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.pop('confirm_password', None)
        if password != confirm_password:
            raise serializers.ValidationError({'confirm_password': _('Passwords do not match.')})
        validate_password(password)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user_type = validated_data.get('user_type')
        
        user = User.objects.create_user(password=password, **validated_data)
        
        # Set is_staff=True for ADMIN users to enable admin permissions
        if user_type == 'ADMIN':
            user.is_staff = True
        
        # New users must verify their email before gaining access
        user.is_verified = False
        user.save(update_fields=['is_verified', 'is_staff'])
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'first_name',
            'last_name',
            'phone_number',
        )


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_verified:
            raise serializers.ValidationError(
                _('Please verify your email before signing in.'), code='email_not_verified'
            )

        data['user'] = UserSerializer(self.user).data
        return data


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification."""
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=4, min_length=4)

    def validate_otp_code(self, value):
        """Ensure OTP is exactly 4 digits."""
        if not value.isdigit():
            raise serializers.ValidationError(_('OTP must contain only digits.'))
        return value


class ResendOTPSerializer(serializers.Serializer):
    """Serializer for resending OTP."""
    email = serializers.EmailField()
