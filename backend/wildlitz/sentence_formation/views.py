from django.http import JsonResponse
from rest_framework.decorators import api_view
import json
import random
from datetime import datetime
import openai
from django.conf import settings
from django.core.cache import cache
# Set OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY

@api_view(['POST'])
def generate_story(request):
    """Story generator endpoint using OpenAI"""
    try:
        # Parse request data
        data = json.loads(request.body)
        theme = data.get('theme', 'adventure')
        focus_skills = data.get('focusSkills', [])
        character_names = data.get('characterNames', '')
        episode_count = data.get('episodeCount', 3)
        
        # Use provided character names or generate defaults
        if character_names:
            characters = [name.strip() for name in character_names.split(',')][:2]
        else:
            # Default character pairs by theme
            theme_characters = {
                'ocean': ['Marina', 'Finn'],
                'farm': ['Daisy', 'Tucker'],
                'city': ['Mia', 'Oliver'],
                'jungle': ['Maya', 'Leo'],
                'space': ['Sam', 'Ava']
            }
            characters = theme_characters.get(theme, ['Alex', 'Jamie'])
        
        # Generate a unique ID for this story
        story_id = f"generated_{theme}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create story structure
        story_title = f"The {theme.title()} Adventure"
        description = f"Join {characters[0]} and {characters[1]} as they explore and discover the wonders of {theme}!"
        
        # Generate episodes
        episodes = []
        for i in range(episode_count):
            episode_id = f"{theme}_generated_ep{i+1}"
            puzzle_id = f"{episode_id}_puzzle"
            
            # Generate story content with OpenAI
            episode_content = generate_episode_with_ai(
                theme, 
                characters, 
                focus_skills, 
                i+1, 
                episode_count
            )
            
            episodes.append({
                "id": episode_id,
                "episodeNumber": i + 1,
                "title": episode_content['title'],
                "text": episode_content['text'],
                "recap": episode_content['recap'],
                "discussionQuestions": episode_content['discussion_questions'],
                "crosswordPuzzleId": puzzle_id,
                "vocabularyFocus": episode_content['vocabulary_words']
            })
        
        # Generate simple puzzles based on vocabulary words
        puzzles = {}
        for episode in episodes:
            puzzle_id = episode["crosswordPuzzleId"]
            vocabulary = episode["vocabularyFocus"]
            
            puzzle_words = []
            for idx, word in enumerate(vocabulary):
                puzzle_words.append({
                    "direction": "across" if idx % 2 == 0 else "down",
                    "number": idx + 1,
                    "clue": generate_word_clue(word, focus_skills),
                    "answer": word.upper(),
                    "definition": f"A word that means {word}",
                    "example": f"The {word} was very interesting."
                })
            
            puzzles[puzzle_id] = {
                "size": {"width": 10, "height": 10},
                "grid": [],  # Empty for now - would be populated in a full implementation
                "words": puzzle_words
            }
        
        # Build response
        response_data = {
            "story": {
                "id": story_id,
                "title": story_title,
                "description": description,
                "gradeLevel": "Grade 3",
                "readingLevel": "Early Chapter Book",
                "episodes": episodes
            },
            "puzzles": puzzles
        }
        
        return JsonResponse(response_data)
    
    except Exception as e:
        # Return a helpful error message
        print(f"Error generating story: {str(e)}")
        return JsonResponse({
            "error": str(e),
            "message": "There was an error generating the story."
        }, status=500)

def generate_episode_with_ai(theme, characters, focus_skills, episode_number, total_episodes):
    """Generate a story episode using OpenAI"""
    
    # Calculate episode position in the story arc
    if episode_number == 1:
        episode_position = "beginning"
    elif episode_number == total_episodes:
        episode_position = "conclusion"
    else:
        episode_position = "middle"
    
    # Skill list for prompt
    skills_list = ", ".join(focus_skills)
    
    # Create a prompt for GPT
    prompt = f"""
    Create a short educational story episode for 3rd grade children about a {theme} adventure.
    
    Characters: {characters[0]} and {characters[1]}
    Focus skills: {skills_list}
    Episode: {episode_number} of {total_episodes} (the {episode_position} of the story)
    
    Include 5 vocabulary words that are appropriate for 3rd graders and relate to the focus skills.
    Make sure the story naturally incorporates these vocabulary words.
    The story should be 3-4 sentences long and educational but fun.
    
    Format your response as JSON with the following structure:
    {{
        "title": "Episode title",
        "text": "Story text with vocabulary words naturally incorporated",
        "recap": "One-sentence summary of the episode",
        "vocabulary_words": ["word1", "word2", "word3", "word4", "word5"],
        "discussion_questions": ["Question 1?", "Question 2?", "Question 3?"]
    }}
    """
    
    try:
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational content creator who writes engaging, age-appropriate stories for elementary school children."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=700
        )
        
        # Extract and parse response
        content = response.choices[0].message.content
        # Extract JSON from the possibly text-wrapped response
        import re
        json_match = re.search(r'({.*})', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        
        episode_data = json.loads(content)
        
        return episode_data
    
    except Exception as e:
        print(f"Error with OpenAI API: {str(e)}")
        # Fallback content in case of API failure
        return {
            "title": f"Episode {episode_number}: The {theme.title()} Adventure",
            "text": f"This is a story about {characters[0]} and {characters[1]} on their {theme} adventure. They explore and discover new things together.",
            "recap": f"A {theme} adventure with {characters[0]} and {characters[1]}.",
            "vocabulary_words": ["adventure", "discover", "journey", "explore", "mystery"],
            "discussion_questions": [
                "What did you learn from this story?",
                "What was your favorite part?",
                "What do you think will happen next?"
            ]
        }

def generate_word_clue(word, focus_skills):
    """Generate an appropriate clue for a vocabulary word"""
    
    # Basic clue template
    clue = f"Word that means {word}"
    
    # Enhance clue based on focus skills
    if 'sight-words' in focus_skills:
        clue = f"Sight word: {word}"
    
    if 'phonics-sh-sound' in focus_skills and 'sh' in word:
        clue = f"Word with the 'sh' sound"
    
    if 'phonics-ch-sound' in focus_skills and 'ch' in word:
        clue = f"Word with the 'ch' sound"
    
    if 'compound-words' in focus_skills and len(word) > 6:
        clue = f"Word made of two smaller words"
    
    if 'action-verbs' in focus_skills:
        clue = f"Action word: to {word}"
    
    return clue

@api_view(['POST'])
def generate_story(request):
    # Generate a cache key based on parameters
    cache_params = json.loads(request.body)
    refresh = cache_params.pop('refresh', False)  # Extract refresh flag
    cache_key = f"story_{'_'.join(str(v) for v in cache_params.values())}"
    
    # If refresh is False and we have cached data, return it
    if not refresh and cache.get(cache_key):
        return JsonResponse(cache.get(cache_key))
    
    # Generate new story as before...
    # [existing code here]
    
    # Cache the response (for 1 hour)
    cache.set(cache_key, response_data, 3600)
    
    return JsonResponse(response_data)