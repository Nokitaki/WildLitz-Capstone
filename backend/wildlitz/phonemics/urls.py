# backend/wildlitz/phonemics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('animals/', views.get_safari_animals_by_sound, name='get_safari_animals'),
    path('random-sound/', views.get_random_sound, name='get_random_sound'),
    path('sound-examples/', views.get_sound_examples, name='get_sound_examples'),
    path('submit-results/', views.submit_game_results, name='submit_game_results'),
]