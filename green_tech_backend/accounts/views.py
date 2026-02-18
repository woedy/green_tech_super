from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    LoginSerializer,
    ProfileUpdateSerializer,
    RegistrationSerializer,
    UserSerializer,
)
from .tasks import send_verification_email

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def perform_create(self, serializer):
        user = serializer.save()
        send_verification_email.delay(user.pk)
        return user

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': 'Registration successful. Please verify your email to activate your account.'
        }
        return response


class VerifyEmailView(APIView):
    """Verify user email with OTP code."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        from .serializers import VerifyOTPSerializer
        from .models import EmailVerificationOTP
        
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp_code']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the most recent unused OTP for this user
        try:
            otp = EmailVerificationOTP.objects.filter(
                user=user,
                otp_code=otp_code,
                is_used=False
            ).latest('created_at')
        except EmailVerificationOTP.DoesNotExist:
            return Response(
                {'detail': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OTP is valid (not expired)
        if not otp.is_valid():
            return Response(
                {'detail': 'OTP has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark user as verified and OTP as used
        if not user.is_verified:
            user.is_verified = True
            # Ensure ADMIN users have is_staff=True
            if user.user_type == 'ADMIN' and not user.is_staff:
                user.is_staff = True
                user.save(update_fields=['is_verified', 'is_staff'])
            else:
                user.save(update_fields=['is_verified'])
        
        otp.mark_as_used()
        
        return Response(
            {'message': 'Email successfully verified.'},
            status=status.HTTP_200_OK
        )


class ResendOTPView(APIView):
    """Resend OTP verification code to user's email."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        from .serializers import ResendOTPSerializer
        
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.is_verified:
            return Response(
                {'detail': 'Email is already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send new OTP
        send_verification_email.delay(user.pk)
        
        return Response(
            {'message': 'A new verification code has been sent to your email.'},
            status=status.HTTP_200_OK
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserProfileUpdateView(generics.UpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
