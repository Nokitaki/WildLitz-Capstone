# In syllabification/tests.py
from django.test import TestCase, Client
from django.urls import reverse
import json
from unittest.mock import patch
from .models import SyllabificationWord

class SyllabificationAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        # Create some test words
        SyllabificationWord.objects.create(
            word="apple", 
            syllable_breakdown="ap-ple", 
            syllable_count=2,
            difficulty_level="easy"
        )
        SyllabificationWord.objects.create(
            word="banana", 
            syllable_breakdown="ba-na-na", 
            syllable_count=3,
            difficulty_level="medium"
        )
    
    def test_get_syllabification_word(self):
        response = self.client.get(reverse('get_syllabification_word') + '?difficulty=easy')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['word'], 'apple')
        self.assertEqual(data['syllables'], 'ap-ple')
        self.assertEqual(data['count'], 2)
    
    @patch('syllabification.services.ChatGPTService.generate_syllabification_words')
    def test_generate_syllabification_words(self, mock_generate):
        # Mock the ChatGPT service response
        mock_generate.return_value = [
            {"word": "turtle", "syllables": "tur-tle", "count": 2},
            {"word": "elephant", "syllables": "el-e-phant", "count": 3}
        ]
        
        response = self.client.post(
            reverse('generate_syllabification_words'),
            json.dumps({'difficulty': 'medium', 'count': 2}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['words']), 2)
        # Check that words were saved to database
        self.assertTrue(SyllabificationWord.objects.filter(word='turtle').exists())