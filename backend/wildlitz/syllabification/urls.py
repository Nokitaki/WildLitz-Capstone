# backend/wildlitz/syllabification/urls.py
from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Existing endpoints...
    path('get-word-supabase/', views.get_syllabification_word_from_supabase, name='get_syllabification_word_from_supabase'),
    path('get-word-batch/', views.get_word_batch, name='get_word_batch'),
    path('check-syllable-answer/', views.check_syllable_answer, name='check_syllable_answer'),
    path('get-syllable-pronunciation/', views.get_syllable_pronunciation, name='get_syllable_pronunciation'),
    path('generate-ai-content/', views.generate_ai_content, name='generate_ai_content'),
    
    # NEW ENDPOINTS FOR CUSTOM WORDS
    path('check-word-exists/', views.check_word_exists, name='check_word_exists'),
    path('validate-syllable-structure/', views.validate_syllable_structure, name='validate_syllable_structure'),
    path('create-custom-word/', views.create_custom_word, name='create_custom_word'),
    path('get-custom-words/', views.get_custom_words, name='get_custom_words'),
    path('search-words/', views.search_words, name='search_words'),
    path('delete-custom-word/<uuid:word_id>/', views.delete_custom_word, name='delete_custom_word'),
    path('update-custom-word/<uuid:word_id>/', views.update_custom_word, name='update_custom_word'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)