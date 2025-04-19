from supabase import create_client, Client
from django.conf import settings

supabase_url = settings.SUPABASE_URL
supabase_key = settings.SUPABASE_KEY

supabase: Client = create_client(supabase_url, supabase_key)