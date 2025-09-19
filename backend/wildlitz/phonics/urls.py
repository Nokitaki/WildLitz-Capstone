
from django.urls import path
from . import views

urlpatterns = [
    path('generate-vanishing-words/', views.generate_vanishing_words, name='generate_vanishing_words'),
    path('test/', views.test_phonics_endpoint, name='test_phonics'),
]