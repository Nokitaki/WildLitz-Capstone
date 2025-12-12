# sentence_formation/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import openai
import time
from django.conf import settings
import random
import datetime
import logging
import traceback
from supabase import create_client
from datetime import datetime, timedelta
import traceback
# Import progress tracking
from api.models import UserProgress, UserActivity
import json as json_module
# Configure logger
logger = logging.getLogger(__name__)

# Configure OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY


supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def log_sentence_formation_activity(user, activity_type, question_data, user_answer, correct_answer, is_correct, time_spent, difficulty='medium', challenge_level='', learning_focus=''):
    """Helper function to log sentence formation activities"""
    try:
        if user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                module='sentence_formation',
                activity_type=activity_type,
                question_data=question_data,
                user_answer=user_answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level=challenge_level,
                learning_focus=learning_focus
            )
            
            # Update progress summary
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                module='sentence_formation',
                difficulty=difficulty,
                defaults={
                    'total_attempts': 0,
                    'correct_answers': 0,
                    'accuracy_percentage': 0.0,
                    'average_time_per_question': 0.0
                }
            )
            progress.update_progress(is_correct, time_spent)
    except Exception as e:
        logger.error(f"Error logging sentence formation activity: {str(e)}")

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def Trailtest_endpoint(request):
    """Simple test endpoint to verify API connectivity"""
    return JsonResponse({"status": "success", "message": "API is working"})

def validate_vocabulary_matches_skills(vocabularyFocus, focus_skills):
    """Check if vocabulary words actually match the selected focus skills"""
    
    skill_pattern_map = {
        'phonics-sh': lambda word: 'sh' in word.lower(),
        'phonics-ch': lambda word: 'ch' in word.lower(),
        'phonics-th': lambda word: 'th' in word.lower(),
        'phonics-wh': lambda word: 'wh' in word.lower(),
        'action-verbs': lambda word: word.lower() in [
            'run', 'jump', 'swim', 'climb', 'play', 'walk', 'look', 'find', 'help', 
            'push', 'pull', 'throw', 'catch', 'kick', 'dance', 'sing', 'laugh', 
            'sleep', 'eat', 'drink', 'read', 'write', 'draw', 'build', 'dive', 'reach', 'grab'
        ]
    }
    
    # Count words matching each skill
    skill_matches = {skill: 0 for skill in focus_skills}
    
    for word in vocabularyFocus:
        word_lower = word.lower()
        for skill in focus_skills:
            if skill in skill_pattern_map:
                if skill_pattern_map[skill](word_lower):
                    skill_matches[skill] += 1
                    break  # Word matched this skill, don't check others
    
    # Each skill should have at least 1 word
    missing_skills = [skill for skill, count in skill_matches.items() if count == 0]
    
    if missing_skills:
        return False, f"Missing skills: {', '.join(missing_skills)}", skill_matches
    
    return True, "All skills represented", skill_matches


def call_openai_for_story(prompt, max_tokens):
    """Make OpenAI API call with proper error handling"""
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo-16k",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are an expert educational content creator for elementary students. CRITICAL REQUIREMENTS: 1) You MUST create AT LEAST 5 vocabulary words per episode AND AT LEAST 5 crossword puzzle entries per episode. 2) When multiple focus skills are selected, you MUST include words from EVERY SINGLE skill in EACH episode. For example, if the skills are phonics-ch, phonics-sh, and phonics-th, then EACH episode must have at least 1-2 words with CH, at least 1-2 words with SH, and at least 1-2 words with TH. 3) Do NOT use random words that don't match the selected skills. 4) You MUST return ONLY valid JSON without any markdown formatting or code blocks."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=max_tokens,
            temperature=0.7
        )
        
        response_content = response.choices[0].message.content.strip()
        
        # Clean the response - remove markdown code blocks if present
        import re
        cleaned_content = response_content
        cleaned_content = re.sub(r'^```json\s*', '', cleaned_content, flags=re.MULTILINE)
        cleaned_content = re.sub(r'^```\s*$', '', cleaned_content, flags=re.MULTILINE)
        cleaned_content = re.sub(r'```', '', cleaned_content)
        cleaned_content = cleaned_content.strip()

        cleaned_content = re.sub(r',(\s*[}\]])', r'\1', cleaned_content)
        
        return cleaned_content
        
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return None



