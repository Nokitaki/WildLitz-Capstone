from django.http import JsonResponse
from rest_framework.decorators import api_view
import json
import random
from datetime import datetime
import openai
from django.conf import settings
from django.core.cache import cache
import traceback  # Add this for better error reporting

# Set OpenAI API key from settings
try:
    openai.api_key = settings.OPENAI_API_KEY
    print(f"OpenAI API key loaded: {'Key found' if settings.OPENAI_API_KEY else 'No key found'}")
except Exception as e:
    print(f"Error loading OpenAI API key: {str(e)}")
    
# Add a test endpoint to verify API connectivity
@api_view(['GET'])
def test_endpoint(request):
    """Simple test endpoint to verify the API is working"""
    return JsonResponse({
        "status": "success",
        "message": "API is working correctly",
        "openai_key_status": "available" if settings.OPENAI_API_KEY else "missing"
    })

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
        refresh = data.get('refresh', False)  # Extract refresh flag
        
        print(f"Generating story with theme: {theme}, skills: {focus_skills}, episodes: {episode_count}")
        
        # Use provided character names or generate defaults
        character_list = []
        if character_names:
            character_list = [name.strip() for name in character_names.split(',')]
        
        # Default character pairs by theme
        theme_characters = {
            'ocean': ['Marina', 'Finn'],
            'farm': ['Daisy', 'Tucker'],
            'city': ['Mia', 'Oliver'],
            'jungle': ['Maya', 'Leo'],
            'space': ['Sam', 'Ava']
        }
        
        # Make sure we have exactly 2 characters, using defaults if needed
        if len(character_list) < 2:
            default_chars = theme_characters.get(theme, ['Alex', 'Jamie'])
            # Add default characters as needed
            for i in range(2 - len(character_list)):
                if i < len(default_chars):
                    character_list.append(default_chars[i])
                else:
                    character_list.append(f"Character{i+1}")
        
        # Keep only the first 2 characters
        characters = character_list[:2]
        
        # Generate a unique ID for this story
        story_id = f"generated_{theme}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create story structure
        story_title = f"The {theme.title()} Adventure"
        description = f"Join {characters[0]} and {characters[1]} as they explore and discover the wonders of {theme}!"
        
        # Create default fallback story in case OpenAI API fails
        fallback_story = {
            "story": {
                "id": story_id,
                "title": story_title,
                "description": description,
                "gradeLevel": "Grade 3",
                "readingLevel": "Early Chapter Book",
                "episodes": []
            },
            "puzzles": {}
        }
        
        # Generate episodes
        episodes = []
        for i in range(episode_count):
            episode_id = f"{theme}_generated_ep{i+1}"
            puzzle_id = f"{episode_id}_puzzle"
            
            # Generate fallback episode
            fallback_episode = {
                "title": f"Episode {i+1}: The {theme.title()} Adventure",
                "text": f"This is a story about {characters[0]} and {characters[1]} on their {theme} adventure. They explore and discover new things together. They learn about teamwork and friendship along the way.",
                "recap": f"A {theme} adventure with {characters[0]} and {characters[1]}.",
                "vocabulary_words": ["adventure", "discover", "journey", "explore", "mystery"],
                "discussion_questions": [
                    "What did you learn from this story?",
                    "What was your favorite part?",
                    "What do you think will happen next?"
                ]
            }
            
            # Add fallback episode to fallback story
            fallback_story["story"]["episodes"].append({
                "id": episode_id,
                "episodeNumber": i + 1,
                "title": fallback_episode['title'],
                "text": fallback_episode['text'],
                "recap": fallback_episode['recap'],
                "discussionQuestions": fallback_episode['discussion_questions'],
                "crosswordPuzzleId": puzzle_id,
                "vocabularyFocus": fallback_episode['vocabulary_words']
            })
            
            # Add fallback puzzle to fallback story
            fallback_story["puzzles"][puzzle_id] = {
                "size": {"width": 10, "height": 10},
                "grid": [],
                "words": [
                    {
                        "direction": "across",
                        "number": 1,
                        "clue": "Journey of discovery",
                        "answer": "ADVENTURE",
                        "definition": "An exciting experience",
                        "example": "The adventure was full of excitement."
                    },
                    {
                        "direction": "down",
                        "number": 2,
                        "clue": "Find something new",
                        "answer": "DISCOVER",
                        "definition": "To find or learn something new",
                        "example": "They discover new creatures in the jungle."
                    },
                    {
                        "direction": "across",
                        "number": 3,
                        "clue": "A long trip",
                        "answer": "JOURNEY",
                        "definition": "Traveling from one place to another",
                        "example": "The journey was long but exciting."
                    },
                    {
                        "direction": "down",
                        "number": 4,
                        "clue": "To look around and learn",
                        "answer": "EXPLORE",
                        "definition": "To search and examine a place",
                        "example": "Let's explore the forest path."
                    },
                    {
                        "direction": "across",
                        "number": 5,
                        "clue": "Something unknown or puzzling",
                        "answer": "MYSTERY",
                        "definition": "Something difficult to understand or explain",
                        "example": "The mystery of the hidden cave."
                    }
                ]
            }
            
            try:
                print(f"Generating episode {i+1} of {episode_count}")
                # Only try to generate with AI if there's a valid API key
                if settings.OPENAI_API_KEY:
                    # Generate story content with OpenAI
                    episode_content = generate_episode_with_ai(
                        theme, 
                        characters, 
                        focus_skills, 
                        i+1, 
                        episode_count
                    )
                    
                    # Add to episodes list
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
                else:
                    # If no API key, use fallback content
                    print("No OpenAI API key found, using fallback content")
                    # Use fallback episode from above
                    episode_data = fallback_episode
                    
                    episodes.append({
                        "id": episode_id,
                        "episodeNumber": i + 1,
                        "title": episode_data['title'],
                        "text": episode_data['text'],
                        "recap": episode_data['recap'],
                        "discussionQuestions": episode_data['discussion_questions'],
                        "crosswordPuzzleId": puzzle_id,
                        "vocabularyFocus": episode_data['vocabulary_words']
                    })
            except Exception as episode_error:
                print(f"Error generating episode {i+1}: {str(episode_error)}")
                traceback.print_exc()
                # Use fallback content for this episode
                episode_data = fallback_episode
                
                episodes.append({
                    "id": episode_id,
                    "episodeNumber": i + 1,
                    "title": episode_data['title'],
                    "text": episode_data['text'],
                    "recap": episode_data['recap'],
                    "discussionQuestions": episode_data['discussion_questions'],
                    "crosswordPuzzleId": puzzle_id,
                    "vocabularyFocus": episode_data['vocabulary_words']
                })
        
        # Check if we generated any episodes
        if not episodes:
            print("No episodes generated, using fallback story")
            return JsonResponse(fallback_story)
        
        # Generate simple puzzles based on vocabulary words
        puzzles = {}
        for episode in episodes:
            puzzle_id = episode["crosswordPuzzleId"]
            vocabulary = episode["vocabularyFocus"]
            
            try:
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
            except Exception as puzzle_error:
                print(f"Error generating puzzle: {str(puzzle_error)}")
                # Use fallback puzzle
                if puzzle_id in fallback_story["puzzles"]:
                    puzzles[puzzle_id] = fallback_story["puzzles"][puzzle_id]
                else:
                    # Create a generic puzzle if the fallback doesn't have one for this ID
                    puzzles[puzzle_id] = {
                        "size": {"width": 10, "height": 10},
                        "grid": [],
                        "words": [
                            {
                                "direction": "across",
                                "number": 1,
                                "clue": "Journey of discovery",
                                "answer": "ADVENTURE",
                                "definition": "An exciting experience",
                                "example": "The adventure was full of excitement."
                            },
                            # Add more default words here
                        ]
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
        
        # Cache the response (for 1 hour)
        try:
            if 'cache_key' in locals():  # Make sure cache_key is defined
                cache.set(cache_key, response_data, 3600)
        except Exception as cache_error:
            print(f"Error setting cache: {str(cache_error)}")
        
        return JsonResponse(response_data)
    
    except Exception as e:
        # Detailed error logging
        error_traceback = traceback.format_exc()
        print(f"Error generating story: {str(e)}")
        print(f"Traceback: {error_traceback}")
        
        # Return a valid JSON response even in case of error
        return JsonResponse({
            "error": str(e),
            "message": "There was an error generating the story.",
            "traceback": error_traceback if settings.DEBUG else None
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
    skills_list = ", ".join(focus_skills) if focus_skills else "basic vocabulary"
    
    # Create a prompt for GPT
    prompt = f"""
    Create a short educational story episode for 3rd grade children about a {theme} adventure.
    
    Characters: {characters[0]} and {characters[1]}
    Focus skills: {skills_list}
    Episode: {episode_number} of {total_episodes} (the {episode_position} of the story)
    
    Include exactly 5 simple vocabulary words that are appropriate for 3rd graders and relate to the focus skills.
    Make sure the story naturally incorporates these vocabulary words.
    The story should be 1-2 paragraphs long and educational but fun.
    
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
        # Call OpenAI API with timeout
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational content creator who writes engaging, age-appropriate stories for elementary school children."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,  # Reduced token count for faster responses
            timeout=30  # 30 second timeout
        )
        
        # Extract and parse response
        content = response.choices[0].message.content
        print(f"OpenAI response: {content[:100]}...")  # Print first 100 chars for debugging
        
        # Extract JSON from the possibly text-wrapped response
        import re
        json_match = re.search(r'({.*})', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        
        try:
            episode_data = json.loads(content)
        except json.JSONDecodeError:
            print(f"JSONDecodeError for content: {content}")
            # Try to manually fix common JSON issues
            content = content.replace("'", '"')  # Replace single quotes with double quotes
            content = re.sub(r',\s*}', '}', content)  # Remove trailing commas
            episode_data = json.loads(content)
        
        # Validate and fix the returned data
        required_keys = ['title', 'text', 'recap', 'vocabulary_words', 'discussion_questions']
        
        # Create default values for missing keys
        default_values = {
            'title': f"Episode {episode_number}: The {theme.title()} Adventure",
            'text': f"This is a story about {characters[0]} and {characters[1]} on their {theme} adventure.",
            'recap': f"A {theme} adventure with {characters[0]} and {characters[1]}.",
            'vocabulary_words': ["adventure", "discover", "journey", "explore", "mystery"],
            'discussion_questions': [
                "What did you learn from this story?",
                "What was your favorite part?",
                "What do you think will happen next?"
            ]
        }
        
        # Check and fix required keys
        for key in required_keys:
            if key not in episode_data:
                print(f"Missing required key '{key}' in episode data, using default")
                episode_data[key] = default_values[key]
        
        # Ensure vocabulary words is a list with 5 items
        if not isinstance(episode_data['vocabulary_words'], list):
            print("vocabulary_words is not a list, using default")
            episode_data['vocabulary_words'] = default_values['vocabulary_words']
        
        # Make sure we have exactly 5 vocabulary words
        while len(episode_data['vocabulary_words']) < 5:
            # Add default words if we don't have enough
            missing_index = len(episode_data['vocabulary_words'])
            episode_data['vocabulary_words'].append(default_values['vocabulary_words'][missing_index % len(default_values['vocabulary_words'])])
        
        # Trim if we have too many
        if len(episode_data['vocabulary_words']) > 5:
            episode_data['vocabulary_words'] = episode_data['vocabulary_words'][:5]
        
        # Ensure discussion_questions is a list with at least 3 items
        if not isinstance(episode_data['discussion_questions'], list):
            print("discussion_questions is not a list, using default")
            episode_data['discussion_questions'] = default_values['discussion_questions']
        
        # Make sure we have at least 3 discussion questions
        while len(episode_data['discussion_questions']) < 3:
            # Add default questions if we don't have enough
            missing_index = len(episode_data['discussion_questions'])
            episode_data['discussion_questions'].append(default_values['discussion_questions'][missing_index % len(default_values['discussion_questions'])])
        
        return episode_data
    
    except Exception as e:
        print(f"Error with OpenAI API: {str(e)}")
        traceback.print_exc()
        # Return fallback content in case of API failure
        return {
            "title": f"Episode {episode_number}: The {theme.title()} Adventure",
            "text": f"This is a story about {characters[0]} and {characters[1]} on their {theme} adventure. They explore and discover new things together. They learn about teamwork and friendship along the way.",
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
    if focus_skills and 'sight-words' in focus_skills:
        clue = f"Sight word: {word}"
    
    if focus_skills and 'phonics-sh' in focus_skills and 'sh' in word:
        clue = f"Word with the 'sh' sound"
    
    if focus_skills and 'phonics-ch' in focus_skills and 'ch' in word:
        clue = f"Word with the 'ch' sound"
    
    if focus_skills and 'compound-words' in focus_skills and len(word) > 6:
        clue = f"Word made of two smaller words"
    
    if focus_skills and 'action-verbs' in focus_skills:
        clue = f"Action word: to {word}"
    
    return clue