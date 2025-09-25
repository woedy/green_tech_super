from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class RegistrationFlowTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('v1:accounts:register')
        self.verify_url = reverse('v1:accounts:verify-email')
        self.login_url = reverse('v1:accounts:login')
        self.profile_url = reverse('v1:accounts:profile')

    def _extract_uid_and_token(self):
        self.assertGreater(len(mail.outbox), 0)
        message = mail.outbox[-1].body
        for line in message.splitlines():
            if '/auth/verify' in line:
                parsed = urlparse(line.strip())
                query = parse_qs(parsed.query)
                uid = query.get('uid', [None])[0]
                token = query.get('token', [None])[0]
                if uid and token:
                    return uid, token
        self.fail('Verification link not found in email body')

    def test_user_registration_triggers_verification_email(self):
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
        user = User.objects.get(email='jane@example.com')
        self.assertFalse(user.is_verified)
        self.assertEqual(len(mail.outbox), 1)

    def test_verification_enables_login(self):
        payload = {
            'email': 'mark@example.com',
            'password': 'MyStrongPass123',
            'confirm_password': 'MyStrongPass123',
            'first_name': 'Mark',
            'last_name': 'Green',
            'user_type': 'CUSTOMER',
        }
        register_response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        uid, token = self._extract_uid_and_token()
        verify_response = self.client.post(self.verify_url, {'uid': uid, 'token': token}, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        user = User.objects.get(email='mark@example.com')
        self.assertTrue(user.is_verified)

        login_response = self.client.post(
            self.login_url,
            {'email': 'mark@example.com', 'password': 'MyStrongPass123'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)
        self.assertEqual(login_response.data['user']['email'], 'mark@example.com')

        access = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['email'], 'mark@example.com')

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
