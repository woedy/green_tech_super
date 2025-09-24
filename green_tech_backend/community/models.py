from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.urls import reverse
from django.utils import timezone
from properties.models import Property, Project
from accounts.models import User

class CaseStudy(models.Model):
    """Model for showcasing completed projects with sustainability metrics."""
    PROJECT_TYPES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('community', 'Community'),
        ('institutional', 'Institutional'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='case_study', null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='case_studies')
    location = models.CharField(max_length=200, help_text="Project location in Ghana")
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPES)
    overview = models.TextField(help_text="Brief overview of the project")
    challenge = models.TextField(help_text="Challenges faced during the project")
    solution = models.TextField(help_text="Solutions implemented")
    results = models.TextField(help_text="Results and impact of the project")
    energy_savings = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage of energy savings")
    water_savings = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage of water savings")
    cost_savings = models.DecimalField(max_digits=10, decimal_places=2, help_text="Annual cost savings in GHS")
    co2_reduction = models.DecimalField(max_digits=10, decimal_places=2, help_text="Annual CO2 reduction in kg")
    featured = models.BooleanField(default=False)
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Case Studies'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.title}-{self.location}")
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('case-study-detail', kwargs={'slug': self.slug})


class CaseStudyImage(models.Model):
    """Images for case studies."""
    case_study = models.ForeignKey(CaseStudy, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='case_studies/images/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'created_at']


class EducationalContent(models.Model):
    """Model for educational articles and resources about sustainable building in Ghana."""
    CONTENT_TYPES = [
        ('article', 'Article'),
        ('guide', 'How-to Guide'),
        ('video', 'Video'),
        ('infographic', 'Infographic'),
        ('case_study', 'Case Study'),
    ]

    TOPIC_CATEGORIES = [
        ('design', 'Sustainable Design'),
        ('materials', 'Eco-friendly Materials'),
        ('energy', 'Energy Efficiency'),
        ('water', 'Water Conservation'),
        ('waste', 'Waste Management'),
        ('policy', 'Ghana Building Codes'),
        ('financing', 'Green Financing'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    category = models.CharField(max_length=20, choices=TOPIC_CATEGORIES)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    featured_image = models.ImageField(upload_to='education/featured/', blank=True, null=True)
    summary = models.TextField(blank=True)
    content = models.TextField(help_text="Main content (can include HTML)")
    external_url = models.URLField(blank=True, help_text="Link to external resource if applicable")
    duration_minutes = models.PositiveIntegerField(blank=True, null=True, help_text="Duration in minutes (for videos)")
    published = models.BooleanField(default=False)
    published_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_date', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if self.published and not self.published_date:
            self.published_date = timezone.now()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('education-detail', kwargs={'slug': self.slug})


class ExpertProfile(models.Model):
    """Profile for experts available for consultation."""
    EXPERTISE_CHOICES = [
        ('architecture', 'Sustainable Architecture'),
        ('engineering', 'Green Engineering'),
        ('energy', 'Energy Efficiency'),
        ('water', 'Water Management'),
        ('materials', 'Sustainable Materials'),
        ('finance', 'Green Financing'),
        ('policy', 'Policy & Regulations'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expert_profile')
    bio = models.TextField(help_text="Professional background and expertise")
    expertise = models.CharField(max_length=100, choices=EXPERTISE_CHOICES)
    years_experience = models.PositiveIntegerField()
    qualifications = models.TextField(help_text="Relevant qualifications and certifications")
    languages = models.CharField(max_length=200, default='English', help_text="Languages spoken (comma-separated)")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Hourly consultation rate in GHS")
    available_for_consultation = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='experts/profile_pics/', blank=True, null=True)
    linkedin_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', 'user__first_name']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_expertise_display()}"


class ConsultationSlot(models.Model):
    """Available time slots for expert consultations."""
    expert = models.ForeignKey(ExpertProfile, on_delete=models.CASCADE, related_name='available_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.expert.user.get_full_name()} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"


class ConsultationBooking(models.Model):
    """Bookings for expert consultations."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='booked_consultations')
    expert = models.ForeignKey(ExpertProfile, on_delete=models.CASCADE, related_name='consultation_bookings')
    slot = models.OneToOneField(ConsultationSlot, on_delete=models.CASCADE, related_name='booking')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultations')
    topic = models.CharField(max_length=200, help_text="Brief description of consultation topic")
    notes = models.TextField(blank=True, help_text="Any specific questions or details")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    meeting_link = models.URLField(blank=True, help_text="Video call link for the consultation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.expert.user.get_full_name()} - {self.slot.start_time.strftime('%Y-%m-%d')}"


class ProjectShowcase(models.Model):
    """Featured projects for the inspiration gallery."""
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='showcase')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(help_text="Brief description for the showcase")
    featured = models.BooleanField(default=False)
    featured_order = models.PositiveIntegerField(default=0, help_text="Order in featured projects (lower numbers first)")
    sustainability_features = models.ManyToManyField('properties.EcoFeature', blank=True, related_name='showcased_in')
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['featured_order', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.title}-{self.project_id}")
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('showcase-detail', kwargs={'slug': self.slug})


class ProjectGalleryImage(models.Model):
    """Images for project showcases."""
    showcase = models.ForeignKey(ProjectShowcase, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='showcase/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0, help_text="Order in gallery (lower numbers first)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name_plural = 'Project gallery images'

    def __str__(self):
        return f"{self.showcase.title} - {self.caption or 'Image'}"
