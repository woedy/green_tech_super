from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import Property, PropertyImage, PropertyFeature
from construction.ghana.models import GhanaRegion, EcoFeature
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()


class PropertyAPITestCase(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create test regions
        self.region1 = GhanaRegion.objects.create(
            name='GREATER_ACCRA',
            capital='Accra',
            cost_multiplier=1.3
        )
        
        # Create eco features
        self.eco_feature1 = EcoFeature.objects.create(
            name='Solar Panels',
            category='SOLAR',
            is_available=True
        )
        self.eco_feature2 = EcoFeature.objects.create(
            name='Rainwater Harvesting',
            category='WATER',
            is_available=True
        )
        
        # Create test property
        self.property = Property.objects.create(
            title='Test Property',
            description='A beautiful eco-friendly property',
            property_type='RESIDENTIAL',
            status='PUBLISHED',
            price=500000,
            currency='GHS',
            area=200,
            bedrooms=3,
            bathrooms=2,
            address='123 Test St',
            city='Accra',
            region='GREATER_ACCRA',
            created_by=self.user
        )
        self.property.eco_features.add(self.eco_feature1)
        
        # Create test property feature
        self.feature = PropertyFeature.objects.create(
            property=self.property,
            name='Swimming Pool',
            description='Saltwater swimming pool',
            is_eco_friendly=True
        )
        
        # Create test image
        self.image = PropertyImage.objects.create(
            property=self.property,
            image=SimpleUploadedFile(
                name='test_image.jpg',
                content=b'file_content',
                content_type='image/jpeg'
            ),
            is_primary=True
        )
        
        # Set up client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_properties(self):
        """Test listing properties."""
        url = reverse('property-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], self.property.title)
    
    def test_create_property(self):
        """Test creating a new property."""
        url = reverse('property-list')
        data = {
            'title': 'New Test Property',
            'description': 'Another beautiful property',
            'property_type': 'RESIDENTIAL',
            'status': 'PUBLISHED',
            'price': '750000',
            'currency': 'GHS',
            'area': '250',
            'bedrooms': 4,
            'bathrooms': 3,
            'address': '456 New St',
            'city': 'Kumasi',
            'region': 'ASHANTI',
            'eco_features': [self.eco_feature2.id],
            'features': [
                {
                    'name': 'Garden',
                    'description': 'Beautiful garden with native plants',
                    'is_eco_friendly': True
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Property.objects.count(), 2)
        self.assertEqual(PropertyFeature.objects.count(), 2)
        
        # Check eco features were added
        property = Property.objects.get(id=response.data['id'])
        self.assertEqual(property.eco_features.count(), 1)
    
    def test_retrieve_property(self):
        """Test retrieving a property."""
        url = reverse('property-detail', args=[self.property.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.property.title)
        self.assertEqual(len(response.data['features']), 1)
        self.assertEqual(len(response.data['eco_features']), 1)
    
    def test_update_property(self):
        """Test updating a property."""
        url = reverse('property-detail', args=[self.property.id])
        data = {
            'title': 'Updated Test Property',
            'description': self.property.description,
            'property_type': self.property.property_type,
            'status': self.property.status,
            'price': str(self.property.price),
            'currency': self.property.currency,
            'area': str(self.property.area),
            'bedrooms': self.property.bedrooms,
            'bathrooms': self.property.bathrooms,
            'address': self.property.address,
            'city': self.property.city,
            'region': self.property.region,
            'eco_features': [self.eco_feature1.id, self.eco_feature2.id]
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.title, 'Updated Test Property')
        self.assertEqual(self.property.eco_features.count(), 2)
    
    def test_delete_property(self):
        """Test deleting a property."""
        url = reverse('property-detail', args=[self.property.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Property.objects.count(), 0)
    
    def test_filter_properties(self):
        """Test filtering properties."""
        # Create another property for filtering
        Property.objects.create(
            title='Another Property',
            description='Not in Accra',
            property_type='COMMERCIAL',
            status='PUBLISHED',
            price=1000000,
            currency='GHS',
            area=500,
            bedrooms=0,
            bathrooms=2,
            address='789 Business Ave',
            city='Kumasi',
            region='ASHANTI',
            created_by=self.user
        )
        
        # Test city filter
        url = f"{reverse('property-list')}?city=Accra"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['city'], 'Accra')
        
        # Test property type filter
        url = f"{reverse('property-list')}?property_type=RESIDENTIAL"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['property_type'], 'RESIDENTIAL')
        
        # Test price range filter
        url = f"{reverse('property-list')}?price__gte=400000&price__lte=600000"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(float(response.data['results'][0]['price']), 500000.0)
        
        # Test eco features filter
        url = f"{reverse('property-list')}?eco_features={self.eco_feature1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.property.id)
    
    def test_upload_image(self):
        """Test uploading an image to a property."""
        url = reverse('property-upload-image', args=[self.property.id])
        
        # Create a test image
        image = SimpleUploadedFile(
            name='test_upload.jpg',
            content=b'file_content',
            content_type='image/jpeg'
        )
        
        response = self.client.post(url, {'image': image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.property.images.count(), 2)
        self.assertIn('image_url', response.data)
    
    def test_set_primary_image(self):
        """Test setting an image as primary."""
        # Create another image
        new_image = PropertyImage.objects.create(
            property=self.property,
            image=SimpleUploadedFile(
                name='another_image.jpg',
                content=b'another_file_content',
                content_type='image/jpeg'
            ),
            is_primary=False
        )
        
        url = reverse('property-set-primary-image', args=[self.property.id])
        response = self.client.post(url, {'image_id': new_image.id}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_image.refresh_from_db()
        self.assertTrue(new_image.is_primary)
        
        # The previous primary image should no longer be primary
        self.image.refresh_from_db()
        self.assertFalse(self.image.is_primary)
    
    def test_search_suggestions(self):
        """Test getting search suggestions."""
        url = f"{reverse('property-search-suggestions')}?q=test"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        
        # Should find the test property
        property_suggestions = [s for s in response.data if s.get('model') == 'property']
        self.assertGreater(len(property_suggestions), 0)
        
        # Should find the city
        city_suggestions = [s for s in response.data if s.get('model') == 'city' and s['text'] == 'Accra']
        self.assertGreater(len(city_suggestions), 0)
        
        # Should find the region
        region_suggestions = [s for s in response.data if s.get('model') == 'region']
        self.assertGreater(len(region_suggestions), 0)
