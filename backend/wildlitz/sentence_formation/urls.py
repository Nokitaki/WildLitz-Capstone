from django.urls import path
from . import views

urlpatterns = [
    # Main story generation endpoint
    path('generate-story/', views.generate_story, name='generate_story'),
    
    # Add a simple test endpoint to verify the API is working
    path('test/', views.test_endpoint, name='test_endpoint'),
]