# backend/wildlitz/wildlitz/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views  # Import the views from current directory

urlpatterns = [
    path('', views.home_view, name='home'),  # Root URL
    path('admin/', admin.site.urls),
    path('api/syllabification/', include('syllabification.urls')),
    path('api/phonics/', include('phonics.urls')),  # Add phonics URLs
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)