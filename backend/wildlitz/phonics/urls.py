# phonics/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Vanishing game word generation endpoint
    path('generate-vanishing-words/', views.generate_vanishing_game_words, name='generate_vanishing_words'),
]