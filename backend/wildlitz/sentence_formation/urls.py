# sentence_formation/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Main story generation endpoint
    path('generate-story/', views.generate_story, name='generate_story'),
    
    # Add a simple test endpoint to verify the API is working
    path('test/', views.test_endpoint, name='test_endpoint'),

    # Crossword puzzle generation endpoints
    path('generate-clues/', views.generate_crossword_clues, name='generate_crossword_clues'),
    path('generate-choices/', views.generate_answer_choices, name='generate_answer_choices'),
    
    # Progress tracking endpoint for crossword and sentence building activities
    path('log-activity/', views.log_crossword_activity, name='log_crossword_activity'),
]