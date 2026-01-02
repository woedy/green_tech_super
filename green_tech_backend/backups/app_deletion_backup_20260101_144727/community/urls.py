from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Case Studies
router.register(r'case-studies', views.CaseStudyViewSet, basename='casestudy')

# Educational Content
router.register(r'educational-content', views.EducationalContentViewSet, 
                basename='educationalcontent')

# Expert Profiles and Consultations
router.register(r'experts', views.ExpertProfileViewSet, basename='expert')
router.register(r'consultation-slots', views.ConsultationSlotViewSet, 
                basename='consultationslot')
router.register(r'consultation-bookings', views.ConsultationBookingViewSet, 
                basename='consultationbooking')

# Project Showcases
router.register(r'project-showcases', views.ProjectShowcaseViewSet, 
                basename='projectshowcase')
router.register(r'project-gallery-images', views.ProjectGalleryImageViewSet, 
                basename='projectgalleryimage')

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional endpoints for nested routes
    path('experts/<int:pk>/available-slots/', 
         views.ExpertProfileViewSet.as_view({'get': 'available_slots'}), 
         name='expert-available-slots'),
    path('consultation-bookings/<int:pk>/cancel/', 
         views.ConsultationBookingViewSet.as_view({'post': 'cancel'}), 
         name='consultation-booking-cancel'),
]
