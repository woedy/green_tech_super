from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework.authtoken.models import Token

from properties.models import Property
from .models import (
    ConstructionRequest, ConstructionMilestone, 
    ConstructionDocument, Project, ConstructionType, ConstructionStatus, ProjectStatus
)
from .permissions import IsOwnerOrAdmin, IsProjectTeamMember, IsProjectManagerOrAdmin

User = get_user_model()

class ConstructionModelTests(TestCase):
    """Test cases for the construction models."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            first_name='Client',
            last_name='User',
            role='customer'
        )
        
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            password='testpass123',
            first_name='Project',
            last_name='Manager',
            role='project_manager'
        )
        
        self.contractor_user = User.objects.create_user(
            email='contractor@example.com',
            password='testpass123',
            first_name='Contractor',
            last_name='User',
            role='contractor'
        )
        
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Create a test property
        self.property = Property.objects.create(
            title='Test Property',
            description='Test description',
            price=100000,
            location='Accra, Ghana',
            property_type='residential',
            status='for_sale',
            created_by=self.client_user
        )
        
        # Create a construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction Request',
            description='Test description',
            construction_type=ConstructionType.NEW_CONSTRUCTION,
            status=ConstructionStatus.DRAFT,
            property=self.property,
            client=self.client_user,
            project_manager=self.manager_user,
            budget=50000,
            currency='GHS',
            target_energy_rating=4,
            target_water_rating=4,
            target_sustainability_score=80
        )
        self.construction_request.contractors.add(self.contractor_user)
        
        # Create a project
        self.project = Project.objects.create(
            name='Test Project',
            description='Test project description',
            status=ProjectStatus.PLANNING,
            construction_request=self.construction_request,
            project_manager=self.manager_user,
            site_supervisor=self.contractor_user,
            estimated_budget=50000,
            currency='GHS',
            location='Accra, Ghana',
            region='Greater Accra',
            district='Accra Metropolitan',
            created_by=self.manager_user
        )
        self.project.contractors.add(self.contractor_user)
        
        # Create a milestone
        self.milestone = ConstructionMilestone.objects.create(
            construction_request=self.construction_request,
            title='Test Milestone',
            description='Test milestone description',
            due_date='2023-12-31'
        )
        
        # Create a document
        self.document = ConstructionDocument.objects.create(
            construction_request=self.construction_request,
            title='Test Document',
            document_type='PLAN',
            file=SimpleUploadedFile('test.pdf', b'file_content', content_type='application/pdf'),
            uploaded_by=self.manager_user
        )
    
    def test_construction_request_creation(self):
        """Test construction request creation."""
        self.assertEqual(ConstructionRequest.objects.count(), 1)
        self.assertEqual(self.construction_request.title, 'Test Construction Request')
        self.assertEqual(self.construction_request.client, self.client_user)
        self.assertEqual(self.construction_request.project_manager, self.manager_user)
        self.assertIn(self.contractor_user, self.construction_request.contractors.all())
    
    def test_project_creation(self):
        """Test project creation."""
        self.assertEqual(Project.objects.count(), 1)
        self.assertEqual(self.project.name, 'Test Project')
        self.assertEqual(self.project.construction_request, self.construction_request)
        self.assertEqual(self.project.project_manager, self.manager_user)
        self.assertEqual(self.project.site_supervisor, self.contractor_user)
    
    def test_milestone_creation(self):
        """Test milestone creation."""
        self.assertEqual(ConstructionMilestone.objects.count(), 1)
        self.assertEqual(self.milestone.title, 'Test Milestone')
        self.assertEqual(self.milestone.construction_request, self.construction_request)
    
    def test_document_creation(self):
        """Test document creation."""
        self.assertEqual(ConstructionDocument.objects.count(), 1)
        self.assertEqual(self.document.title, 'Test Document')
        self.assertEqual(self.document.construction_request, self.construction_request)
        self.assertEqual(self.document.uploaded_by, self.manager_user)

class ConstructionAPITests(APITestCase):
    """Test cases for the construction API endpoints."""
    
    def setUp(self):
        """Set up test data for API tests."""
        # Create test users
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            first_name='Client',
            last_name='User',
            role='customer'
        )
        
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            password='testpass123',
            first_name='Project',
            last_name='Manager',
            role='project_manager'
        )
        
        self.contractor_user = User.objects.create_user(
            email='contractor@example.com',
            password='testpass123',
            first_name='Contractor',
            last_name='User',
            role='contractor'
        )
        
        # Create tokens for authentication
        self.client_token = Token.objects.create(user=self.client_user)
        self.manager_token = Token.objects.create(user=self.manager_user)
        self.contractor_token = Token.objects.create(user=self.contractor_user)
        
        # Create a test property
        self.property = Property.objects.create(
            title='Test Property',
            description='Test description',
            price=100000,
            location='Accra, Ghana',
            property_type='residential',
            status='for_sale',
            created_by=self.client_user
        )
        
        # Create a construction request
        self.construction_request = ConstructionRequest.objects.create(
            title='Test Construction Request',
            description='Test description',
            construction_type=ConstructionType.NEW_CONSTRUCTION,
            status=ConstructionStatus.DRAFT,
            property=self.property,
            client=self.client_user,
            project_manager=self.manager_user,
            budget=50000,
            currency='GHS'
        )
        self.construction_request.contractors.add(self.contractor_user)
        
        # Create a project
        self.project = Project.objects.create(
            name='Test Project',
            description='Test project description',
            status=ProjectStatus.PLANNING,
            construction_request=self.construction_request,
            project_manager=self.manager_user,
            site_supervisor=self.contractor_user,
            estimated_budget=50000,
            currency='GHS',
            location='Accra, Ghana',
            region='Greater Accra',
            district='Accra Metropolitan',
            created_by=self.manager_user
        )
        self.project.contractors.add(self.contractor_user)
        
        # Create a milestone
        self.milestone = ConstructionMilestone.objects.create(
            construction_request=self.construction_request,
            title='Test Milestone',
            description='Test milestone description',
            due_date='2023-12-31'
        )
        
        # Create a document
        self.document = ConstructionDocument.objects.create(
            construction_request=self.construction_request,
            title='Test Document',
            document_type='PLAN',
            file=SimpleUploadedFile('test.pdf', b'file_content', content_type='application/pdf'),
            uploaded_by=self.manager_user
        )
    
    def test_construction_request_list_api(self):
        """Test listing construction requests."""
        url = reverse('construction-request-list')
        
        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test authenticated access (client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Construction Request')
    
    def test_create_construction_request_api(self):
        """Test creating a new construction request."""
        url = reverse('construction-request-list')
        data = {
            'title': 'New Construction Request',
            'description': 'New description',
            'construction_type': ConstructionType.RENOVATION,
            'status': ConstructionStatus.DRAFT,
            'property': self.property.id,
            'budget': '75000',
            'currency': 'GHS',
            'target_energy_rating': 5,
            'target_water_rating': 4,
            'target_sustainability_score': 85
        }
        
        # Test unauthenticated access
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test authenticated access
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ConstructionRequest.objects.count(), 2)
        self.assertEqual(ConstructionRequest.objects.get(id=response.data['id']).title, 'New Construction Request')
    
    def test_project_detail_api(self):
        """Test retrieving project details."""
        url = reverse('project-detail', kwargs={'pk': self.project.id})
        
        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test authenticated access (contractor)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.contractor_token.key}')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Project')
    
    def test_add_contractor_to_project_api(self):
        """Test adding a contractor to a project."""
        # Create a new contractor user
        new_contractor = User.objects.create_user(
            email='newcontractor@example.com',
            password='testpass123',
            first_name='New',
            last_name='Contractor',
            role='contractor'
        )
        
        url = reverse('project-add-contractor', kwargs={'pk': self.project.id})
        data = {'contractor_id': new_contractor.id}
        
        # Test unauthenticated access
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test non-manager access (should fail)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.contractor_token.key}')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test manager access (should succeed)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.manager_token.key}')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(new_contractor.id, self.project.contractors.values_list('id', flat=True))
