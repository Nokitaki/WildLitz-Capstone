# backend/wildlitz/wildlitz/views.py
from django.http import HttpResponse

def home_view(request):
    """Simple home view to test the root URL"""
    return HttpResponse("<h1>Welcome to WildLitz</h1><p>The app is running correctly.</p>")