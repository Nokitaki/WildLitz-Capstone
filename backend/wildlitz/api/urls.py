# backend/wildlitz/api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_user, name='register_user'),
    path('auth/me/', views.get_user_profile, name='get_user_profile'),
    
    # JWT token endpoints (using built-in views for login and refresh)
    path('auth/login/', views.login_user, name='login_user'),  # We'll need to create this
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Progress tracking endpoints
    path('progress/log/', views.log_user_activity, name='log_user_activity'),
    path('progress/', views.get_user_progress, name='get_user_progress'),
    path('analytics/', views.get_user_analytics, name='get_user_analytics'),
    
        # ✅ ADD THESE NEW URLS FOR THE PROGRESS MODAL
    path('get-my-progress-summary/', views.get_my_progress_summary, name='get_my_progress_summary'),
    path('get-my-accuracy-over-time/', views.get_my_accuracy_over_time, name='get_my_accuracy_over_time'),
    path('get-my-most-missed-words/', views.get_my_most_missed_words, name='get_my_most_missed_words'),
]