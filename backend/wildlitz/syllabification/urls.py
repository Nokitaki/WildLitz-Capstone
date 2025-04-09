# In syllabification/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate-words/', views.generate_syllabification_words, name='generate_syllabification_words'),
    path('get-word/', views.get_syllabification_word, name='get_syllabification_word'),
    path('check-clapping/', views.check_syllable_clapping, name='check_syllable_clapping'),
    path('generate-challenge/', views.generate_new_challenge, name='generate_new_challenge'),
    path('syllable-sounds/', views.get_syllable_sounds, name='get_syllable_sounds'),
]