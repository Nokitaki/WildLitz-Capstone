# sentence_formation/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ==================== EXISTING ROUTES ====================
    # Main story generation endpoint
    path('generate-story/', views.generate_story, name='generate_story'),
    
    # Add a simple test endpoint to verify the API is working
    path('test/', views.test_endpoint, name='test_endpoint'),

    # Crossword puzzle generation endpoints - FIXED FUNCTION NAMES
    path('generate-clues/', views.generate_crossword_clues, name='generate_crossword_clues'),  # ✅ CORRECTED
    path('generate-choices/', views.generate_answer_choices, name='generate_answer_choices'),
    
    # Progress tracking endpoint for crossword and sentence building activities
    path('log-activity/', views.log_crossword_activity, name='log_crossword_activity'),
    
    # ==================== STORY ANALYTICS ROUTES ====================
    # Story Game Session Management
    path('story/session/create/', views.create_story_session, name='create_story_session'),
    path('story/session/<str:session_id>/update/', views.update_story_session, name='update_story_session'),
    path('story/session/<str:session_id>/', views.get_session_details, name='get_session_details'),
    path('story/session/<str:session_id>/delete/', views.delete_story_session, name='delete_story_session'),
    
    # Activity Logging
    path('story/activity/log/', views.log_story_activity, name='log_story_activity'),
    
    # Analytics
    path('story/analytics/', views.get_story_analytics, name='get_story_analytics'),
]