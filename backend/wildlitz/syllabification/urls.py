# backend/wildlitz/syllabification/urls.py
from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Only include the Supabase endpoint for now
    path('get-word-supabase/', views.get_syllabification_word_from_supabase, name='get_syllabification_word_from_supabase'),
    
    # Remove any endpoints that reference functions you've deleted
    # We can add these back one by one as you implement them
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)