from django.urls import path
from . import views

urlpatterns = [
    path('generate-vanishing-words/', views.generate_vanishing_words, name='generate_vanishing_words'),
    path('test/', views.test_phonics_endpoint, name='test_phonics'),
    
    # NEW: Analytics endpoints
    path('save-game-session/', views.save_game_session, name='save_game_session'),
    path('get-user-analytics/', views.get_user_analytics, name='get_user_analytics'),
    path('get-pattern-performance/', views.get_pattern_performance, name='get_pattern_performance'),
    path('log-game-result/', views.log_game_result, name='log_game_result'),
]