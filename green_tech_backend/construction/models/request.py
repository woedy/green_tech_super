from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError

from accounts.models import User
from properties.models import Property
from construction.ghana.models import EcoFeature


class ConstructionType(models.TextChoices):
    """Types of construction projects."""
    NEW_CONSTRUCTION = 'NEW', _('New Construction')
    RENOVATION = 'RENO', _('Renovation')
    EXTENSION = 'EXT', _('Extension')
    LANDSCAPING = 'LAND', _('Landscaping')
    INTERIOR = 'INT', _('Interior Design')


class ConstructionStatus(models.TextChoices):
    """Status of a construction project."""
    DRAFT = 'DRAFT', _('Draft')
    PENDING_APPROVAL = 'PENDING', _('Pending Approval')
    APPROVED = 'APPROVED', _('Approved')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    ON_HOLD = 'ON_HOLD', _('On Hold')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')


class ConstructionRequestStep(models.TextChoices):
    """Steps in the construction request process."""
    PROJECT_DETAILS = 'project_details', _('Project Details')
    LOCATION = 'location', _('Location')
    ECO_FEATURES = 'eco_features', _('Eco Features')
    BUDGET = 'budget', _('Budget')
    REVIEW = 'review', _('Review & Submit')


class ConstructionRequest(models.Model):
    """Model for construction project requests with multi-step customization."""
    title = models.CharField(_('title'), max_length=200)
    current_step = models.CharField(
        _('current step'),
        max_length=20,
        choices=ConstructionRequestStep.choices,
        default=ConstructionRequestStep.PROJECT_DETAILS
    )
    is_completed = models.BooleanField(_('is completed'), default=False)
    customization_data = models.JSONField(
        _('customization data'),
        default=dict,
        help_text=_('Stores data from each step of the customization process')
    )
    description = models.TextField(_('description'), blank=True)
    construction_type = models.CharField(
        _('construction type'),
        max_length=10,
        choices=ConstructionType.choices,
        default=ConstructionType.NEW_CONSTRUCTION
    )
    status = models.CharField(
        _('status'),
        max_length=15,
        choices=ConstructionStatus.choices,
        default=ConstructionStatus.DRAFT
    )

    # Property details
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='construction_requests',
        verbose_name=_('property'),
        null=True,
        blank=True
    )

    # Location details (if no property associated)
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    region = models.CharField(_('region'), max_length=100, blank=True)

    # Project details
    start_date = models.DateField(_('start date'), null=True, blank=True)
    estimated_end_date = models.DateField(_('estimated end date'), null=True, blank=True)
    actual_end_date = models.DateField(_('actual end date'), null=True, blank=True)
    budget = models.DecimalField(
        _('budget'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text=_('Estimated total budget in GHS')
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='GHS',
        help_text=_('Currency code (e.g., GHS, USD)')
    )
    estimated_cost = models.DecimalField(
        _('estimated cost'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text=_('Calculated estimated cost based on selected features and regional pricing')
    )

    # Sustainability features (targets)
    target_energy_rating = models.PositiveSmallIntegerField(
        _('target energy rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Target energy efficiency rating (1-5)')
    )
    target_water_rating = models.PositiveSmallIntegerField(
        _('target water rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Target water efficiency rating (1-5)')
    )
    target_sustainability_score = models.PositiveSmallIntegerField(
        _('target sustainability score'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True,
        help_text=_('Target overall sustainability score (0-100)')
    )

    # Project team
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='construction_requests',
        verbose_name=_('client')
    )
    project_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='managed_construction_requests',
        verbose_name=_('project manager'),
        null=True,
        blank=True
    )
    contractors = models.ManyToManyField(
        User,
        related_name='contracted_construction_requests',
        verbose_name=_('contractors'),
        blank=True
    )

    # Metadata
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('construction request')
        verbose_name_plural = _('construction requests')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_construction_type_display()}"

    def save_step_data(self, step, data):
        """
        Save data for a specific step in the customization process.
        """
        if not self.customization_data:
            self.customization_data = {}
        self.customization_data[step] = data
        self.current_step = step
        self.save()

    def update_estimated_cost(self):
        """Update the estimated cost based on selected eco-features and regional pricing."""
        from construction.ghana.models import GhanaRegion
        if not self.region:
            return None
        try:
            region = GhanaRegion.objects.get(name=self.region)
            base_cost = float(self.budget or 0)
            total_cost = base_cost
            eco_features = self.eco_features.all() if hasattr(self, 'eco_features') else []
            for feature in eco_features:
                feature_cost = float(feature.base_cost or 0)
                if feature.category in region.cost_multipliers:
                    feature_cost *= region.cost_multipliers[feature.category]
                total_cost += feature_cost
            self.estimated_cost = total_cost
            self.save()
            return total_cost
        except GhanaRegion.DoesNotExist:
            return None


