# backend/wildlitz/phonemics/urls.py
# UPDATED: Added get-session-rounds endpoint

from django.urls import path
from . import views

urlpatterns = [
    # Main game endpoints
    path('animals/', views.get_safari_animals_by_sound, name='get_safari_animals'),
    path('random-sound/', views.get_random_sound, name='get_random_sound'),
    path('sound-examples/', views.get_sound_examples, name='get_sound_examples'),
    path('submit-results/', views.submit_game_results, name='submit_game_results'),

    # Analytics endpoints
    path('save-safari-session/', views.save_safari_game_session, name='save_safari_session'),
    path('get-safari-analytics/', views.get_safari_user_analytics, name='get_safari_analytics'),
    path('get-session-rounds/<uuid:session_id>/', views.get_session_rounds, name='get_session_rounds'),  # NEW
    
    # Utility endpoint for updating image URLs
    path('update-animal-images/', views.update_animal_images, name='update_animal_images'),
]