@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_next_episode(request):
    """
    Generate the next episode on-demand when user clicks 'Continue'
    ✅ UPDATED: Strict vocabulary validation - ONLY skill-focused words
    """
    try:
        data = request.data
        story_id = data.get('storyId')
        episode_number = int(data.get('episodeNumber', 1))
        theme = data.get('theme', 'adventure')
        focus_skills = data.get('focusSkills', ['action-verbs'])
        character_names = data.get('characterNames', '')
        grade_level = data.get('gradeLevel', 3)
        previous_episodes = data.get('previousEpisodes', [])
        
        # LIMIT TO MAX 2 SKILLS
        if len(focus_skills) > 2:
            focus_skills = focus_skills[:2]
            logger.warning(f"⚠️ Too many skills selected, limiting to first 2: {focus_skills}")
        
        logger.info(f"📚 Generating episode {episode_number} for story {story_id}")
        logger.info(f"   Theme: {theme}")
        logger.info(f"   Focus Skills: {focus_skills}")
        logger.info(f"   Grade Level: {grade_level}")
        logger.info(f"   Previous episodes: {len(previous_episodes)}")
        
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key is missing")
            return Response({'error': 'API key not configured'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Track previously used words
        previously_used_words = set()
        for prev_ep in previous_episodes:
            prev_words = prev_ep.get('vocabularyWords', [])
            if isinstance(prev_words, list):
                for word_item in prev_words:
                    if isinstance(word_item, dict):
                        word = word_item.get('word', '').strip().lower()
                        if word:
                            previously_used_words.add(word)
                    elif isinstance(word_item, str):
                        word = word_item.strip().lower()
                        if word:
                            previously_used_words.add(word)
            
            vocab_focus = prev_ep.get('vocabularyFocus', [])
            if isinstance(vocab_focus, list):
                for word in vocab_focus:
                    if isinstance(word, str):
                        word = word.strip().lower()
                        if word:
                            previously_used_words.add(word)
        
        logger.info(f"🔍 Previously used words: {len(previously_used_words)} unique words")
        
        # Build story context
        if previous_episodes:
            recent_context = "\n\n".join([
                f"Episode {ep.get('episodeNumber', i+1)}: {ep.get('recap', ep.get('text', '')[:150])}"
                for i, ep in enumerate(previous_episodes[-2:])
            ])
        else:
            recent_context = "This is the first episode."
        
        # Get ALL vocabulary examples for selected skills
        vocab_examples = []
        for skill in focus_skills:
            if skill in FOCUS_SKILL_VOCABULARY:
                vocab_examples.extend(FOCUS_SKILL_VOCABULARY[skill]['examples'])
        
        # Remove duplicates and previously used words
        vocab_examples = [w for w in vocab_examples if w.lower() not in previously_used_words]
        
        logger.info(f"📝 Available vocabulary pool: {len(vocab_examples)} words")
        
        # Build STRICT vocabulary instruction
        vocab_list_text = ', '.join(vocab_examples[:30])  # Show first 30 as examples
        
        vocab_instruction = f"""
🚨 CRITICAL VOCABULARY RULE - YOU MUST FOLLOW THIS EXACTLY:
================================
Selected Skills: {', '.join(focus_skills)}

YOU MUST ONLY USE WORDS FROM THE SKILL VOCABULARY LISTS!

Available words for {focus_skills[0]}: {', '.join(FOCUS_SKILL_VOCABULARY.get(focus_skills[0], {}).get('examples', [])[:15])}
{f"Available words for {focus_skills[1]}: {', '.join(FOCUS_SKILL_VOCABULARY.get(focus_skills[1], {}).get('examples', [])[:15])}" if len(focus_skills) > 1 else ''}

❌ DO NOT USE these types of words:
- Random theme words (gold, coin, silver, money, treasure, bottle, cup, plate, etc.)
- Generic words that don't match the phonics patterns
- Any word not in the skill vocabulary lists

✅ EVERY vocabulary word MUST:
- Match the sound pattern from the selected skills
- Come from the skill vocabulary list above
- Be appropriate for grade {grade_level}
- Appear naturally in the story

VALIDATION: Your response will be REJECTED if you use ANY words that don't match {', '.join(focus_skills)}!
"""
        
        # Build previous words warning
        previous_words_warning = ""
        if previously_used_words:
            prev_words_list = ', '.join(sorted(list(previously_used_words))[:20])
            previous_words_warning = f"""
⚠️ AVOID REPETITION:
These words were already used in previous episodes - DO NOT use them again:
{prev_words_list}

Use DIFFERENT words from the skill vocabulary lists!
"""
        
        # Create the main prompt
        prompt = f"""Create Episode {episode_number} for an ongoing story about {theme}.
{"Character names: " + character_names if character_names else ""}

{vocab_instruction}

{previous_words_warning}

STORY CONTINUATION:
{recent_context}

REQUIREMENTS FOR THIS EPISODE:
1. Continue the story naturally from previous episode
2. Use EXACTLY 5 vocabulary words from the skill lists above
3. Episode must be 150-200 words total
4. Each vocabulary word must appear naturally in the story text
5. Make it engaging for grade {grade_level} students
6. {"Mix words from BOTH skills" if len(focus_skills) > 1 else f"Focus on {focus_skills[0]} words"}

VALIDATION CHECKS - Your response will be REJECTED if:
❌ You use ANY word that's not from the skill vocabulary lists
❌ You use random theme words (gold, coin, treasure, bottle, etc.)
❌ You repeat words from previous episodes
❌ You don't use at least 5 skill-focused words

Return ONLY valid JSON (NO markdown, NO code blocks):
{{
  "episode": {{
    "episodeNumber": {episode_number},
    "title": "Episode {episode_number} Title",
    "text": "Story text with skill-focused vocabulary naturally integrated...",
    "recap": "One sentence summary of this episode",
    "discussionQuestions": [
      "What happened in this episode?",
      "How did the characters feel?",
      "What do you think will happen next?"
    ],
    "vocabularyWords": [
      {{
        "word": "word from skill vocabulary list",
        "clue": "Simple clue for crossword (5-8 words)",
        "definition": "Grade {grade_level} appropriate definition",
        "example": "Example sentence using the word"
      }},
      {{
        "word": "another word from skill list",
        "clue": "Simple clue",
        "definition": "Definition",
        "example": "Example sentence"
      }},
      (... 5 words total ...)
    ]
  }}
}}
"""
        
        # TRY UP TO 3 TIMES with validation
        max_retries = 3
        episode = None
        
        for attempt in range(max_retries):
            logger.info(f"🔄 Generation attempt {attempt + 1}/{max_retries}")
            
            # Call OpenAI
            response_text = call_openai_for_story(prompt, max_tokens=2500)
            
            if not response_text:
                logger.error("❌ OpenAI returned empty response")
                continue
            
            # Parse JSON
            try:
                episode_data = json.loads(response_text)
                episode = episode_data.get('episode', episode_data)
                
                if not episode:
                    logger.error("❌ No episode in response")
                    continue
                
                # STRICT VALIDATION: Check vocabulary
                vocab_words = episode.get('vocabularyWords', [])
                
                if len(vocab_words) < 5:
                    logger.warning(f"⚠️ Only {len(vocab_words)} vocabulary words, need 5")
                    if attempt < max_retries - 1:
                        prompt += "\n\n⚠️ YOU MUST PROVIDE EXACTLY 5 VOCABULARY WORDS!"
                        continue
                
                # Extract word list
                word_list = [v['word'].lower() for v in vocab_words if isinstance(v, dict) and 'word' in v]
                
                # Check if words are from skill vocabulary
                vocab_examples_lower = [w.lower() for w in vocab_examples]
                invalid_words = [w for w in word_list if w not in vocab_examples_lower and w not in [e.lower() for e in vocab_examples]]
                
                # Check for repeated words
                repeated_words = [w for w in word_list if w in previously_used_words]
                
                if invalid_words:
                    logger.error(f"❌ Invalid words (not from skill vocab): {invalid_words}")
                    logger.error(f"   Skills: {focus_skills}")
                    
                    if attempt < max_retries - 1:
                        invalid_list = ', '.join(invalid_words)
                        prompt += f"\n\n⚠️⚠️ REJECTED WORDS: {invalid_list} - These are NOT from the skill vocabulary lists! Use ONLY words from the lists I provided!"
                        continue
                    else:
                        logger.error(f"❌ Failed after {max_retries} attempts - invalid words persist")
                        return Response({
                            'error': f'Failed to generate skill-focused vocabulary. Invalid words: {", ".join(invalid_words)}'
                        }, status=500)
                
                if repeated_words and len(repeated_words) > 1:
                    logger.warning(f"⚠️ Repeated words: {repeated_words}")
                    if attempt < max_retries - 1:
                        repeated_list = ', '.join(repeated_words)
                        prompt += f"\n\n⚠️ REPEATED WORDS: {repeated_list} - Use DIFFERENT words!"
                        continue
                
                # SUCCESS!
                logger.info(f"✅ Episode {episode_number} validated successfully!")
                logger.info(f"   Vocabulary: {', '.join(word_list)}")
                break
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON parse error: {e}")
                if attempt < max_retries - 1:
                    continue
                else:
                    return Response({'error': 'Failed to parse AI response'}, status=500)
        
        if not episode:
            return Response({'error': 'Failed to generate episode after retries'}, status=500)
        
        # Create episode and puzzle IDs
        episode_id = f"{story_id}_ep{episode_number}"
        puzzle_id = f"{episode_id}_puzzle"
        
        # Create crossword puzzle
        puzzle = create_crossword_from_vocabulary(
            episode['vocabularyWords'],
            f"Episode {episode_number} Vocabulary"
        )
        
        # Format response
        formatted_episode = {
            'id': episode_id,
            'episodeNumber': episode_number,
            'title': episode['title'],
            'text': episode['text'],
            'recap': episode.get('recap', ''),
            'discussionQuestions': episode.get('discussionQuestions', []),
            'crosswordPuzzleId': puzzle_id,
            'vocabularyFocus': [v['word'] for v in episode['vocabularyWords']],
            'vocabularyWords': episode['vocabularyWords']
        }
        
        logger.info(f"✅ Episode {episode_number} generated successfully!")
        
        return Response({
            'episode': formatted_episode,
            'puzzle': puzzle
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Error generating episode: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ⭐ HELPER FUNCTION - Add this if it doesn't exist
def create_crossword_from_vocabulary(vocab_words, title="Vocabulary Puzzle"):
    """Helper function to create a crossword puzzle from vocabulary words"""
    puzzle_words = []
    
    for i, word_data in enumerate(vocab_words):
        puzzle_words.append({
            "direction": "across" if i % 2 == 0 else "down",
            "number": i + 1,
            "clue": word_data.get('clue', f"Clue for {word_data['word']}"),
            "answer": word_data['word'].upper(),
            "definition": word_data.get('definition', ''),
            "example": f"Example sentence using {word_data['word']}."
        })
    
    return {
        "title": title,
        "size": {"width": 10, "height": 10},
        "grid": [],
        "words": puzzle_words
    }



@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_story(request):
    """
    MODIFIED: Now only generates the FIRST episode
    Additional episodes are generated on-demand via generate_next_episode endpoint
    """
    try:
        data = request.data
        theme = data.get('theme', 'jungle')
        focus_skills = data.get('focusSkills', ['action-verbs'])
        character_names = data.get('characterNames', '')
        total_episodes = min(int(data.get('totalEpisodes', 3)), 5)
        grade_level = data.get('gradeLevel', 3)
        
        # ALWAYS generate only 1 episode initially
        episode_count = 1
        
        # LIMIT TO MAX 2 SKILLS
        if len(focus_skills) > 2:
            focus_skills = focus_skills[:2]
            logger.warning(f"⚠️ Too many skills selected, limiting to first 2: {focus_skills}")
        
        logger.info(f"📚 Initial story generation: theme={theme}, skills={focus_skills}, total_episodes={total_episodes}")
        logger.info(f"⭐ Generating ONLY episode 1, remaining episodes will be generated on-demand")
        
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key is missing")
            return Response(
                {'error': 'OpenAI API key is not configured'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        story_id = f"{theme}_generated_{int(datetime.now().timestamp())}"
        max_tokens = 3000
        
        # Get vocabulary guidance (without exclude_words for first episode)
        vocab_guidance = get_vocabulary_guidance(focus_skills)
        
        logger.info(f"📝 Generating with focus skills: {focus_skills}")
        
        # Create skill requirements
        skill_requirements = []
        words_per_skill = 3 if len(focus_skills) == 1 else 2
        
        for skill in focus_skills:
            if skill in FOCUS_SKILL_VOCABULARY:
                examples = ', '.join(FOCUS_SKILL_VOCABULARY[skill]['examples'][:5])
                skill_requirements.append(f"   - {skill}: Include at least {words_per_skill} words like: {examples}")
        
        # BUILD EMPHATIC MIXING INSTRUCTION
        if len(focus_skills) == 1:
            mixing_instruction = f"""Focus on the {focus_skills[0]} skill.
This episode should have 5-7 words from this skill."""
            validation_rule = f"VALIDATION: Episode MUST have at least 5 words from {focus_skills[0]}"
        else:
            skill1, skill2 = focus_skills[0], focus_skills[1]
            mixing_instruction = f"""
CRITICAL MIXING RULE - THIS IS MANDATORY FOR THIS EPISODE:
- Skill 1 ({skill1}): MUST have at least 2 words. Examples: {', '.join(FOCUS_SKILL_VOCABULARY[skill1]['examples'][:5])}
- Skill 2 ({skill2}): MUST have at least 2 words. Examples: {', '.join(FOCUS_SKILL_VOCABULARY[skill2]['examples'][:5])}

This episode needs words from BOTH skills.
The episode MUST be a MIX of BOTH {skill1} AND {skill2}.
"""
            validation_rule = f"VALIDATION: Episode 1 needs {skill1}+{skill2}"
        
        # Build character context
        character_context = ""
        if character_names:
            character_context = f"\nUse these character names: {character_names}"
        
        # CREATE THE AI PROMPT
        prompt = f"""Create Episode 1 for a new story about {theme} theme for grade {grade_level} students.
{character_context}

This will be a {total_episodes}-episode story, but you're creating ONLY Episode 1 now.
Make it engaging and leave room for continuation in future episodes.

================================
MANDATORY VOCABULARY MIXING (READ THIS CAREFULLY):
================================
Selected skills: {', '.join(focus_skills)}

{mixing_instruction}

{validation_rule}

================================
REQUIREMENTS FOR THIS EPISODE:
================================
{chr(10).join(skill_requirements)}

================================
FOCUS SKILLS VOCABULARY REQUIREMENTS:
================================
{vocab_guidance.get('detailed_guidance', '')}

VOCABULARY SELECTION RULES:
1. Episode must have AT LEAST {words_per_skill} words from EACH selected skill
2. Select MINIMUM 5 vocabulary words (you can use up to 8)
3. ONLY use words that actually match the focus skills
4. Words must be 3-8 letters long (grade 3 appropriate)
5. Each vocabulary word MUST appear naturally in the story text

USE THESE VOCABULARY WORDS (DO NOT USE OTHER WORDS):
{', '.join(vocab_guidance.get('example_words', [])[:30])}

================================
STORY REQUIREMENTS:
================================
- 150-200 words total
- Engaging narrative with vocabulary words used naturally
- {"Focus on " + focus_skills[0] + " words" if len(focus_skills) == 1 else "Mix words from BOTH " + " and ".join(focus_skills) + " skills"}

Return ONLY valid JSON (NO markdown) in this exact format:
{{
  "story": {{
    "title": "Story Title",
    "description": "Brief description",
    "episodes": [
      {{
        "episodeNumber": 1,
        "title": "Episode 1 Title",
        "text": "Episode text with 2-3 paragraphs...",
        "recap": "Brief 1-sentence summary",
        "discussionQuestions": ["Question 1?", "Question 2?", "Question 3?"],
        "vocabularyWords": [
          {{"word": "word1", "clue": "crossword clue", "definition": "kid-friendly definition"}},
          {{"word": "word2", "clue": "crossword clue", "definition": "kid-friendly definition"}},
          {{"word": "word3", "clue": "crossword clue", "definition": "kid-friendly definition"}},
          {{"word": "word4", "clue": "crossword clue", "definition": "kid-friendly definition"}},
          {{"word": "word5", "clue": "crossword clue", "definition": "kid-friendly definition"}}
        ],
        "vocabularyFocus": ["word1", "word2", "word3", "word4", "word5"]
      }}
    ]
  }}
}}"""

        # Call OpenAI
        logger.info(f"🤖 Calling OpenAI with {max_tokens} tokens for Episode 1")
        cleaned_content = call_openai_for_story(prompt, max_tokens)
        
        if not cleaned_content:
            logger.error(f"❌ OpenAI returned empty response")
            return Response(
                create_improved_fallback_story(theme, 1, grade_level, focus_skills)
            )
        
        logger.info(f"✅ Received response (length: {len(cleaned_content)})")
        
        try:
            story_data = json.loads(cleaned_content)

            logger.info("🔍 FULL OPENAI RESPONSE:")
            logger.info(json_module.dumps(story_data, indent=2)[:1000]) 
            
            # Validate the story
            episodes = story_data.get('story', {}).get('episodes', [])
            if episodes:
                vocab_words = episodes[0].get('vocabularyWords', [])
                logger.info(f"📚 Vocabulary check: {len(vocab_words)} words found")
                logger.info(f"   Words: {vocab_words}")
            
            if not episodes or len(episodes) == 0:
                raise ValueError("No episodes generated")
            
            episode = episodes[0]
            
            # VALIDATE VOCABULARY MATCHES SKILLS
            vocab_focus = episode.get('vocabularyFocus', [])
            is_valid, message, skill_matches = validate_vocabulary_matches_skills(vocab_focus, focus_skills)
            
            if not is_valid:
                logger.warning(f"⚠️ Episode 1 validation failed: {message}")
                logger.warning(f"   Vocabulary: {', '.join(vocab_focus)}")
                logger.warning(f"   Skill distribution: {skill_matches}")
            
            # Format the response
            formatted_story = {
                "id": story_id,
                "title": story_data['story']['title'],
                "description": story_data['story'].get('description', f"An adventure about {theme}"),
                "theme": theme,
                "gradeLevel": f"Grade {grade_level}",
                "totalEpisodes": total_episodes,
                "generatedEpisodes": 1,
                "focusSkills": focus_skills,
                "characterNames": character_names,
                "episodes": []
            }
            
            # Create puzzles dictionary
            puzzles = {}
            
            # Process the single episode
            episode_id = f"{story_id}_ep1"
            puzzle_id = f"{episode_id}_puzzle"
            
            # Validate vocabulary words exist
            if not episode.get('vocabularyWords') or len(episode['vocabularyWords']) < 5:
                logger.error(f"❌ Insufficient vocabulary words in episode 1")
                raise ValueError("Generated episode has insufficient vocabulary")
            
            # Create crossword puzzle
            puzzle = create_crossword_from_vocabulary(
                episode['vocabularyWords'],
                "Episode 1 Vocabulary"
            )
            
            puzzles[puzzle_id] = puzzle
            
            # Add episode to story
            formatted_episode = {
                'id': episode_id,
                'episodeNumber': 1,
                'title': episode['title'],
                'text': episode['text'],
                'recap': episode.get('recap', ''),
                'discussionQuestions': episode.get('discussionQuestions', []),
                'crosswordPuzzleId': puzzle_id,
                'vocabularyFocus': vocab_focus
            }
            
            formatted_story['episodes'].append(formatted_episode)
            
            logger.info(f"✅ Story generated successfully: {formatted_story['title']}")
            
            # Return the complete response
            return Response({
                'story': formatted_story,
                'puzzles': puzzles
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {str(e)}")
            logger.error(f"   Response content: {cleaned_content[:500]}")
            return Response(
                create_improved_fallback_story(theme, 1, grade_level, focus_skills)
            )
        except ValueError as e:
            logger.error(f"❌ Validation error: {str(e)}")
            return Response(
                create_improved_fallback_story(theme, 1, grade_level, focus_skills)
            )
        
    except Exception as e:
        logger.error(f"❌ Error generating story: {str(e)}")
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    



def create_improved_fallback_story(theme, episode_count, grade_level, focus_skills):
    """Create a fallback story with vocabulary matching the focus skills - MIXED in each episode"""
    
    story_id = f"{theme}_fallback_{int(datetime.now().timestamp())}"
    
    # Collect vocabulary from ALL focus skills
    all_vocab_by_skill = {}
    for skill in focus_skills:
        if skill in FOCUS_SKILL_VOCABULARY:
            all_vocab_by_skill[skill] = FOCUS_SKILL_VOCABULARY[skill]['examples'][:10]
    
    # If no vocabulary found, use default action verbs
    if not all_vocab_by_skill:
        all_vocab_by_skill = {
            'action-verbs': ['run', 'jump', 'look', 'find', 'help', 'walk', 'play', 'swim', 'climb', 'dance']
        }
    
    fallback_story = {
        "story": {
            "id": story_id,
            "title": f"The Great {theme.capitalize()} Adventure",
            "theme": theme,
            "gradeLevel": grade_level,
            "totalEpisodes": episode_count,
            "focusSkills": focus_skills,
            "episodes": []
        },
        "puzzles": {}
    }
    
    for i in range(episode_count):
        episode_id = f"episode_{i+1}"
        puzzle_id = f"puzzle_{i+1}"
        
        # MIX vocabulary from all skills for this episode - ensure EACH skill is represented
        episode_vocab = []
        
        # First, add at least 2 words from EACH skill
        for skill, vocab_words in all_vocab_by_skill.items():
            start_idx = (i * 2) % len(vocab_words)
            skill_words = vocab_words[start_idx:start_idx + 2]
            
            if len(skill_words) < 2:
                skill_words += vocab_words[:2 - len(skill_words)]
            
            for word in skill_words:
                episode_vocab.append({
                    "word": word.upper(),
                    "clue": f"A {skill.replace('-', ' ')} word",
                    "definition": f"A {grade_level}rd grade word",
                    "skill": skill
                })
        
        # Then add more words to reach minimum 5
        while len(episode_vocab) < 5:
            for skill, vocab_words in all_vocab_by_skill.items():
                if len(episode_vocab) >= 5:
                    break
                word_idx = len(episode_vocab) % len(vocab_words)
                word = vocab_words[word_idx]
                episode_vocab.append({
                    "word": word.upper(),
                    "clue": f"A {skill.replace('-', ' ')} word",
                    "definition": f"A {grade_level}rd grade word",
                    "skill": skill
                })
        
        # Limit to 10 words max
        episode_vocab = episode_vocab[:10]
        
        # Create story text using the mixed vocabulary words
        vocab_words = [v['word'].lower() for v in episode_vocab]
        episode_text = f"""The adventure begins in the {theme}. They found a {vocab_words[0]} and saw a {vocab_words[1]}. 
        Next, they discovered {vocab_words[2]} nearby. Everyone felt {vocab_words[3]} about exploring. 
        They continued to {vocab_words[4]} together. It was an amazing day!"""
        
        fallback_story["story"]["episodes"].append({
            "id": episode_id,
            "episodeNumber": i + 1,
            "title": f"Episode {i+1}: Adventures in the {theme.capitalize()}",
            "text": episode_text,
            "recap": f"The kids have amazing adventures in the {theme}.",
            "discussionQuestions": [
                "What did the characters discover?",
                "How do you think they felt?",
                "What would you do on this adventure?"
            ],
            "crosswordPuzzleId": puzzle_id,
            "vocabularyFocus": [v['word'] for v in episode_vocab]
        })
        
        # Create puzzle words
        puzzle_words = []
        for idx, vocab_word in enumerate(episode_vocab):
            puzzle_words.append({
                "direction": "across" if idx % 2 == 0 else "down",
                "number": idx + 1,
                "clue": vocab_word['clue'],
                "answer": vocab_word['word'],
                "definition": vocab_word['definition'],
                "example": f"The word {vocab_word['word'].lower()} is an example.",
                "cells": [{"row": idx, "col": idx}]
            })
        
        fallback_story["puzzles"][puzzle_id] = {
            "id": puzzle_id,
            "title": f"Episode {i+1} Crossword",
            "size": {"width": 10, "height": 10},
            "words": puzzle_words
        }
    
    return fallback_story

def generate_simple_crossword(vocab_words, theme):
    """Generate a simple crossword puzzle from vocabulary words"""
    words = []
    
    for i, word_data in enumerate(vocab_words):
        word = word_data.get("word", "").upper()
        clue = word_data.get("clue", f"Something related to {theme}")
        definition = word_data.get("definition", f"A word related to {theme}")
        
        if not word:
            continue
            
        direction = "across" if i % 2 == 0 else "down"
        
        if direction == "across":
            start_row = i * 2
            start_col = 0
            cells = [{"row": start_row, "col": start_col + j} for j in range(len(word))]
        else:
            start_row = 0
            start_col = i * 2
            cells = [{"row": start_row + j, "col": start_col} for j in range(len(word))]
            
        words.append({
            "direction": direction,
            "number": i + 1,
            "clue": clue,
            "answer": word,
            "definition": definition,
            "example": f"Example sentence using the word {word.lower()}.",
            "cells": cells
        })
    
    grid_width = max(10, max([len(word) for word in [w.get("answer", "") for w in words]] + [0]) + 2)
    grid_height = max(10, len(words) * 2)
    
    return {
        "id": f"{theme}_crossword_{random.randint(1000, 9999)}",
        "title": f"{theme.capitalize()} Crossword",
        "size": {"width": grid_width, "height": grid_height},
        "words": words
    }

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_crossword_clues(request):
    """
    Generate age-appropriate clues for a list of words using OpenAI GPT
    
    Expects JSON with:
    - words: list of words to generate clues for
    - theme: theme of the crossword/story
    - grade_level: target grade level
    """
    try:
        data = request.data
        words = data.get('words', [])
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        story_context = data.get('story_context', '')
        
        if not words:
            return Response({
                'error': 'No words provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set up the prompt for GPT
        prompt = f"""
        Create age-appropriate clues for a {grade_level}rd grade crossword puzzle with a {theme} theme.
        
        For each word in this list, create a brief, clear, and cryptic clue that would help students guess the word without directly stating it:
        {', '.join(words)}
        
        Story context for reference:
        {story_context}
        
        Format your response as a JSON object where the keys are the words and the values are the clues.
        Example: {{"ocean": "Vast body of salt water that covers most of Earth", "shell": "Hard protective covering of sea creatures"}}
        """
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON from the response
        try:
            # Extract JSON object if it's embedded in other text
            import re
            json_match = re.search(r'{[\s\S]*}', content)
            if json_match:
                clues = json.loads(json_match.group(0))
            else:
                # Try parsing the whole response
                clues = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: Create better clues than just "A theme word"
            clues = {}
            for word in words:
                clues[word] = f"This {theme} word has {len(word)} letters and helps on adventures"
            
        return Response({
            'clues': clues
        })
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_answer_choices(request):
    """
    Generate plausible but incorrect answer choices for a crossword word
    
    Expects JSON with:
    - correct_answer: the correct word
    - theme: theme of the crossword/story
    - grade_level: target grade level
    - num_choices: number of wrong answers to generate
    """
    try:
        data = request.data
        correct_answer = data.get('correct_answer', '')
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        num_choices = data.get('num_choices', 3)
        
        if not correct_answer:
            return Response({
                'error': 'No correct_answer provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set up the prompt for GPT with improved instructions
        prompt = f"""
        For a {grade_level}rd grade crossword puzzle with a {theme} theme, 
        generate {num_choices} plausible but incorrect answer choices for the word "{correct_answer}".
        
        The wrong answers MUST BE REAL WORDS that sound or look similar to "{correct_answer}", such as:
        1. Words with similar sounds (like "treasure"/"pleasure"/"feature")
        2. Words with similar spelling patterns
        3. Age-appropriate words that students might confuse with the right answer
        
        Wrong answers should:
        - Be the same length or very close to the same length as "{correct_answer}"
        - Be real English words that grade {grade_level} students might know
        - Be related to the theme or word meaning when possible
        - Be distinct from each other and from the correct answer
        
        Format your response as a JSON array of strings containing only the wrong answers.
        Example for "MAP": ["CAP", "LAP", "NAP"]
        """
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON from the response
        try:
            # Extract JSON array if it's embedded in other text
            import re
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                wrong_answers = json.loads(json_match.group(0))
            else:
                # Try parsing the whole response
                wrong_answers = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: Create better wrong answers based on patterns
            wrong_answers = generate_fallback_choices(correct_answer, theme, num_choices)
        
        # Include the correct answer in the shuffled array
        all_choices = wrong_answers[:num_choices]  # Ensure we only take needed number
        
        return Response({
            'choices': all_choices,
            'correct_answer': correct_answer
        })
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_fallback_choices(word, theme, num=3):
    """Generate fallback choices if AI generation fails"""
    # Common word patterns based on rhyming or similar sounds
    word_patterns = {
        'treasure': ['pleasure', 'measure', 'feature', 'creature'],
        'path': ['bath', 'math', 'wrath', 'lath'],
        'map': ['cap', 'lap', 'gap', 'tap'],
        'tree': ['free', 'flee', 'three', 'bee'],
        'run': ['fun', 'sun', 'gun', 'bun'],
        'big': ['dig', 'fig', 'pig', 'wig'],
        'help': ['kelp', 'yelp', 'whelp'],
        'jump': ['bump', 'dump', 'pump', 'hump'],
        'look': ['book', 'cook', 'hook', 'took'],
        'play': ['clay', 'gray', 'pray', 'stay'],
        'find': ['bind', 'kind', 'mind', 'wind']
    }
    
    # Check if word is in patterns
    if word.lower() in word_patterns:
        options = word_patterns[word.lower()]
        # Return a random subset
        import random
        return random.sample(options, min(num, len(options)))
    
    # Otherwise generate variations based on common patterns
    results = []
    
    # Try rhyming patterns
    if len(word) > 2:
        # Change first letter
        import string
        suffix = word[1:].lower()
        for letter in string.ascii_lowercase:
            if letter + suffix != word.lower() and len(results) < num:
                results.append(letter + suffix)
    
    # If still not enough, add words of same length
    common_words = {
        3: ['cat', 'dog', 'hat', 'hot', 'run', 'sit', 'sun', 'tag', 'pen'],
        4: ['book', 'look', 'took', 'time', 'play', 'jump', 'park', 'fish'],
        5: ['train', 'truck', 'water', 'house', 'table', 'plant', 'sheep'],
        6: ['garden', 'school', 'jungle', 'animal', 'planet', 'window'],
        7: ['teacher', 'student', 'weather', 'picture', 'dolphin', 'penguin'],
        8: ['elephant', 'dinosaur', 'computer', 'building', 'mountain'],
    }
    
    if len(word) in common_words and len(results) < num:
        options = common_words[len(word)]
        import random
        while len(results) < num and options:
            idx = random.randint(0, len(options) - 1)
            if options[idx].lower() != word.lower() and options[idx] not in results:
                results.append(options[idx])
            options.pop(idx)
    
    # Return upper case results for consistency
    return [r.upper() for r in results[:num]]

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def log_crossword_activity(request):
    """Log crossword puzzle completion and sentence building activity"""
    start_time = time.time()
    
    try:
        data = request.data
        activity_type = data.get('activity_type', 'crossword_completion')  # crossword_completion or sentence_building
        puzzle_data = data.get('puzzle_data', {})
        user_answers = data.get('user_answers', {})
        correct_answers = data.get('correct_answers', {})
        time_spent = data.get('time_spent', time.time() - start_time)
        difficulty = data.get('difficulty', 'medium')
        theme = data.get('theme', 'general')
        
        # Calculate correctness
        if activity_type == 'crossword_completion':
            total_words = len(correct_answers)
            correct_words = sum(1 for word, answer in user_answers.items() 
                              if answer.upper() == correct_answers.get(word, '').upper())
            is_correct = (correct_words / total_words) >= 0.7 if total_words > 0 else False
            
            challenge_level = 'crossword_puzzle'
            learning_focus = 'vocabulary_comprehension'
            
        elif activity_type == 'sentence_building':
            # For sentence building, check if sentence contains the target word properly
            sentence = user_answers.get('sentence', '')
            target_word = user_answers.get('target_word', '')
            
            # Basic validation: contains word, starts with capital, ends with punctuation
            contains_word = target_word.lower() in sentence.lower()
            starts_capital = len(sentence) > 0 and sentence[0].isupper()
            ends_punctuation = len(sentence) > 0 and sentence[-1] in '.!?'
            
            is_correct = contains_word and starts_capital and ends_punctuation
            challenge_level = 'sentence_construction'
            learning_focus = 'sentence_formation'
            
        else:
            is_correct = False
            challenge_level = 'general'
            learning_focus = 'reading_comprehension'
        
        # Log activity for authenticated users
        if request.user.is_authenticated:
            log_sentence_formation_activity(
                user=request.user,
                activity_type=activity_type,
                question_data={
                    'puzzle_data': puzzle_data,
                    'theme': theme,
                    'total_items': len(correct_answers) if activity_type == 'crossword_completion' else 1
                },
                user_answer=user_answers,
                correct_answer=correct_answers,
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level=challenge_level,
                learning_focus=learning_focus
            )
        
        response_data = {
            'logged': request.user.is_authenticated,
            'is_correct': is_correct,
            'feedback': 'Excellent work!' if is_correct else 'Keep practicing!'
        }
        
        # Add progress info for authenticated users
        if request.user.is_authenticated:
            try:
                progress = UserProgress.objects.get(
                    user=request.user,
                    module='sentence_formation',
                    difficulty=difficulty
                )
                response_data['progress'] = {
                    'total_attempts': progress.total_attempts,
                    'accuracy_percentage': progress.accuracy_percentage,
                    'correct_answers': progress.correct_answers
                }
            except UserProgress.DoesNotExist:
                pass
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error logging crossword activity: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def get_crossword_analytics(request):
    """
    Get analytics for crossword game sessions
    """
    try:
        user_email = request.GET.get('user_email', 'guest@wildlitz.com')
        
        # Get all sessions for this user
        sessions_response = supabase.table('story_game_sessions').select('*').eq('user_email', user_email).execute()
        sessions = sessions_response.data if sessions_response.data else []
        
        if not sessions:
            return JsonResponse({
                'success': True,
                'analytics': {
                    'total_games_played': 0,
                    'total_words_attempted': 0,
                    'total_correct_words': 0,
                    'overall_accuracy': 0,
                    'average_time_per_game': 0
                }
            })
        
        # Calculate totals
        total_games = len(sessions)
        total_words = sum([s.get('total_words_solved', 0) for s in sessions])
        total_time = sum([s.get('total_duration_seconds', 0) for s in sessions])
        
        # ✅ NEW: Calculate accuracy from accuracy_percentage field
       # ✅ FIXED: Calculate accuracy - include ALL sessions
        # âœ… FIXED: Calculate accuracy from accuracy_percentage field
        total_accuracy = 0
        sessions_with_data = 0

        for session in sessions:
            # Try to get accuracy_percentage first
            accuracy = safe_float(session.get('accuracy_percentage'), None)
            
            # If accuracy_percentage exists (even if 0), use it
            if accuracy is not None:  # âœ… This includes 0% accuracy!
                total_accuracy += accuracy
                sessions_with_data += 1
            else:
                # Otherwise, calculate from attempts if available
                total_attempts = safe_int(session.get('total_attempts'), 0)
                correct_attempts = safe_int(session.get('correct_attempts'), 0)
                if total_attempts > 0:
                    calculated_accuracy = (correct_attempts / total_attempts) * 100
                    total_accuracy += calculated_accuracy
                    sessions_with_data += 1

        # Average accuracy across all sessions with data
        average_accuracy = round((total_accuracy / sessions_with_data), 1) if sessions_with_data > 0 else 0
        
        return JsonResponse({
            'success': True,
            'analytics': {
                'total_games_played': total_games,
                'total_words_attempted': total_words,
                'total_correct_words': total_words,  # All solved words are correct
                'overall_accuracy': round(overall_accuracy, 1),  # ✅ Use new calculation
                'average_time_per_game': round(avg_time_per_game, 1)
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching crossword analytics: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def log_crossword_activity(request):
    """
    Log crossword game activity
    Call this when: 1) A word is solved, 2) A game is completed
    """
    try:
        data = request.data
        
        # Create activity record
        activity = UserActivity.objects.create(
            user=request.user if request.user.is_authenticated else User.objects.get(id=1),  # Use guest user if not authenticated
            module='sentence_formation',
            activity_type=data.get('activity_type'),  # 'crossword_word_solved' or 'crossword_game_completed'
            question_data=data.get('question_data', {}),
            user_answer=data.get('user_answer', {}),
            correct_answer=data.get('correct_answer', {}),
            is_correct=data.get('is_correct', False),
            time_spent=data.get('time_spent', 0),
            difficulty=data.get('difficulty', 'medium'),
            challenge_level=data.get('challenge_level', ''),
            learning_focus=data.get('learning_focus', '')
        )
        
        return JsonResponse({
            'success': True,
            'activity_id': activity.id,
            'message': 'Activity logged successfully'
        })
        
    except Exception as e:
        logger.error(f"Error logging crossword activity: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    
    # ==================== ADD THESE TO THE END OF YOUR views.py FILE ====================

# STORY GENERATOR ANALYTICS VIEWS
# Add these 6 functions at the very end of your sentence_formation/views.py

@api_view(['POST'])
@permission_classes([AllowAny])
def create_story_session(request):
    """Create a new story game session"""
    try:
        data = request.data
        user_email = data.get('user_email', 'guest@wildlitz.com')
        user_id = data.get('user_id')
        
        session_data = {
            'user_id': user_id,
            'user_email': user_email,
            'story_id': data.get('story_id'),
            'story_title': data.get('story_title'),
            'theme': data.get('theme'),
            'focus_skills': data.get('focus_skills', []),
            'episode_count': data.get('episode_count', 0),
            'character_names': data.get('character_names', ''),
            'current_episode': 1,
            'metadata': data.get('metadata', {})
        }
        
        response = supabase.table('story_game_sessions').insert(session_data).execute()
        
        if response.data:
            logger.info(f"Story session created: {response.data[0]['id']}")
            return Response({
                'success': True,
                'session_id': response.data[0]['id'],
                'session': response.data[0]
            }, status=status.HTTP_201_CREATED)
        else:
            logger.error("Failed to create session - no data returned")
            return Response({
                'error': 'Failed to create session'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error creating story session: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'POST'])
@permission_classes([AllowAny])
def update_story_session(request, session_id):
    """Update an existing story game session"""
    try:
        data = request.data
        
        update_data = {}
        
        # Update fields if provided
        if 'episodes_completed' in data:
            episodes_completed = data['episodes_completed']
            if isinstance(episodes_completed, (int, float)) and episodes_completed > 0:
                update_data['episodes_completed'] = int(episodes_completed)
        
        if 'current_episode' in data:
            update_data['current_episode'] = data['current_episode']
        
        if 'total_words_solved' in data:
            update_data['total_words_solved'] = data['total_words_solved']
        
        if 'total_puzzles_completed' in data:
            update_data['total_puzzles_completed'] = data['total_puzzles_completed']
        
        if 'total_hints_used' in data:
            update_data['total_hints_used'] = data['total_hints_used']
        
        if 'average_time_per_word' in data:
            update_data['average_time_per_word'] = data['average_time_per_word']
        
        if 'story_reading_time_seconds' in data:
            update_data['story_reading_time_seconds'] = data['story_reading_time_seconds']
        
        if 'vocabulary_words_learned' in data:
            update_data['vocabulary_words_learned'] = data['vocabulary_words_learned']
        
        if 'reading_coach_interactions' in data:
            update_data['reading_coach_interactions'] = data['reading_coach_interactions']
        
        if 'is_completed' in data:
            update_data['is_completed'] = data['is_completed']
            if data['is_completed']:
                update_data['session_end'] = datetime.now().isoformat()
        
        if 'completion_percentage' in data:
            update_data['completion_percentage'] = data['completion_percentage']
        
        if 'total_duration_seconds' in data:
            update_data['total_duration_seconds'] = data['total_duration_seconds']
        
        if 'metadata' in data:
            update_data['metadata'] = data['metadata']
        
        # ✅ CRITICAL: Add these three fields for accuracy tracking
        if 'total_attempts' in data:
            update_data['total_attempts'] = int(data['total_attempts'])
            logger.info(f"✅ Setting total_attempts to: {update_data['total_attempts']}")
        
        if 'correct_attempts' in data:
            update_data['correct_attempts'] = int(data['correct_attempts'])
            logger.info(f"✅ Setting correct_attempts to: {update_data['correct_attempts']}")
        
        if 'accuracy_percentage' in data:
            update_data['accuracy_percentage'] = float(data['accuracy_percentage'])
            logger.info(f"✅ Setting accuracy_percentage to: {update_data['accuracy_percentage']}")
        
        logger.info(f"📊 Updating session {session_id} with data: {update_data}")
        
        response = supabase.table('story_game_sessions').update(update_data).eq('id', session_id).execute()
        
        if response.data:
            logger.info(f"✅ Story session updated: {session_id}")
            logger.info(f"   Response data: {response.data[0]}")
            return Response({
                'success': True,
                'session': response.data[0]
            })
        else:
            logger.warning(f"⚠️ Session not found: {session_id}")
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"❌ Error updating story session: {str(e)}")
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def log_story_activity(request):
    """Log a story game activity"""
    try:
        data = request.data
        user_email = data.get('user_email', 'guest@wildlitz.com')
        time_spent = data.get('time_spent_seconds', 0)
        time_spent_int = int(round(time_spent)) if time_spent else 0


        activity_data = {
            'session_id': data.get('session_id'),
            'user_id': data.get('user_id'),
            'user_email': user_email,
            'activity_type': data.get('activity_type'),
            'episode_number': data.get('episode_number'),
            'puzzle_id': data.get('puzzle_id'),
            'word_data': data.get('word_data', {}),
            'user_answer': data.get('user_answer'),
            'is_correct': data.get('is_correct', False),
            'time_spent_seconds': time_spent_int,  
            'hint_count': data.get('hint_count', 0)
        }
        
        response = supabase.table('story_game_activities').insert(activity_data).execute()
        
        if response.data:
            logger.info(f"Activity logged: {data.get('activity_type')}")
            return Response({
                'success': True,
                'activity_id': response.data[0]['id']
            }, status=status.HTTP_201_CREATED)
        else:
            logger.error("Failed to log activity")
            return Response({
                'error': 'Failed to log activity'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error logging story activity: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_story_analytics(request):
    """Get analytics for story game sessions"""
    try:
        user_email = request.GET.get('user_email', 'guest@wildlitz.com')
        user_id = request.GET.get('user_id')
        days = int(request.GET.get('days', 30))
        limit = int(request.GET.get('limit', 100))
        
        logger.info(f"Fetching analytics - user_email: {user_email}, days: {days}")
        
        # Build query
        query = supabase.table('story_game_sessions').select('*')
        
        if user_email:
            logger.info(f"🔎 Filtering by user_email: {user_email}")
            query = query.eq('user_email', user_email)
        elif user_id:
            logger.info(f"🔎 Filtering by user_id: {user_id}")
            query = query.eq('user_id', user_id)
        
        query = query.order('created_at', desc=True).limit(limit)
        
        response = query.execute()
        sessions = response.data if response.data else []
        
        logger.info(f"Found {len(sessions)} sessions for user_email: {user_email}")
        
        # Helper functions
        def safe_int(value, default=0):
            if value is None:
                return default
            try:
                return int(value)
            except (ValueError, TypeError):
                return default
        
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        # Calculate aggregate statistics
        total_sessions = len(sessions)
        completed_sessions = len([s for s in sessions if s.get('is_completed', False)])
        total_episodes_completed = sum(safe_int(s.get('episodes_completed'), 0) for s in sessions)
        total_words_solved = sum(safe_int(s.get('total_words_solved'), 0) for s in sessions)
        total_time_spent = sum(safe_int(s.get('total_duration_seconds'), 0) for s in sessions)
        
        # ✅ FIXED: Calculate accuracy - include ALL sessions
        total_accuracy = 0
        sessions_with_data = 0

        for session in sessions:
            # Try to get accuracy_percentage first
            accuracy = session.get('accuracy_percentage')
            
            # Log what we're getting
            logger.info(f"Session {session.get('id')}: accuracy_percentage = {accuracy}")
            
            # If accuracy_percentage exists (even if 0 or None), try to use it
            if accuracy is not None:
                total_accuracy += float(accuracy)
                sessions_with_data += 1
                logger.info(f"  ✅ Used accuracy_percentage: {accuracy}")
            else:
                # Otherwise, calculate from attempts if available
                total_attempts = safe_int(session.get('total_attempts'), 0)
                correct_attempts = safe_int(session.get('correct_attempts'), 0)
                if total_attempts > 0:
                    calculated_accuracy = (correct_attempts / total_attempts) * 100
                    total_accuracy += calculated_accuracy
                    sessions_with_data += 1
                    logger.info(f"  📊 Calculated accuracy: {calculated_accuracy}%")

        # Average accuracy across all sessions with data
        average_accuracy = round((total_accuracy / sessions_with_data), 1) if sessions_with_data > 0 else 0
        
        logger.info(f"📊 Accuracy Calculation Summary:")
        logger.info(f"   Total accuracy sum: {total_accuracy}")
        logger.info(f"   Sessions with data: {sessions_with_data}")
        logger.info(f"   Average accuracy: {average_accuracy}%")
        
        # Theme distribution
        theme_counts = {}
        for session in sessions:
            theme = session.get('theme', 'unknown')
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        # Skills distribution
        skill_counts = {}
        for session in sessions:
            skills = session.get('focus_skills', []) or []
            for skill in skills:
                if skill:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Average metrics
        avg_completion_rate = round((completed_sessions / total_sessions * 100), 2) if total_sessions > 0 else 0
        avg_episodes_per_session = round((total_episodes_completed / total_sessions), 2) if total_sessions > 0 else 0
        avg_words_per_session = round((total_words_solved / total_sessions), 2) if total_sessions > 0 else 0
        avg_session_duration = round((total_time_spent / total_sessions), 2) if total_sessions > 0 else 0
        
        logger.info(f"📊 Final Analytics Summary:")
        logger.info(f"   Total sessions: {total_sessions}")
        logger.info(f"   Average accuracy: {average_accuracy}%")
        logger.info(f"   Avg completion rate: {avg_completion_rate}%")
        
        response_data = {
            'success': True,
            'analytics': {
                'summary': {
                    'total_sessions': total_sessions,
                    'completed_sessions': completed_sessions,
                    'total_episodes_completed': total_episodes_completed,
                    'total_words_solved': total_words_solved,
                    'total_time_spent_seconds': total_time_spent,
                    'average_accuracy': average_accuracy,  # ✅ CRITICAL
                    'avg_completion_rate': avg_completion_rate,
                    'avg_episodes_per_session': avg_episodes_per_session,
                    'avg_words_per_session': avg_words_per_session,
                    'avg_session_duration_seconds': avg_session_duration
                },
                'distributions': {
                    'themes': theme_counts,
                    'skills': skill_counts
                },
                'recent_sessions': sessions[:10]
            }
        }
        
        # Log the response we're sending
        logger.info(f"📤 Sending response with average_accuracy: {response_data['analytics']['summary']['average_accuracy']}")
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching story analytics: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([AllowAny])
def get_session_details(request, session_id):
    """Get detailed information about a specific session including all activities"""
    try:
        # Get session data
        session_response = supabase.table('story_game_sessions').select('*').eq('id', session_id).execute()
        
        if not session_response.data:
            logger.warning(f"Session not found: {session_id}")
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        session = session_response.data[0]
        
        # Get all activities for this session
        activities_response = supabase.table('story_game_activities').select('*').eq('session_id', session_id).order('created_at').execute()
        
        activities = activities_response.data if activities_response.data else []
        
        # Separate word_solved activities from game_completed
        word_activities = [a for a in activities if a.get('activity_type') == 'word_solved']
        completion_activities = [a for a in activities if a.get('activity_type') == 'game_completed']
        
        # Calculate word-level stats
        word_stats = []
        for activity in word_activities:
            word_data = activity.get('word_data', {})
            word_stats.append({
                'word': word_data.get('word', 'Unknown'),
                'time_spent': activity.get('time_spent_seconds', 0),
                'hints_used': activity.get('hint_count', 0),
                'episode_number': activity.get('episode_number', 1),
                'is_correct': activity.get('is_correct', True),
                'created_at': activity.get('created_at')
            })
        
        logger.info(f"Session details retrieved: {session_id}")
        
        return Response({
            'success': True,
            'session': session,
            'activities': activities,
            'word_activities': word_activities,
            'word_stats': word_stats,
            'total_activities': len(activities),
            'total_words': len(word_activities)
        })
        
    except Exception as e:
        logger.error(f"Error fetching session details: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



@api_view(['GET'])
@permission_classes([AllowAny])
def get_word_performance(request):
    """Get aggregated word performance across all sessions for a user"""
    try:
        user_email = request.GET.get('user_email', 'guest@wildlitz.com')
        
        # Get all word_solved activities for this user
        activities_response = supabase.table('story_game_activities').select('*').eq('user_email', user_email).eq('activity_type', 'word_solved').execute()
        
        activities = activities_response.data if activities_response.data else []
        
        # Aggregate by word
        word_performance = {}
        for activity in activities:
            word_data = activity.get('word_data', {})
            word = word_data.get('word', 'Unknown')
            
            if word not in word_performance:
                word_performance[word] = {
                    'word': word,
                    'total_attempts': 0,
                    'total_time': 0,
                    'total_hints': 0,
                    'correct_attempts': 0
                }
            
            word_performance[word]['total_attempts'] += 1
            word_performance[word]['total_time'] += activity.get('time_spent_seconds', 0)
            word_performance[word]['total_hints'] += activity.get('hint_count', 0)
            if activity.get('is_correct', False):
                word_performance[word]['correct_attempts'] += 1
        
        # Calculate averages and sort by difficulty (time + hints)
        word_list = []
        for word, stats in word_performance.items():
            avg_time = stats['total_time'] / stats['total_attempts'] if stats['total_attempts'] > 0 else 0
            avg_hints = stats['total_hints'] / stats['total_attempts'] if stats['total_attempts'] > 0 else 0
            accuracy = (stats['correct_attempts'] / stats['total_attempts'] * 100) if stats['total_attempts'] > 0 else 0
            difficulty_score = avg_time + (avg_hints * 5)  # Weighted difficulty
            
            word_list.append({
                'word': word,
                'attempts': stats['total_attempts'],
                'avg_time': round(avg_time, 1),
                'avg_hints': round(avg_hints, 1),
                'accuracy': round(accuracy, 1),
                'difficulty_score': round(difficulty_score, 1)
            })
        
        # Sort by difficulty (hardest first)
        word_list.sort(key=lambda x: x['difficulty_score'], reverse=True)
        
        return Response({
            'success': True,
            'words': word_list,
            'total_unique_words': len(word_list)
        })
        
    except Exception as e:
        logger.error(f"Error fetching word performance: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_story_session(request, session_id):
    """Delete a story game session"""
    try:
        response = supabase.table('story_game_sessions').delete().eq('id', session_id).execute()
        
        logger.info(f"Session deleted: {session_id}")
        
        return Response({
            'success': True,
            'message': 'Session deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting story session: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
FOCUS_SKILL_VOCABULARY = {
    'phonics-sh': {
        'description': 'Words containing the SH sound (digraph)',
        'examples': ['ship', 'fish', 'shop', 'wish', 'brush', 'shell', 'dish', 'cash', 
                    'rush', 'push', 'fresh', 'trash', 'crush', 'flash', 'wash'],
        'instruction': 'Use words with the SH digraph (can appear at beginning, middle, or end)'
    },
    'phonics-ch': {
        'description': 'Words containing the CH sound (digraph)',
        'examples': ['chat', 'chip', 'chop', 'lunch', 'beach', 'teach', 'reach', 'much',
                    'catch', 'match', 'bench', 'cheese', 'check', 'chain', 'chase'],
        'instruction': 'Use words with the CH digraph (can appear at beginning, middle, or end)'
    },
    'phonics-th': {
        'description': 'Words containing the TH sound (digraph)',
        'examples': ['think', 'bath', 'with', 'that', 'path', 'three', 'thick', 'math',
                    'thank', 'mouth', 'cloth', 'earth', 'both', 'them', 'this'],
        'instruction': 'Use words with the TH digraph (can appear at beginning, middle, or end)'
    },
    'phonics-wh': {
        'description': 'Words containing the WH sound (digraph)',
        'examples': ['when', 'what', 'where', 'which', 'white', 'whale', 'wheel', 'why',
                    'wheat', 'while', 'whisper', 'whistle', 'whip', 'whisk', 'whole'],
        'instruction': 'Use words with the WH digraph (usually at the beginning of words)'
    },
    'action-verbs': {
        'description': 'Action words that describe what someone or something does',
        'examples': ['run', 'jump', 'swim', 'climb', 'play', 'walk', 'look', 'find', 'help', 
                    'push', 'pull', 'throw', 'catch', 'kick', 'dance', 'sing', 'laugh', 'sleep',
                    'eat', 'drink', 'read', 'write', 'draw', 'build', 'dive', 'reach', 'grab'],
        'instruction': 'Use simple present tense action verbs that a grade 3 student can act out'
    }
}

def get_vocabulary_guidance(focus_skills, exclude_words=None):
    """
    Generate detailed vocabulary guidance based on selected focus skills
    ✅ NEW: Now supports excluding previously used words
    
    Args:
        focus_skills: List of skill IDs (e.g., ['phonics-ch', 'action-verbs'])
        exclude_words: Set or list of words to exclude (already used in previous episodes)
    
    Returns:
        Dictionary with:
        - detailed_guidance: Formatted string with skill instructions
        - example_words: List of available words (with exclusions filtered out)
        - excluded_count: Number of words excluded
        - available_count: Number of words available after exclusion
    """
    # ⭐ NEW: Handle word exclusion
    if exclude_words is None:
        exclude_words = set()
    else:
        # Ensure all excluded words are lowercase for comparison
        exclude_words = {w.lower().strip() for w in exclude_words if w}
    
    logger.info(f"📚 Generating vocabulary guidance")
    logger.info(f"   Focus skills: {focus_skills}")
    logger.info(f"   Excluding {len(exclude_words)} previously used words")
    
    guidance_parts = []
    all_examples = []
    
    for skill in focus_skills:
        if skill in FOCUS_SKILL_VOCABULARY:
            skill_data = FOCUS_SKILL_VOCABULARY[skill]
            
            # ⭐ NEW: Filter out excluded words from examples
            available_examples = [
                word for word in skill_data['examples'] 
                if word.lower().strip() not in exclude_words
            ]
            
            # Log filtering results
            original_count = len(skill_data['examples'])
            filtered_count = len(available_examples)
            logger.info(f"   {skill}: {filtered_count}/{original_count} words available (after filtering)")
            
            # If we have no words left after filtering, warn and use all words
            if len(available_examples) == 0:
                logger.warning(f"⚠️ All words for {skill} were excluded! Using original list.")
                available_examples = skill_data['examples'][:10]
            
            # Build guidance text
            guidance_parts.append(
                f"\n- {skill.upper()}: {skill_data['description']}\n"
                f"  {skill_data['instruction']}\n"
                f"  Available NEW words: {', '.join(available_examples[:10])}"
                f"  ({len(available_examples)} words available)"
            )
            
            # Add to all examples list
            all_examples.extend(available_examples)
    
    # If no focus skills matched, provide defaults
    if not guidance_parts:
        logger.warning("⚠️ No matching focus skills found, using defaults")
        guidance_parts.append(
            "\n- DEFAULT: Use simple grade 3 appropriate action verbs and common words"
        )
        all_examples = ['run', 'jump', 'look', 'find', 'help', 'walk', 'play']
    
    # Remove duplicates from all_examples
    unique_examples = list(set(all_examples))
    
    logger.info(f"✅ Vocabulary guidance generated:")
    logger.info(f"   Total unique words available: {len(unique_examples)}")
    logger.info(f"   Words excluded: {len(exclude_words)}")
    
    return {
        'detailed_guidance': '\n'.join(guidance_parts),
        'example_words': unique_examples,
        'excluded_count': len(exclude_words),
        'available_count': len(unique_examples)
    }



@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def explain_word(request):
    """
    Generate kid-friendly word explanations using GPT for Reading Helper
    """
    try:
        data = json.loads(request.body)
        word = data.get('word', '').strip()
        grade_level = data.get('grade_level', 3)
        context = data.get('context', '')
        
        if not word:
            return JsonResponse({
                'success': False,
                'error': 'Word parameter is required'
            }, status=400)
        
        logger.info(f"Explaining word '{word}' for grade {grade_level}")
        
        # Create a detailed prompt for GPT
        context_info = f'\n\nThe word appears in this context: "{context}"' if context else ''
        
        prompt = f"""You are a friendly elementary school reading teacher explaining vocabulary to a grade {grade_level} student.

Explain the word "{word}" in a clear, simple way that a {grade_level}rd grade student would understand.{context_info}

Provide your response in this EXACT JSON format:
{{
  "definition": "A clear, simple definition using everyday language",
  "example": "A simple sentence using the word that a child would understand",
  "part_of_speech": "noun/verb/adjective/adverb/etc",
  "syllables": "word broken into syllables with hyphens (e.g. tem-ple)",
  "synonyms": ["similar word 1", "similar word 2", "similar word 3"]
}}

Rules:
- Definition must be 1-2 sentences, using simple words
- Example sentence must be relatable to a child's life
- Part of speech must be lowercase (noun, verb, adjective, etc.)
- Syllables must use hyphens to separate (e.g. "ad-ven-ture")
- Provide 2-4 synonyms that are also simple words
- Make it engaging and fun!"""

        try:
            # Call OpenAI API
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert elementary school reading teacher who explains vocabulary in simple, engaging ways for children."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            # Parse the GPT response
            gpt_response = response.choices[0].message.content.strip()
            logger.info(f"GPT response for '{word}': {gpt_response[:100]}...")
            
            # Try to extract JSON from the response
            try:
                # Remove markdown code blocks if present
                if '```json' in gpt_response:
                    gpt_response = gpt_response.split('```json')[1].split('```')[0].strip()
                elif '```' in gpt_response:
                    gpt_response = gpt_response.split('```')[1].split('```')[0].strip()
                
                word_data = json.loads(gpt_response)
                
                # Validate required fields
                required_fields = ['definition', 'example', 'part_of_speech', 'syllables']
                for field in required_fields:
                    if field not in word_data:
                        raise ValueError(f'Missing required field: {field}')
                
                # Ensure synonyms is a list
                if 'synonyms' not in word_data or not isinstance(word_data['synonyms'], list):
                    word_data['synonyms'] = []
                
                logger.info(f"Successfully explained word '{word}'")
                
                return JsonResponse({
                    'success': True,
                    'definition': word_data['definition'],
                    'example': word_data['example'],
                    'part_of_speech': word_data['part_of_speech'],
                    'syllables': word_data['syllables'],
                    'synonyms': word_data['synonyms']
                })
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse GPT JSON response: {gpt_response}")
                logger.error(f"JSON Error: {str(e)}")
                
                # Fallback: Create a basic response from the text
                return JsonResponse({
                    'success': True,
                    'definition': f"{word.capitalize()} is a word used in the story.",
                    'example': f'The word "{word}" helps us understand what is happening.',
                    'part_of_speech': 'word',
                    'syllables': word,
                    'synonyms': []
                })
                
        except Exception as e:
            logger.error(f"OpenAI API error for word '{word}': {str(e)}")
            logger.error(traceback.format_exc())
            
            # Return a basic fallback response
            return JsonResponse({
                'success': True,
                'definition': f"The word '{word}' appears in the story and has special meaning.",
                'example': f'You can learn about "{word}" by reading the story carefully.',
                'part_of_speech': 'word',
                'syllables': word,
                'synonyms': []
            })
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        logger.error(f"Unexpected error in explain_word: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)