# phonics/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Vanishing game word generation endpoint
    path('generate-vanishing-words/', views.generate_vanishing_game_words, name='generate_vanishing_words'),
    path('text-to-speech/', views.text_to_speech_enhanced, name='text_to_speech'),
]