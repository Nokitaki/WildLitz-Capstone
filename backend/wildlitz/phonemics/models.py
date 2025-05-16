#backend/wildlitz/phonemics/models.py
from django.db import models

class SafariAnimal(models.Model):
    """Model for safari animals used in the sound safari game"""
    
    SOUND_POSITION_CHOICES = [
        ('beginning', 'Beginning'),
        ('middle', 'Middle'),
        ('ending', 'Ending'),
    ]
    
    ENVIRONMENT_CHOICES = [
        ('jungle', 'Jungle'),
        ('savanna', 'Savanna'),
        ('ocean', 'Ocean'),
        ('arctic', 'Arctic'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    name = models.CharField(max_length=100)
    target_sound = models.CharField(max_length=10)
    sound_position = models.CharField(max_length=20, choices=SOUND_POSITION_CHOICES)
    environment = models.CharField(max_length=20, choices=ENVIRONMENT_CHOICES)
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'safari_animals'
        indexes = [
            models.Index(fields=['target_sound']),
            models.Index(fields=['difficulty_level']),
            models.Index(fields=['environment']),
            models.Index(fields=['sound_position']),
            models.Index(fields=['target_sound', 'difficulty_level', 'environment']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.target_sound})"