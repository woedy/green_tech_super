from django.contrib import admin
from .models import Property, PropertyImage, PropertyInquiry, ViewingAppointment


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ('image_url', 'caption', 'is_primary', 'order')
    ordering = ('order',)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'property_type', 'listing_type', 'status', 'price', 'currency', 'city', 'region', 'featured')
    list_filter = ('property_type', 'listing_type', 'status', 'featured', 'region')
    search_fields = ('title', 'summary', 'description', 'city')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PropertyImageInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    list_display = ('property', 'name', 'email', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'property__title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ViewingAppointment)
class ViewingAppointmentAdmin(admin.ModelAdmin):
    list_display = ('property', 'scheduled_for', 'agent', 'status')
    list_filter = ('status', 'scheduled_for')
    search_fields = ('property__title', 'agent__email')
    readonly_fields = ('created_at', 'updated_at')
