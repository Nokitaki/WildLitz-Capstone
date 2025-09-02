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
]