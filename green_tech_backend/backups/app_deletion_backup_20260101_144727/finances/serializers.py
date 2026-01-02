"""
Serializers for the finances app.
"""
from rest_framework import serializers
from .models import (
    FinancingOption,
    GovernmentIncentive,
    BankIntegration,
    PaymentPlan,
    ROICalculation,
    PaymentSchedule
)


class FinancingOptionSerializer(serializers.ModelSerializer):
    """Serializer for FinancingOption model."""
    class Meta:
        model = FinancingOption
        fields = [
            'id', 'name', 'description', 'interest_rate',
            'min_loan_amount', 'max_loan_amount',
            'min_loan_term', 'max_loan_term', 'is_active'
        ]


class GovernmentIncentiveSerializer(serializers.ModelSerializer):
    """Serializer for GovernmentIncentive model."""
    class Meta:
        model = GovernmentIncentive
        fields = [
            'id', 'name', 'incentive_type', 'description',
            'amount', 'is_percentage', 'min_qualifying_amount',
            'max_qualifying_amount', 'eligible_property_types',
            'eligible_eco_features', 'start_date', 'end_date',
            'is_active', 'application_url', 'documentation_required'
        ]


class BankIntegrationSerializer(serializers.ModelSerializer):
    """Serializer for BankIntegration model."""
    class Meta:
        model = BankIntegration
        fields = [
            'id', 'name', 'api_base_url', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')


class PaymentPlanSerializer(serializers.ModelSerializer):
    """Serializer for PaymentPlan model."""
    class Meta:
        model = PaymentPlan
        fields = [
            'id', 'name', 'description', 'down_payment_percentage',
            'interest_rate', 'term_months', 'payment_frequency',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')


class ROICalculationSerializer(serializers.ModelSerializer):
    """Serializer for ROICalculation model."""
    roi_percentage = serializers.SerializerMethodField()
    payback_period = serializers.SerializerMethodField()

    class Meta:
        model = ROICalculation
        fields = [
            'id', 'name', 'description', 'initial_cost',
            'annual_savings', 'lifespan_years', 'maintenance_cost_per_year',
            'roi_percentage', 'payback_period', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def get_roi_percentage(self, obj):
        """Calculate ROI as a percentage."""
        return obj.calculate_roi()

    def get_payback_period(self, obj):
        """Calculate payback period in years."""
        return obj.calculate_payback_period()


class PaymentScheduleSerializer(serializers.ModelSerializer):
    """Serializer for PaymentSchedule model."""
    class Meta:
        model = PaymentSchedule
        fields = [
            'id', 'payment_plan', 'property', 'project',
            'payment_amount', 'payment_date', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')


class PaymentCalculationSerializer(serializers.Serializer):
    """Serializer for payment calculation requests."""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    term_months = serializers.IntegerField(min_value=1)
    down_payment = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=0
    )
    payment_frequency = serializers.ChoiceField(
        choices=PaymentPlan.PAYMENT_FREQUENCIES,
        default='monthly'
    )

    def validate(self, data):
        """Validate the payment calculation data."""
        if data['amount'] <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if data['interest_rate'] < 0:
            raise serializers.ValidationError("Interest rate cannot be negative.")
        if 'down_payment' in data and data['down_payment'] < 0:
            raise serializers.ValidationError("Down payment cannot be negative.")
        return data


class ROICalculationRequestSerializer(serializers.Serializer):
    """Serializer for ROI calculation requests."""
    initial_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    annual_savings = serializers.DecimalField(max_digits=12, decimal_places=2)
    lifespan_years = serializers.IntegerField(min_value=1)
    maintenance_cost_per_year = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    def validate(self, data):
        """Validate the ROI calculation data."""
        if data['initial_cost'] <= 0:
            raise serializers.ValidationError("Initial cost must be greater than zero.")
        if data['annual_savings'] < 0:
            raise serializers.ValidationError("Annual savings cannot be negative.")
        if data['maintenance_cost_per_year'] < 0:
            raise serializers.ValidationError("Maintenance cost cannot be negative.")
        return data
