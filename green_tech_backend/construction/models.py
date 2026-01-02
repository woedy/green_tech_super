import json
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from accounts.models import User
from properties.models import Property


class EcoFeature(models.Model):
    """Model representing eco-friendly features available in Ghana."""
    class FeatureCategory(models.TextChoices):
        SOLAR = 'SOLAR', _('Solar Energy')
        WATER = 'WATER', _('Water Conservation')
        MATERIALS = 'MATERIALS', _('Eco-friendly Materials')
        WASTE = 'WASTE', _('Waste Management')
        LANDSCAPING = 'LANDSCAPING', _('Sustainable Landscaping')
        INSULATION = 'INSULATION', _('Insulation & Ventilation')
        SMART_HOME = 'SMART_HOME', _('Smart Home Technology')

    name = models.CharField(_('feature name'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=FeatureCategory.choices
    )
    icon = models.CharField(
        _('icon class'),
        max_length=50,
        blank=True,
        help_text=_('CSS class for the feature icon')
    )
    base_cost = models.DecimalField(
        _('base cost'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text=_('Base cost in GHS')
    )
    is_available = models.BooleanField(
        _('is available in Ghana'),
        default=True
    )
    requires_specialist = models.BooleanField(
        _('requires specialist installation'),
        default=False
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('eco feature')
        verbose_name_plural = _('eco features')
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


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
    
    # Sustainability features
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
        
        Args:
            step (str): The step identifier
            data (dict): The data to save for this step
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
            
            # Calculate cost based on selected eco-features and regional multipliers
            total_cost = base_cost
            eco_features = self.eco_features.all()
            
            for feature in eco_features:
                # Apply regional cost multiplier to each feature
                feature_cost = float(feature.base_cost or 0)
                if feature.category in region.cost_multipliers:
                    feature_cost *= region.cost_multipliers[feature.category]
                total_cost += feature_cost
            
            self.estimated_cost = total_cost
            self.save()
            return total_cost
            
        except GhanaRegion.DoesNotExist:
            return None
            
    def generate_specification_document(self):
        """
        Generate a PDF specification document for this construction request.
        
        Returns:
            tuple: (file_path, file_name) where file_path is the full path to the generated file
                   and file_name is the name of the file.
        """
        from .document_generator import generate_specification_document, generate_document_filename
        import os
        from django.conf import settings
        
        # Ensure the media directory exists
        media_root = settings.MEDIA_ROOT
        docs_dir = os.path.join(media_root, 'construction_docs', str(self.id))
        os.makedirs(docs_dir, exist_ok=True)
        
        # Generate the PDF
        pdf_file = generate_specification_document(self)
        
        # Save to file
        file_name = generate_document_filename(self, 'specification')
        file_path = os.path.join(docs_dir, file_name)
        
        with open(file_path, 'wb') as f:
            f.write(pdf_file.getvalue())
        
        # Create a document record
        from .models import ConstructionDocument
        
        doc = ConstructionDocument.objects.create(
            construction_request=self,
            title=f"Specification - {self.title}",
            document_type='SPECIFICATION',
            file=os.path.join('construction_docs', str(self.id), file_name),
            uploaded_by=self.client
        )
        
        return file_path, file_name


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
    file = models.FileField(
        _('file'),
        upload_to='construction/documents/'
    )
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
    """
    Model to track selected eco-features for a construction request.
    Includes quantity, customizations, and cost calculations.
    """
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
        validators=[MinValueValidator(1)]
    )
    customizations = models.JSONField(
        _('customizations'),
        default=dict,
        help_text=_('Customization options specific to this feature')
    )
    estimated_cost = models.DecimalField(
        _('estimated cost'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text=_('Calculated cost for this feature including regional adjustments')
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('construction request eco feature')
        verbose_name_plural = _('construction request eco features')
        unique_together = ('construction_request', 'eco_feature')
    
    def __str__(self):
        return f"{self.construction_request} - {self.eco_feature.name}"
    
    def calculate_cost(self):
        """Calculate the cost of this eco-feature including regional adjustments."""
        from construction.ghana.models import GhanaRegion
        
        if not self.construction_request.region:
            return None
            
        try:
            region = GhanaRegion.objects.get(name=self.construction_request.region)
            base_cost = float(self.eco_feature.base_cost or 0)
            
            # Apply regional cost multiplier if available
            if self.eco_feature.category in region.cost_multipliers:
                base_cost *= region.cost_multipliers[self.eco_feature.category]
            
            # Apply quantity
            total_cost = base_cost * self.quantity
            
            # Apply any customizations that affect cost
            for key, value in self.customizations.items():
                if isinstance(value, (int, float)) and key.startswith('cost_'):
                    total_cost += value
            
            self.estimated_cost = total_cost
            self.save()
            return total_cost
            
        except (GhanaRegion.DoesNotExist, KeyError):
            return None


class ProjectStatus(models.TextChoices):
    """Status of a construction project."""
    PLANNING = 'PLANNING', _('Planning')
    PENDING_APPROVAL = 'PENDING', _('Pending Approval')
    APPROVED = 'APPROVED', _('Approved')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    ON_HOLD = 'ON_HOLD', _('On Hold')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')


class Project(models.Model):
    """Model for construction projects with sustainability tracking."""
    # Core project information
    name = models.CharField(_('project name'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    status = models.CharField(
        _('status'),
        max_length=15,
        choices=ProjectStatus.choices,
        default=ProjectStatus.PLANNING
    )
    construction_request = models.OneToOneField(
        ConstructionRequest,
        on_delete=models.PROTECT,
        related_name='project',
        verbose_name=_('construction request'),
        null=True,
        blank=True
    )
    
    # Project timeline
    start_date = models.DateField(_('start date'), null=True, blank=True)
    estimated_end_date = models.DateField(_('estimated end date'), null=True, blank=True)
    actual_end_date = models.DateField(_('actual end date'), null=True, blank=True)
    
    # Budget and financials
    estimated_budget = models.DecimalField(
        _('estimated budget'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    actual_cost = models.DecimalField(
        _('actual cost'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='GHS'
    )
    
    # Sustainability metrics
    energy_efficiency_rating = models.PositiveSmallIntegerField(
        _('energy efficiency rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Energy efficiency rating (1-5)')
    )
    water_efficiency_rating = models.PositiveSmallIntegerField(
        _('water efficiency rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Water efficiency rating (1-5)')
    )
    sustainability_score = models.PositiveSmallIntegerField(
        _('sustainability score'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True,
        help_text=_('Overall sustainability score (0-100)')
    )
    co2_emissions_saved = models.DecimalField(
        _('CO2 emissions saved'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('CO2 emissions saved in tons')
    )
    water_saved = models.DecimalField(
        _('water saved'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Water saved in cubic meters')
    )
    
    # Project team
    project_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='managed_projects',
        verbose_name=_('project manager'),
        null=True,
        blank=True
    )
    site_supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='supervised_projects',
        verbose_name=_('site supervisor'),
        null=True,
        blank=True
    )
    contractors = models.ManyToManyField(
        User,
        related_name='contracted_projects',
        verbose_name=_('contractors'),
        blank=True
    )
    
    # Project details
    location = models.TextField(_('location'), blank=True)
    gps_coordinates = models.CharField(
        _('GPS coordinates'),
        max_length=50,
        blank=True,
        help_text=_('Latitude,Longitude')
    )
    
    # Ghana-specific details
    region = models.CharField(_('region'), max_length=100, blank=True)
    district = models.CharField(_('district'), max_length=100, blank=True)
    
    # Project documentation
    notes = models.TextField(_('notes'), blank=True)
    
    # Metadata
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='created_projects',
        verbose_name=_('created by'),
        null=True
    )
    
    class Meta:
        verbose_name = _('project')
        verbose_name_plural = _('projects')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"
    
    @property
    def is_active(self):
        return self.status in [
            ProjectStatus.PLANNING,
            ProjectStatus.APPROVED,
            ProjectStatus.IN_PROGRESS
        ]
    
    @property
    def duration_days(self):
        if self.start_date and self.actual_end_date:
            return (self.actual_end_date - self.start_date).days
        return None
    
    def calculate_sustainability_score(self):
        """Calculate the overall sustainability score based on various metrics."""
        # This is a simplified calculation - can be expanded based on specific requirements
        score = 0
        total_possible = 0
        
        # Energy efficiency (max 35 points)
        if self.energy_efficiency_rating:
            score += self.energy_efficiency_rating * 7  # 5*7=35
            total_possible += 35
        
        # Water efficiency (max 30 points)
        if self.water_efficiency_rating:
            score += self.water_efficiency_rating * 6  # 5*6=30
            total_possible += 30
        
        # CO2 emissions saved (max 20 points)
        if self.co2_emissions_saved is not None:
            # Example: 10+ tons saved = max points
            co2_points = min(20, (self.co2_emissions_saved / 10) * 20)
            score += co2_points
            total_possible += 20
        
        # Water saved (max 15 points)
        if self.water_saved is not None:
            # Example: 50+ cubic meters saved = max points
            water_points = min(15, (self.water_saved / 50) * 15)
            score += water_points
            total_possible += 15
        
        # Calculate final score (0-100)
        if total_possible > 0:
            self.sustainability_score = round((score / total_possible) * 100)
        
        return self.sustainability_score
