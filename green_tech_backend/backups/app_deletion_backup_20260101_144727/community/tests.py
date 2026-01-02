import os
import tempfile
from datetime import timedelta, datetime
from django.test import TestCase, override_settings
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from properties.models import Property, Project, EcoFeature
from .models import (
    CaseStudy, CaseStudyImage, EducationalContent,
    ExpertProfile, ConsultationSlot, ConsultationBooking,
    ProjectShowcase, ProjectGalleryImage
)


def create_test_image():
    """Create a test image file for uploads"""
    from PIL import Image
    from io import BytesIO
    
    # Create a simple image in memory
    image = Image.new('RGB', (100, 100), color='red')
    file = BytesIO()
    image.save(file, 'JPEG')
    file.seek(0)
    
    return SimpleUploadedFile(
        'test_image.jpg',
        file.read(),
        content_type='image/jpeg'
    )


def get_tokens_for_user(user):
    """Generate JWT tokens for test user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class BaseTestCase(APITestCase):
    """Base test case with common setup"""
    
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='testpass123',
            first_name='Regular',
            last_name='User'
        )
        
        # Get tokens for authentication
        self.admin_token = get_tokens_for_user(self.admin_user)['access']
        self.user_token = get_tokens_for_user(self.regular_user)['access']
        
        # Set up API clients
        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        self.user_client = APIClient()
        self.user_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        # Create test property and project
        self.property = Property.objects.create(
            name='Test Property',
            address='123 Test St',
            city='Accra',
            region='Greater Accra',
            property_type='residential'
        )
        
        self.project = Project.objects.create(
            name='Test Project',
            description='Test project description',
            status='completed'
        )
        
        # Create test eco features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            description='Solar panel installation',
            category='energy',
            icon='solar-panel'
        )
        self.eco_feature2 = EcoFeature.objects.create(
            name='Rainwater Harvesting',
            description='Rainwater collection system',
            category='water',
            icon='water'
        )
        
        # Create test image
        self.test_image = create_test_image()


class CaseStudyTests(BaseTestCase):
    """Tests for the Case Study API"""
    
    def setUp(self):
        super().setUp()
        
        # Create a test case study
        self.case_study = CaseStudy.objects.create(
            title='Test Case Study',
            project=self.project,
            property=self.property,
            location='Accra, Ghana',
            project_type='residential',
            overview='Test overview',
            challenge='Test challenge',
            solution='Test solution',
            results='Test results',
            energy_savings=30.5,
            water_savings=20.0,
            cost_savings=5000.00,
            co2_reduction=2000.00,
            featured=True,
            published=True
        )
        
        # Create test case study images
        self.case_study_image = CaseStudyImage.objects.create(
            case_study=self.case_study,
            image=self.test_image,
            caption='Test image caption',
            is_primary=True
        )
        
        # URLs
        self.list_url = reverse('v1:casestudy-list')
        self.detail_url = reverse('v1:casestudy-detail', kwargs={'slug': self.case_study.slug})
    
    def test_get_case_studies(self):
        """
        Test retrieving a list of case studies
        """
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Case Study')
    
    def test_get_case_study_detail(self):
        """
        Test retrieving a single case study
        """
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Case Study')
        self.assertEqual(len(response.data['images']), 1)
    
    def test_create_case_study_authenticated(self):
        """
        Test creating a case study as an admin
        """
        data = {
            'title': 'New Case Study',
            'project': self.project.id,
            'property': self.property.id,
            'location': 'Kumasi, Ghana',
            'project_type': 'commercial',
            'overview': 'New overview',
            'challenge': 'New challenge',
            'solution': 'New solution',
            'results': 'New results',
            'energy_savings': 25.5,
            'water_savings': 15.0,
            'cost_savings': 3000.00,
            'co2_reduction': 1500.00,
            'featured': False,
            'published': True
        }
        
        response = self.admin_client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseStudy.objects.count(), 2)
        self.assertEqual(CaseStudy.objects.get(id=response.data['id']).title, 'New Case Study')
    
    def test_create_case_study_unauthenticated(self):
        """
        Test that unauthenticated users cannot create case studies
        """
        data = {'title': 'Unauthorized Case Study'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class EducationalContentTests(BaseTestCase):
    """
    Tests for the Educational Content API
    """
    
    def setUp(self):
        super().setUp()
        
        # Create test educational content
        self.educational_content = EducationalContent.objects.create(
            title='Test Article',
            content_type='article',
            category='sustainability',
            author=self.admin_user,
            summary='Test summary',
            content='Test content',
            published=True,
            published_date=timezone.now()
        )
        
        # URLs
        self.list_url = reverse('v1:educationalcontent-list')
        self.detail_url = reverse('v1:educationalcontent-detail', kwargs={'slug': self.educational_content.slug})
    
    def test_get_educational_content_list(self):
        """
        Test retrieving a list of educational content
        """
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Article')
    
    def test_get_educational_content_detail(self):
        """
        Test retrieving a single educational content
        """
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Article')
    
    def test_create_educational_content_authenticated(self):
        """
        Test creating educational content as an admin
        """
        data = {
            'title': 'New Article',
            'content_type': 'article',
            'category': 'construction',
            'summary': 'New summary',
            'content': 'New content',
            'published': True
        }
        
        response = self.admin_client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EducationalContent.objects.count(), 2)
        self.assertEqual(EducationalContent.objects.get(id=response.data['id']).title, 'New Article')
        self.assertEqual(EducationalContent.objects.get(id=response.data['id']).author, self.admin_user)


class ExpertConsultationTests(BaseTestCase):
    """Tests for the Expert Consultation API"""
    
    def setUp(self):
        super().setUp()
        
        # Create an expert profile
        self.expert = ExpertProfile.objects.create(
            user=self.admin_user,
            bio='Expert in sustainable construction',
            expertise='sustainable_construction',
            years_experience=10,
            qualifications='MSc in Sustainable Architecture',
            languages=['en', 'fr'],
            hourly_rate=100.00,
            available_for_consultation=True,
            is_featured=True
        )
        
        # Create consultation slots
        now = timezone.now()
        self.slot1 = ConsultationSlot.objects.create(
            expert=self.expert,
            start_time=now + timedelta(days=1),
            end_time=now + timedelta(days=1, hours=1),
            is_booked=False
        )
        
        self.slot2 = ConsultationSlot.objects.create(
            expert=self.expert,
            start_time=now + timedelta(days=2),
            end_time=now + timedelta(days=2, hours=1),
            is_booked=False
        )
        
        # Create a booking
        self.booking = ConsultationBooking.objects.create(
            user=self.regular_user,
            expert=self.expert,
            slot=self.slot1,
            topic='Test consultation',
            notes='Test notes',
            status='confirmed'
        )
        
        # Mark the slot as booked
        self.slot1.is_booked = True
        self.slot1.save()
        
        # URLs
        self.expert_list_url = reverse('v1:expert-list')
        self.expert_detail_url = reverse('v1:expert-detail', kwargs={'pk': self.expert.id})
        self.slot_list_url = reverse('v1:consultationslot-list')
        self.booking_list_url = reverse('v1:consultationbooking-list')
        self.available_slots_url = reverse('v1:expert-available-slots', kwargs={'pk': self.expert.id})
    
    def test_get_experts(self):
        """Test retrieving a list of experts"""
        response = self.client.get(self.expert_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['expertise'], 'sustainable_construction')
    
    def test_get_available_slots(self):
        """Test retrieving available consultation slots for an expert"""
        response = self.client.get(self.available_slots_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only slot2 should be available
        self.assertEqual(len(response.data), 1)
    
    def test_book_consultation(self):
        """Test booking a consultation slot"""
        data = {
            'slot': self.slot2.id,
            'topic': 'New consultation',
            'notes': 'I need help with sustainable materials'
        }
        
        response = self.user_client.post(self.booking_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ConsultationBooking.objects.count(), 2)
        
        # Verify the slot is now marked as booked
        self.slot2.refresh_from_db()
        self.assertTrue(self.slot2.is_booked)
    
    def test_cancel_booking(self):
        """Test canceling a booking"""
        cancel_url = reverse(
            'v1:consultation-booking-cancel',
            kwargs={'pk': self.booking.id}
        )
        response = self.user_client.post(cancel_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.slot1.refresh_from_db()
        
        self.assertEqual(self.booking.status, 'cancelled')
        self.assertFalse(self.slot1.is_booked)


class ProjectShowcaseTests(BaseTestCase):
    """Tests for the Project Showcase API"""
    
    def setUp(self):
        super().setUp()
        
        # Create a test project showcase
        self.showcase = ProjectShowcase.objects.create(
            project=self.project,
            title='Test Showcase',
            description='Test showcase description',
            featured=True,
            featured_order=1,
            is_published=True
        )
        self.showcase.sustainability_features.add(self.eco_feature1, self.eco_feature2)
        
        # Create test gallery images
        self.gallery_image = ProjectGalleryImage.objects.create(
            showcase=self.showcase,
            image=self.test_image,
            caption='Gallery image caption',
            is_primary=True,
            order=1
        )
        
        # URLs
        self.list_url = reverse('v1:projectshowcase-list')
        self.detail_url = reverse('v1:projectshowcase-detail', kwargs={'slug': self.showcase.slug})
    
    def test_get_project_showcases(self):
        """Test retrieving project showcases"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Showcase')
    
    def test_get_showcase_detail(self):
        """Test retrieving a single project showcase"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Showcase')
        self.assertEqual(len(response.data['sustainability_features_data']), 2)
        self.assertEqual(len(response.data['gallery_images']), 1)
    
    def test_filter_showcases_by_feature(self):
        """Test filtering showcases by sustainability feature"""
        # Create another showcase with only one feature
        another_showcase = ProjectShowcase.objects.create(
            project=self.project,
            title='Another Showcase',
            description='Another description',
            is_published=True
        )
        another_showcase.sustainability_features.add(self.eco_feature1)
        
        # Filter by the first feature (should return both showcases)
        response = self.client.get(f"{self.list_url}?features={self.eco_feature1.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # Filter by the second feature (should return only the first showcase)
        response = self.client.get(f"{self.list_url}?features={self.eco_feature2.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Showcase')


class ProjectGalleryImageTests(BaseTestCase):
    """Tests for the Project Gallery Image API"""
    
    def setUp(self):
        super().setUp()
        
        # Create a test project showcase
        self.showcase = ProjectShowcase.objects.create(
            project=self.project,
            title='Gallery Test Showcase',
            description='Test gallery',
            is_published=True
        )
        
        # Create a test gallery image
        self.gallery_image = ProjectGalleryImage.objects.create(
            showcase=self.showcase,
            image=self.test_image,
            caption='Test gallery image',
            is_primary=True,
            order=1
        )
        
        # URLs
        self.list_url = reverse('v1:projectgalleryimage-list')
        self.detail_url = reverse('v1:projectgalleryimage-detail', kwargs={'pk': self.gallery_image.id})
    
    def test_get_gallery_images(self):
        """Test retrieving gallery images"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['caption'], 'Test gallery image')
    
    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_upload_gallery_image(self):
        """Test uploading a new gallery image (admin only)"""
        data = {
            'showcase': self.showcase.id,
            'image': self.test_image,
            'caption': 'New gallery image',
            'is_primary': False,
            'order': 2
        }
        
        response = self.admin_client.post(self.list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProjectGalleryImage.objects.count(), 2)
        self.assertEqual(ProjectGalleryImage.objects.get(id=response.data['id']).caption, 'New gallery image')
    
    def test_delete_gallery_image_admin(self):
        """Test deleting a gallery image as admin"""
        response = self.admin_client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ProjectGalleryImage.objects.count(), 0)
    
    def test_delete_gallery_image_unauthorized(self):
        """Test that regular users cannot delete gallery images"""
        response = self.user_client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(ProjectGalleryImage.objects.count(), 1)