class ConstructionMilestone(models.Model):
    """Milestones for construction projects."""
    construction_request = models.ForeignKey(
        ConstructionRequest,
        on_delete=models.CASCADE,
        related_name='milestones',
        verbose_name=_('construction request')
    )
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    due_date = models.DateField(_('due date'))
    completed_date = models.DateField(_('completed date'), null=True, blank=True)
    is_completed = models.BooleanField(_('is completed'), default=False)

    class Meta:
        ordering = ['due_date']
        verbose_name = _('construction milestone')
        verbose_name_plural = _('construction milestones')

    def __str__(self):
        return f"{self.title} - {self.construction_request.title}"


class ConstructionDocument(models.Model):
    """Documents related to a construction project."""
    class DocumentType(models.TextChoices):
        PLAN = 'PLAN', _('Architectural Plan')
        PERMIT = 'PERMIT', _('Building Permit')
        CONTRACT = 'CONTRACT', _('Contract')
        INVOICE = 'INVOICE', _('Invoice')
        REPORT = 'REPORT', _('Report')
        PHOTO = 'PHOTO', _('Progress Photo')
        OTHER = 'OTHER', _('Other')

    construction_request = models.ForeignKey(
        ConstructionRequest,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name=_('construction request')
    )
    document_type = models.CharField(
        _('document type'),
        max_length=10,
        choices=DocumentType.choices,
        default=DocumentType.OTHER
    )
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    file = models.FileField(_('file'), upload_to='construction/documents/')
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_construction_documents',
        verbose_name=_('uploaded by')
    )
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = _('construction document')
        verbose_name_plural = _('construction documents')

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.title}"


class ConstructionRequestEcoFeature(models.Model):
    """Through model for eco-features selected in a construction request."""
    construction_request = models.ForeignKey(
        ConstructionRequest,
        on_delete=models.CASCADE,
        related_name='selected_eco_features',
        verbose_name=_('construction request')
    )
    eco_feature = models.ForeignKey(
        EcoFeature,
        on_delete=models.CASCADE,
        related_name='construction_requests',
        verbose_name=_('eco feature')
    )
    quantity = models.PositiveIntegerField(
        _('quantity'),
        default=1,
        validators=[MinValueValidator(1)],
        help_text=_('Number of units of this eco feature')
    )
    custom_specifications = models.TextField(
        _('custom specifications'),
        blank=True,
        help_text=_('Any custom specifications for this eco feature')
    )
    estimated_cost = models.DecimalField(
        _('estimated cost'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text=_('Estimated cost for this eco feature in GHS')
    )
    is_approved = models.BooleanField(
        _('is approved'),
        default=False,
        help_text=_('Whether this eco feature has been approved for the project')
    )
    added_at = models.DateTimeField(_('added at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('construction request eco feature')
        verbose_name_plural = _('construction request eco features')
        unique_together = ('construction_request', 'eco_feature')
        ordering = ['eco_feature__category', 'eco_feature__name']

    def __str__(self):
        return f"{self.construction_request.title} - {self.eco_feature.name}"

    def calculate_estimated_cost(self):
        """Calculate the estimated cost based on quantity and regional pricing."""
        if not self.construction_request.region:
            return None
        
        try:
            from construction.ghana.models import GhanaPricing, GhanaRegion
            region = GhanaRegion.objects.get(name=self.construction_request.region)
            pricing = GhanaPricing.objects.get(
                region=region,
                eco_feature=self.eco_feature,
                is_active=True
            )
            base_cost = pricing.get_adjusted_price()
            total_cost = base_cost * self.quantity
            self.estimated_cost = total_cost
            self.save()
            return total_cost
        except (GhanaRegion.DoesNotExist, GhanaPricing.DoesNotExist):
            return None
