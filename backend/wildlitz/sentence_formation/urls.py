# sentence_formation/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ==================== EXISTING ROUTES ====================
    # Main story generation endpoint
    path('generate-story/', views.generate_story, name='generate_story'),

    # ✅ NEW: Progressive episode generation endpoint
    path('generate-next-episode/', views.generate_next_episode, name='generate_next_episode'),
    
 

    # Crossword puzzle generation endpoints - FIXED FUNCTION NAMES
    path('generate-clues/', views.generate_crossword_clues, name='generate_crossword_clues'),  # ✅ CORRECTED
    path('generate-choices/', views.generate_answer_choices, name='generate_answer_choices'),
    
    # Progress tracking endpoint for crossword and sentence building activities
    path('log-activity/', views.log_crossword_activity, name='log_crossword_activity'),

    # Word explanation endpoint for Reading Helper
     path('explain-word/', views.explain_word, name='explain_word'),
    
    # ==================== STORY ANALYTICS ROUTES ====================
    # Story Game Session Management
    path('story/session/create/', views.create_story_session, name='create_story_session'),
    path('story/session/<uuid:session_id>/update/', views.update_story_session, name='update_story_session'),
    path('story/session/<uuid:session_id>/', views.get_session_details, name='get_session_details'),  # NEW
    path('story/activity/log/', views.log_story_activity, name='log_story_activity'),
    path('story/analytics/', views.get_story_analytics, name='get_story_analytics'),
    path('story/word-performance/', views.get_word_performance, name='get_word_performance'),  # NEW
    path('story/session/<uuid:session_id>/delete/', views.delete_story_session, name='delete_story_session'),
    
    # Activity Logging
    path('story/activity/log/', views.log_story_activity, name='log_story_activity'),
    
    # Analytics
    path('story/analytics/', views.get_story_analytics, name='get_story_analytics'),
    
]