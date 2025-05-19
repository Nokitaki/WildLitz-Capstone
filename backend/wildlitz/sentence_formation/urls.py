# sentence_formation/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Make sure the path matches exactly what your frontend is requesting
    path('generate-story/', views.generate_story, name='generate_story'),
]

# main urls.py
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/sentence_formation/', include('sentence_formation.urls')),
    # ...
]