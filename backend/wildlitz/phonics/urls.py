# phonics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Vanishing game word generation endpoint
    path('generate-vanishing-words/', views.generate_vanishing_game_words, name='generate_vanishing_words'),
    
    # Text-to-speech endpoint
    path('text-to-speech/', views.text_to_speech_enhanced, name='text_to_speech'),
    
    # Progress tracking endpoint for phonics games
    path('log-game-result/', views.log_phonics_game_result, name='log_phonics_game_result'),
]