from django.contrib import admin
from django.utils.html import format_html
from .models import (
    CaseStudy, CaseStudyImage, EducationalContent,
    ExpertProfile, ConsultationSlot, ConsultationBooking,
    ProjectShowcase, ProjectGalleryImage
)


class CaseStudyImageInline(admin.TabularInline):
    model = CaseStudyImage
    extra = 1
    fields = ('image', 'caption', 'is_primary', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(CaseStudy)
class CaseStudyAdmin(admin.ModelAdmin):
    list_display = ('title', 'project_type', 'location', 'featured', 'published', 'created_at')
    list_filter = ('project_type', 'featured', 'published', 'created_at')
    search_fields = ('title', 'overview', 'location')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [CaseStudyImageInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'project', 'property', 'location', 'project_type')
        }),
        ('Content', {
            'fields': ('overview', 'challenge', 'solution', 'results')
        }),
        ('Metrics', {
            'fields': ('energy_savings', 'water_savings', 'cost_savings', 'co2_reduction')
        }),
        ('Status', {
            'fields': ('featured', 'published')
        }),
    )


@admin.register(EducationalContent)
class EducationalContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'content_type', 'category', 'author', 'published', 'published_date')
    list_filter = ('content_type', 'category', 'published', 'published_date')
    search_fields = ('title', 'summary', 'content')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_date'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'content_type', 'category', 'author', 'featured_image')
        }),
        ('Body', {
            'fields': ('summary', 'content', 'external_url', 'duration_minutes')
        }),
        ('Status', {
            'fields': ('published', 'published_date')
        }),
        ('Metadata', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at')
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.author_id:
            obj.author = request.user
        super().save_model(request, obj, form, change)


class ConsultationSlotInline(admin.TabularInline):
    model = ConsultationSlot
    extra = 0
    fields = ('start_time', 'end_time', 'is_booked')
    readonly_fields = ('is_booked', 'created_at', 'updated_at')


@admin.register(ExpertProfile)
class ExpertProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'expertise', 'years_experience', 'hourly_rate', 'available_for_consultation', 'is_featured')
    list_filter = ('expertise', 'available_for_consultation', 'is_featured')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'qualifications')
    inlines = [ConsultationSlotInline]
    fieldsets = (
        ('Expert Information', {
            'fields': ('user', 'bio', 'expertise', 'years_experience', 'qualifications')
        }),
        ('Contact & Availability', {
            'fields': ('languages', 'hourly_rate', 'available_for_consultation', 'is_featured')
        }),
        ('Media & Links', {
            'fields': ('profile_picture', 'linkedin_url', 'website_url')
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('user',)
        return self.readonly_fields


@admin.register(ConsultationBooking)
class ConsultationBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'expert', 'slot_time', 'status', 'created_at')
    list_filter = ('status', 'expert', 'created_at')
    search_fields = ('user__email', 'expert__user__email', 'topic')
    readonly_fields = ('created_at', 'updated_at')
    
    def slot_time(self, obj):
        return f"{obj.slot.start_time.strftime('%Y-%m-%d %H:%M')} - {obj.slot.end_time.strftime('%H:%M')}"
    slot_time.short_description = 'Time Slot'


class ProjectGalleryImageInline(admin.TabularInline):
    model = ProjectGalleryImage
    extra = 1
    fields = ('image', 'caption', 'is_primary', 'order')
    ordering = ('order',)


@admin.register(ProjectShowcase)
class ProjectShowcaseAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'featured', 'featured_order', 'is_published', 'created_at')
    list_filter = ('featured', 'is_published', 'created_at')
    search_fields = ('title', 'description', 'project__name')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProjectGalleryImageInline]
    filter_horizontal = ('sustainability_features',)
    fieldsets = (
        ('Basic Information', {
            'fields': ('project', 'title', 'slug', 'description')
        }),
        ('Display Options', {
            'fields': ('featured', 'featured_order', 'sustainability_features', 'is_published')
        }),
    )


@admin.register(ProjectGalleryImage)
class ProjectGalleryImageAdmin(admin.ModelAdmin):
    list_display = ('showcase', 'image_preview', 'is_primary', 'order')
    list_editable = ('is_primary', 'order')
    list_filter = ('showcase', 'is_primary')
    search_fields = ('showcase__title', 'caption')
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Preview'
    image_preview.allow_tags = True
