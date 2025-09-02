# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProgress(models.Model):
    """Track overall user progress across all modules"""
    
    MODULE_CHOICES = [
        ('syllabification', 'Syllabification'),
        ('phonemics', 'Phonemics'),
        ('phonics', 'Phonics'),
        ('sentence_formation', 'Sentence Formation'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    
    # Progress tracking
    total_attempts = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    total_time_spent = models.DurationField(default=timezone.timedelta(0))  # Total time in module
    
    # Performance metrics
    accuracy_percentage = models.FloatField(default=0.0)  # correct/total * 100
    average_time_per_question = models.FloatField(default=0.0)  # seconds
    
    # Progress tracking
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'module', 'difficulty')
        ordering = ['-last_activity']
    
    def update_progress(self, is_correct, time_spent=0):
        """Update progress after each activity"""
        self.total_attempts += 1
        if is_correct:
            self.correct_answers += 1
        
        self.total_time_spent += timezone.timedelta(seconds=time_spent)
        self.accuracy_percentage = (self.correct_answers / self.total_attempts) * 100 if self.total_attempts > 0 else 0
        self.average_time_per_question = self.total_time_spent.total_seconds() / self.total_attempts if self.total_attempts > 0 else 0
        self.save()
    
    def __str__(self):
        return f"{self.user.email} - {self.module} ({self.difficulty}) - {self.accuracy_percentage:.1f}%"


class UserActivity(models.Model):
    """Track detailed user activity for analytics"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.CharField(max_length=50, choices=UserProgress.MODULE_CHOICES)
    
    # Activity details
    activity_type = models.CharField(max_length=100)  # e.g., 'syllable_clapping', 'phonics_quiz'
    question_data = models.JSONField()  # Store the question/word that was asked
    user_answer = models.JSONField()  # Store user's response
    correct_answer = models.JSONField()  # Store correct answer
    is_correct = models.BooleanField()
    
    # Timing data
    time_spent = models.FloatField()  # seconds spent on this question
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Additional context
    difficulty = models.CharField(max_length=10, choices=UserProgress.DIFFICULTY_CHOICES)
    challenge_level = models.CharField(max_length=50, blank=True)  # e.g., 'simple_words', 'compound_words'
    learning_focus = models.CharField(max_length=50, blank=True)   # e.g., 'short_vowels', 'blends'
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.email} - {self.module} - {self.activity_type} - {'✓' if self.is_correct else '✗'}"


class UserSession(models.Model):
    """Track user login sessions for analytics"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    login_time = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    session_duration = models.DurationField(null=True, blank=True)
    
    # Session info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    def calculate_duration(self):
        """Calculate and save session duration"""
        if self.login_time and self.last_activity:
            self.session_duration = self.last_activity - self.login_time
            self.save()
    
    def __str__(self):
        return f"{self.user.email} - {self.login_time.strftime('%Y-%m-%d %H:%M')}"