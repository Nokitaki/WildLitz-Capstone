# backend/wildlitz/syllabification/models.py
from django.db import models

class SyllabificationWord(models.Model):
    """Model to store words for syllabification practice"""
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    CATEGORY_CHOICES = [
        ('Animals', 'Animals'),
        ('Colors', 'Colors'),
        ('Food Items', 'Food Items'),
        ('Action Words', 'Action Words'),
        ('Places', 'Places'),
        ('Feelings', 'Feelings'),
        ('Common Objects', 'Common Objects'),
        ('Numbers', 'Numbers'),
        ('Custom Words', 'Custom Words'),
        ('General', 'General'),
    ]
    
    word = models.CharField(max_length=100)
    syllable_breakdown = models.CharField(max_length=200)
    syllable_count = models.IntegerField()
    difficulty_level = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='General')
    is_ai_generated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.word} ({self.syllable_count} syllables, {self.category})"
    
    class Meta:
        ordering = ['word']
        indexes = [
            models.Index(fields=['difficulty_level']),
            models.Index(fields=['word']),
            models.Index(fields=['category']),  # Add index for category lookups
        ]