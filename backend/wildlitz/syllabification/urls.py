# In syllabification/urls.py
from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('generate-words/', views.generate_syllabification_words, name='generate_syllabification_words'),
    path('get-word/', views.get_syllabification_word, name='get_syllabification_word'),
    path('check-clapping/', views.check_syllable_clapping, name='check_syllable_clapping'),
    path('generate-challenge/', views.generate_new_challenge, name='generate_new_challenge'),
    path('syllable-sounds/', views.get_syllable_sounds, name='get_syllable_sounds'),
     path('text-to-speech/', views.text_to_speech, name='text_to_speech'),
    path('pronounce-word/', views.pronounce_word, name='pronounce_word'),
     path('test-tts/', views.test_tts, name='test_tts'),
      path('analyze-word/', views.analyze_word, name='analyze_word'),
      
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)