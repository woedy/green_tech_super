"""
URL routing for the finances app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'financing-options', views.FinancingOptionViewSet, basename='financing-option')
router.register(r'government-incentives', views.GovernmentIncentiveViewSet, basename='government-incentive')
router.register(r'bank-integrations', views.BankIntegrationViewSet, basename='bank-integration')
router.register(r'payment-plans', views.PaymentPlanViewSet, basename='payment-plan')
router.register(r'roi-calculations', views.ROICalculationViewSet, basename='roi-calculation')
router.register(r'payment-schedules', views.PaymentScheduleViewSet, basename='payment-schedule')

app_name = 'finances'

urlpatterns = [
    path('', include(router.urls)),
]
