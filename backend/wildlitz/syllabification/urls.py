# backend/wildlitz/syllabification/urls.py
from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Existing endpoint for getting words from Supabase
    path('get-word-supabase/', views.get_syllabification_word_from_supabase, name='get_syllabification_word_from_supabase'),
    
    # New endpoint for batch word retrieval
    path('get-word-batch/', views.get_word_batch, name='get_word_batch'),
    
    # Other AI-related endpoints
    path('check-syllable-answer/', views.check_syllable_answer, name='check_syllable_answer'),
    path('get-syllable-pronunciation/', views.get_syllable_pronunciation, name='get_syllable_pronunciation'),
    path('generate-ai-content/', views.generate_ai_content, name='generate_ai_content'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)