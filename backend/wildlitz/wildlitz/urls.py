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
    get_user_analytics
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
    
    # Your existing app URLs
    path('api/syllabification/', include('syllabification.urls')),
    path('api/phonics/', include('phonics.urls')),  # Add phonics URLs
    path('api/phonemics/', include('phonemics.urls')),
    path('api/sentence_formation/', include('sentence_formation.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)