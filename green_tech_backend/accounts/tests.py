from django.core import mail
from django.urls import reverse
from django.test import override_settings, TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from .models import User, EmailVerificationOTP


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class RegistrationFlowTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('v1:accounts:register')
        self.verify_url = reverse('v1:accounts:verify-email')
        self.login_url = reverse('v1:accounts:login')
        self.profile_url = reverse('v1:accounts:profile')
        self.resend_url = reverse('v1:accounts:resend-otp')

    def test_user_registration_triggers_otp_email(self):
        payload = {
            'email': 'jane@example.com',
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'user_type': 'CUSTOMER',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        
        # Verify user created but not verified
        user = User.objects.get(email='jane@example.com')
        self.assertFalse(user.is_verified)
        
        # Verify OTP email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Verification Code', mail.outbox[0].subject)
        
        # Verify OTP record created
        otp = EmailVerificationOTP.objects.filter(user=user).first()
        self.assertIsNotNone(otp)
        self.assertIn(otp.otp_code, mail.outbox[0].body)

    def test_verification_enables_login(self):
        # 1. Register
        payload = {
            'email': 'mark@example.com',
            'password': 'MyStrongPass123',
            'confirm_password': 'MyStrongPass123',
            'first_name': 'Mark',
            'last_name': 'Green',
            'user_type': 'CUSTOMER',
        }
        self.client.post(self.register_url, payload, format='json')
        
        # Get OTP
        user = User.objects.get(email='mark@example.com')
        otp = EmailVerificationOTP.objects.get(user=user)
        
        # 2. Verify with OTP
        verify_response = self.client.post(self.verify_url, {
            'email': 'mark@example.com', 
            'otp_code': otp.otp_code
        }, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        
        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        
        # 3. Login
        login_response = self.client.post(
            self.login_url,
            {'email': 'mark@example.com', 'password': 'MyStrongPass123'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)

    def test_verify_email_invalid_otp(self):
        # Register
        payload = {
            'email': 'badotp@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'first_name': 'Bad',
            'last_name': 'OTP',
        }
        self.client.post(self.register_url, payload, format='json')
        
        # Try verify with wrong code
        response = self.client.post(self.verify_url, {
            'email': 'badotp@example.com',
            'otp_code': '0000'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user = User.objects.get(email='badotp@example.com')
        self.assertFalse(user.is_verified)

    def test_verify_email_expired_otp(self):
        # Register
        payload = {
            'email': 'expired@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'first_name': 'Expired',
            'last_name': 'User',
        }
        self.client.post(self.register_url, payload, format='json')
        
        # Manually expire OTP
        user = User.objects.get(email='expired@example.com')
        otp = EmailVerificationOTP.objects.get(user=user)
        otp.expires_at = timezone.now() - timedelta(minutes=1)
        otp.save()
        
        # Try verify
        response = self.client.post(self.verify_url, {
            'email': 'expired@example.com',
            'otp_code': otp.otp_code
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', str(response.data))

    def test_resend_otp(self):
        # Register
        payload = {
            'email': 'resend@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'first_name': 'Resend',
            'last_name': 'User',
        }
        self.client.post(self.register_url, payload, format='json')
        
        user = User.objects.get(email='resend@example.com')
        otp1 = EmailVerificationOTP.objects.get(user=user)
        
        # Resend
        mail.outbox = [] # clear outbox
        response = self.client.post(self.resend_url, {
            'email': 'resend@example.com'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check old OTP invalidated
        otp1.refresh_from_db()
        self.assertTrue(otp1.is_used)
        
        # Check new OTP created
        otp2 = EmailVerificationOTP.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(otp2)
        self.assertNotEqual(otp1.otp_code, otp2.otp_code)
        
        # Check email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(otp2.otp_code, mail.outbox[0].body)

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
