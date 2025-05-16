#backend/wildlitz/phonemics/admin.py
from django.contrib import admin
from .models import SafariAnimal

@admin.register(SafariAnimal)
class SafariAnimalAdmin(admin.ModelAdmin):
    list_display = ('name', 'target_sound', 'sound_position', 'environment', 'difficulty_level')
    list_filter = ('target_sound', 'sound_position', 'environment', 'difficulty_level')
    search_fields = ('name', 'target_sound')
    ordering = ('name',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'target_sound', 'sound_position')
        }),
        ('Game Settings', {
            'fields': ('environment', 'difficulty_level')
        }),
        ('Media', {
            'fields': ('image_url',)
        }),
    )