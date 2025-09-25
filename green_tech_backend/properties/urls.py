from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PropertyInquiryView, PropertyViewSet

app_name = 'properties'

router = DefaultRouter()
router.register('properties', PropertyViewSet, basename='property')

urlpatterns = [
    path('properties/inquiries/', PropertyInquiryView.as_view(), name='property-inquiry'),
    path('', include(router.urls)),
]
