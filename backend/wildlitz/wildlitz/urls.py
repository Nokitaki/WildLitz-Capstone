# backend/wildlitz/wildlitz/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from . import views  # Import the views from current directory
from api.views import (
    register_user, 
    get_user_profile, 
    log_user_activity, 
    get_user_progress, 
    get_user_analytics,
    get_my_progress_summary,      # 🔥 ADD
    get_my_accuracy_over_time,    # 🔥 ADD
    get_my_most_missed_words,     # 🔥 ADD
)

urlpatterns = [
    path('', views.home_view, name='home'),  # Root URL
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/auth/register/', register_user, name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/auth/me/', get_user_profile, name='user_profile'),
    
    # Progress tracking endpoints
    path('api/progress/log/', log_user_activity, name='log_activity'),
    path('api/progress/', get_user_progress, name='user_progress'),
    path('api/analytics/', get_user_analytics, name='user_analytics'),
    
    # 🔥 ADD THESE THREE LINES
    path('api/get-my-progress-summary/', get_my_progress_summary, name='get_my_progress_summary'),
    path('api/get-my-accuracy-over-time/', get_my_accuracy_over_time, name='get_my_accuracy_over_time'),
    path('api/get-my-most-missed-words/', get_my_most_missed_words, name='get_my_most_missed_words'),
    
    # Your existing app URLs
    path('api/syllabification/', include('syllabification.urls')),
    path('api/phonics/', include('phonics.urls')),  # Add phonics URLs
    path('api/phonemics/', include('phonemics.urls')),
    path('api/sentence_formation/', include('sentence_formation.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)