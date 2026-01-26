"""
API views for financial tools and ROI calculators.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q
from decimal import Decimal, ROUND_HALF_UP
import math

from .models import (
    FinancingOption,
    GovernmentIncentive,
    BankIntegration,
    PaymentPlan,
    ROICalculation,
    PaymentSchedule
)
from .serializers import (
    FinancingOptionSerializer,
    GovernmentIncentiveSerializer,
    BankIntegrationSerializer,
    PaymentPlanSerializer,
    ROICalculationSerializer,
    PaymentScheduleSerializer,
    PaymentCalculationSerializer,
    ROICalculationRequestSerializer
)
from properties.models import Property
from construction.models import Project


class FinancingOptionViewSet(viewsets.ModelViewSet):
    """API endpoint for managing financing options."""
    queryset = FinancingOption.objects.filter(is_active=True)
    serializer_class = FinancingOptionSerializer
    permission_classes = []  # Allow public access to browse financing options
    
    def get_queryset(self):
        """Filter queryset based on user role and query parameters."""
        queryset = super().get_queryset()
        
        # Filter by loan amount if provided
        loan_amount = self.request.query_params.get('loan_amount')
        if loan_amount:
            try:
                loan_amount = Decimal(loan_amount)
                queryset = queryset.filter(
                    Q(min_loan_amount__lte=loan_amount) & 
                    (Q(max_loan_amount__isnull=True) | Q(max_loan_amount__gte=loan_amount))
                )
            except (ValueError, TypeError):
                pass
                
        return queryset


class GovernmentIncentiveViewSet(viewsets.ModelViewSet):
    """API endpoint for managing government incentives."""
    queryset = GovernmentIncentive.objects.filter(is_active=True)
    serializer_class = GovernmentIncentiveSerializer
    permission_classes = []  # Allow public access to browse government incentives
    
    def get_queryset(self):
        """Filter incentives based on property type and features."""
        queryset = super().get_queryset()
        
        # Filter by property type if provided
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(
                Q(eligible_property_types__id=property_type) | 
                Q(eligible_property_types__isnull=True)
            )
            
        # Filter by eco features if provided
        eco_features = self.request.query_params.getlist('eco_features')
        if eco_features:
            queryset = queryset.filter(
                Q(eligible_eco_features__id__in=eco_features) |
                Q(eligible_eco_features__isnull=True)
            )
            
        return queryset.distinct()
    
    @action(detail=False, methods=['post'])
    def check_eligibility(self, request):
        """Check eligibility for incentives based on property and features."""
        property_id = request.data.get('property_id')
        if not property_id:
            return Response(
                {"error": "Property ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            property_obj = Property.objects.get(id=property_id)
            
            # Get all active incentives
            incentives = GovernmentIncentive.objects.filter(is_active=True)
            
            # Filter incentives that match property type or have no type specified
            matching_incentives = []
            for incentive in incentives:
                type_match = not incentive.eligible_property_types.exists() or \
                           property_obj.property_type in incentive.eligible_property_types.all()
                
                features_match = True
                if incentive.eligible_eco_features.exists():
                    property_features = set(property_obj.eco_features.all())
                    incentive_features = set(incentive.eligible_eco_features.all())
                    features_match = not incentive_features.isdisjoint(property_features)
                
                if type_match and features_match:
                    serializer = self.get_serializer(incentive)
                    matching_incentives.append(serializer.data)
            
            return Response({"eligible_incentives": matching_incentives})
            
        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class BankIntegrationViewSet(viewsets.ModelViewSet):
    """API endpoint for managing bank integrations."""
    queryset = BankIntegration.objects.filter(is_active=True)
    serializer_class = BankIntegrationSerializer
    permission_classes = [IsAdminUser]


class PaymentPlanViewSet(viewsets.ModelViewSet):
    """API endpoint for managing payment plans."""
    queryset = PaymentPlan.objects.filter(is_active=True)
    serializer_class = PaymentPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Override permissions for specific actions."""
        if self.action == 'calculate':
            # Allow public access to payment calculator
            return []
        return super().get_permissions()
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate payment schedule based on loan parameters."""
        serializer = PaymentCalculationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        amount = data['amount']
        interest_rate = data['interest_rate']
        term_months = data['term_months']
        down_payment = data.get('down_payment', 0)
        payment_frequency = data.get('payment_frequency', 'monthly')
        
        # Convert annual interest rate to monthly and to decimal
        monthly_rate = (interest_rate / 100) / 12
        
        # Calculate loan amount after down payment
        loan_amount = amount - down_payment
        
        # Calculate monthly payment using the loan payment formula
        if monthly_rate > 0:
            monthly_payment = (loan_amount * monthly_rate * (1 + monthly_rate) ** term_months) / \
                            ((1 + monthly_rate) ** term_months - 1)
        else:
            monthly_payment = loan_amount / term_months
        
        # Round to 2 decimal places for currency
        monthly_payment = monthly_payment.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Adjust for different payment frequencies
        payment_multiplier = {
            'monthly': 1,
            'quarterly': 3,
            'semi_annually': 6,
            'annually': 12
        }.get(payment_frequency, 1)
        
        payment_amount = monthly_payment * payment_multiplier
        
        # Calculate total interest
        total_payment = payment_amount * (term_months / payment_multiplier)
        total_interest = total_payment - loan_amount
        
        return Response({
            "loan_amount": loan_amount,
            "down_payment": down_payment,
            "payment_amount": payment_amount,
            "payment_frequency": payment_frequency,
            "total_interest": total_interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "total_payment": total_payment.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "term_months": term_months
        })


class ROICalculationViewSet(viewsets.ModelViewSet):
    """API endpoint for ROI calculations."""
    queryset = ROICalculation.objects.all()
    serializer_class = ROICalculationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Override permissions for specific actions."""
        if self.action == 'calculate':
            # Allow public access to ROI calculator
            return []
        return super().get_permissions()
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate ROI based on provided parameters."""
        serializer = ROICalculationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        initial_cost = data['initial_cost']
        annual_savings = data['annual_savings']
        lifespan_years = data['lifestime_years']
        maintenance_cost_per_year = data.get('maintenance_cost_per_year', 0)
        
        # Calculate total savings over the lifespan
        total_savings = (annual_savings - maintenance_cost_per_year) * lifespan_years
        
        # Calculate ROI
        if initial_cost > 0:
            roi = ((total_savings - initial_cost) / initial_cost) * 100
        else:
            roi = 0
        
        # Calculate payback period
        annual_net_savings = annual_savings - maintenance_cost_per_year
        if annual_net_savings > 0:
            payback_period = float(initial_cost) / float(annual_net_savings)
        else:
            payback_period = float('inf')
        
        return Response({
            "initial_cost": initial_cost,
            "annual_savings": annual_savings,
            "lifespan_years": lifespan_years,
            "maintenance_cost_per_year": maintenance_cost_per_year,
            "total_savings": total_savings.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "roi_percentage": round(roi, 2),
            "payback_period_years": round(payback_period, 2) if payback_period != float('inf') else None,
            "is_viable": total_savings > initial_cost
        })


class PaymentScheduleViewSet(viewsets.ModelViewSet):
    """API endpoint for payment schedules."""
    serializer_class = PaymentScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payment schedules based on the authenticated user."""
        queryset = PaymentSchedule.objects.all()
        
        # Non-admin users can only see their own payment schedules
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(property__owner=self.request.user) |
                Q(project__user=self.request.user)
            )
            
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)
