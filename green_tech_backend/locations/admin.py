from django.contrib import admin
from .models import Region


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'currency_code', 'cost_multiplier', 'is_active')
    list_filter = ('country', 'is_active')
    search_fields = ('name', 'country')
    prepopulated_fields = {'slug': ('name',)}
