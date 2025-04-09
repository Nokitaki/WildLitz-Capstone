# backend/wildlitz/syllabification/admin.py
from django.contrib import admin
from .models import SyllabificationWord

@admin.register(SyllabificationWord)
class SyllabificationWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'syllable_breakdown', 'syllable_count', 'difficulty_level', 'created_at')
    list_filter = ('difficulty_level', 'syllable_count', 'is_ai_generated')
    search_fields = ('word',)
    readonly_fields = ('created_at',)