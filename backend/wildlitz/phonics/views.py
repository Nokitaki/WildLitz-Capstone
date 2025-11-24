from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import random
import logging
import openai
from django.conf import settings
from supabase import create_client
from datetime import datetime
import uuid

# Configure logger
logger = logging.getLogger(__name__)

# Configure OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def validate_long_vowel_pattern(word, target_letter):
    """
    Validate that the targetLetter pattern actually exists in the word.
    Returns True if valid, False if not.
    """
    if not target_letter or not word:
        return False
    
    word_lower = word.lower()
    target_lower = target_letter.lower()
    
    # Remove prefixes
    clean_target = target_lower.replace('short_', '').replace('long_', '').replace('blend_', '').replace('digraph_', '').replace('vowel_team_', '')
    
    # For magic-e patterns (a_e, i_e, o_e, u_e, e_e)
    if '_' in clean_target:
        vowel, e = clean_target.split('_')
        # Check if vowel + any letter + 'e' exists
        for i in range(len(word_lower) - 2):
            if word_lower[i] == vowel and word_lower[i + 2] == e:
                return True
        return False
    
    # For regular patterns (consecutive letters)
    return clean_target in word_lower


def regenerate_if_invalid(words, learning_focus):
    """
    Check each word and regenerate if targetLetter doesn't exist in word.
    Only applies to long_vowels.
    """
    if learning_focus != 'long_vowels':
        return words
    
    validated_words = []
    for word_obj in words:
        word = word_obj.get('word', '')
        target = word_obj.get('targetLetter', '')
        
        if validate_long_vowel_pattern(word, target):
            validated_words.append(word_obj)
        else:
            # Log the error for debugging
            print(f"❌ REJECTED: '{word}' with targetLetter '{target}' - pattern doesn't exist!")
    
    return validated_words

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def test_phonics_endpoint(request):
    """Simple test endpoint to verify phonics API connectivity"""
    return JsonResponse({
        "status": "success", 
        "message": "Phonics API is working",
        "module": "phonics",
        "ai_enabled": bool(settings.OPENAI_API_KEY)
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_vanishing_words(request):
    """
    Generate words for the vanishing game using OpenAI GPT
    
    Expected JSON payload:
    {
        "challengeLevel": "simple_words|compound_words|phrases|simple_sentences",
        "learningFocus": "short_vowels|long_vowels|blends|digraphs",
        "difficulty": "easy|medium|hard",
        "wordCount": 10
    }
    
    Returns:
    {
        "success": true,
        "words": [
            {
                "word": "cat",
                "syllableBreakdown": "cat",
                "targetLetter": "a",
                "definition": "A small furry pet",
                "pattern": "short_a",
                "patternPosition": "middle",
                "phonicsRule": "Short vowel 'a' makes the sound like in 'apple'"
            },
            ...
        ]
    }
    """
    try:
        data = request.data
        challenge_level = data.get('challengeLevel', 'simple_words')
        learning_focus = data.get('learningFocus', 'short_vowels')
        difficulty = data.get('difficulty', 'easy')
        word_count = data.get('wordCount', 10)
        
        logger.info(f"AI generating {word_count} words for {challenge_level}/{learning_focus}/{difficulty}")
        
        # Generate words using OpenAI
        words = generate_phonics_words_with_ai(challenge_level, learning_focus, difficulty, word_count)
        
        return Response({
            'success': True,
            'words': words,
            'count': len(words),
            'ai_generated': True,
            'config': {
                'challengeLevel': challenge_level,
                'learningFocus': learning_focus,
                'difficulty': difficulty
            }
        })
    
    except Exception as e:
        logger.error(f"Error generating vanishing words: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'words': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_phonics_words_with_ai(challenge_level, learning_focus, difficulty, word_count):
    """Generate phonics-based words using OpenAI GPT with educational expertise"""
    
    print(f"🎯 Requested word_count: {word_count}")
    print(f"📋 Challenge level: {challenge_level}")

    # 🔥 SMART LIMITS: Max per single API call based on token limits
    if challenge_level == 'simple_sentences':
        MAX_PER_CALL = 15  # 15 sentences × 250 tokens = 3750 tokens (safe)
    elif challenge_level == 'phrases':
        MAX_PER_CALL = 20  # 20 phrases × 180 tokens = 3600 tokens
    elif challenge_level == 'compound_words':
        MAX_PER_CALL = 25  # 25 compounds × 140 tokens = 3500 tokens
    else:  # simple_words
        MAX_PER_CALL = 34  # 34 words × 100 tokens = 3400 tokens
    
    # If request is within limit, generate in one call
    if word_count <= MAX_PER_CALL:
        print(f"✅ Single call: generating {word_count} items")
        return generate_single_batch(challenge_level, learning_focus, difficulty, word_count)
    
    # If request exceeds limit, generate in batches
    print(f"📦 Batching: generating {word_count} items in multiple calls")
    return generate_in_batches(challenge_level, learning_focus, difficulty, word_count, MAX_PER_CALL)


def generate_single_batch(challenge_level, learning_focus, difficulty, word_count):
    """Generate a single batch of words"""
    
    # Calculate max tokens based on content type
    if challenge_level == 'simple_sentences':
        max_tokens = 4000
    elif challenge_level == 'phrases':
        max_tokens = 3800
    elif challenge_level == 'compound_words':
        max_tokens = 3600
    else:
        max_tokens = 3400
    
    try:
        prompt = create_phonics_prompt(challenge_level, learning_focus, difficulty, word_count)
        
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": f"""You are an expert elementary school phonics teacher.

🚨 CRITICAL: Generate EXACTLY {word_count} complete objects!

RESPOND ONLY WITH A JSON ARRAY. NO MARKDOWN. NO EXPLANATIONS.
                    """
                },
                {
                    "role": "user",
                    "content": f"""Generate EXACTLY {word_count} complete word objects.
                    
Now generate:"""
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=max_tokens
        )
        
        content = response.choices[0].message.content.strip()
        print(f"\n{'='*70}\n🤖 RAW AI RESPONSE:\n{content}\n{'='*70}\n")
        
        # Parse JSON
        import re
        json_match = re.search(r'\[[\s\S]*\]', content)
        if json_match:
            json_str = json_match.group(0)
            json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
            
            words = json.loads(json_str)
            print(f"📊 AI generated {len(words)} words, needed {word_count} words")
            
            # Validate
            validated_words = [w for w in words if validate_word_structure(w)]
            
            if len(validated_words) >= word_count:
                return validated_words[:word_count]
            else:
                # Supplement with fallback
                fallback_needed = word_count - len(validated_words)
                fallback = generate_static_fallback_words(challenge_level, learning_focus, fallback_needed)
                return validated_words + fallback
        
        raise Exception("Invalid JSON format")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return generate_static_fallback_words(challenge_level, learning_focus, word_count)


def generate_in_batches(challenge_level, learning_focus, difficulty, total_count, batch_size):
    """Generate words in multiple batches to stay within token limits"""
    
    all_words = []
    batches_needed = (total_count + batch_size - 1) // batch_size  # Ceiling division
    
    print(f"🔄 Generating {total_count} items in {batches_needed} batches of {batch_size}")
    
    for i in range(batches_needed):
        remaining = total_count - len(all_words)
        current_batch_size = min(batch_size, remaining)
        
        print(f"📦 Batch {i+1}/{batches_needed}: generating {current_batch_size} items")
        
        try:
            batch_words = generate_single_batch(challenge_level, learning_focus, difficulty, current_batch_size)
            all_words.extend(batch_words)
            
            # Small delay between batches
            if i < batches_needed - 1:
                import time
                time.sleep(0.1)
                
        except Exception as e:
            print(f"❌ Batch {i+1} failed: {e}")
            # Use fallback for remaining
            fallback_needed = total_count - len(all_words)
            fallback = generate_static_fallback_words(challenge_level, learning_focus, fallback_needed)
            all_words.extend(fallback)
            break
    
    print(f"✅ Total generated: {len(all_words)} items")
    return all_words[:total_count]

def create_phonics_prompt(challenge_level, learning_focus, difficulty, word_count):
    """Create a detailed educational prompt for OpenAI"""
    
    # Define learning objectives for each focus area
    focus_descriptions = {
        'short_vowels': 'short vowel sounds (a as in apple, e as in egg, i as in igloo, o as in octopus, u as in umbrella)',
        'long_vowels': 'long vowel sounds and silent-e patterns (a_e as in cake, i_e as in bike, o_e as in home)',
        'blends': 'consonant blends where two letters make two sounds (bl, cl, fl, fr, gr, pl, pr, sl, sp, st, tr, etc.)',
        'digraphs': 'consonant digraphs where two letters make one sound (sh, ch, th, wh, ph, etc.)'
    }
    
    # Define challenge level requirements  
    level_descriptions = {
        'simple_words': 'single-syllable words (3-5 letters, common vocabulary)',
        'compound_words': 'two words joined together (sunshine, backpack, playground)',
        'phrases': '2-4 word phrases (big red hat, run very fast)',
        'simple_sentences': 'complete sentences with 4-8 words (The cat ran home.)'
    }
    
    # Define difficulty adjustments
    difficulty_descriptions = {
        'easy': 'common, familiar words that children use daily',
        'medium': 'grade-appropriate words with moderate complexity',
        'hard': 'more challenging vocabulary that expands learning'
    }

    # 🔥 ADD WORD COUNT REQUIREMENT AT THE START
    prompt = f"""
🚨🚨🚨 CRITICAL REQUIREMENT 🚨🚨🚨

YOU MUST GENERATE EXACTLY {word_count} COMPLETE WORD OBJECTS IN YOUR JSON ARRAY!

REQUIRED COUNT: {word_count} words
NOT {word_count - 1} words. NOT {word_count - 5} words. EXACTLY {word_count} WORDS!

Before you respond, count your output: 1, 2, 3... {word_count}
If you don't have {word_count} complete objects, ADD MORE until you reach {word_count}!

---

You are an expert phonics educator creating learning materials for elementary students.

{"CRITICAL REQUIREMENT: Generate COMPLETE SENTENCES, not single words! Each entry must be a full sentence with subject and verb. ⚠️" if challenge_level == 'simple_sentences' else ""}
    
    TARGET SPECIFICATIONS:
    - Challenge Level: {level_descriptions[challenge_level]}
    - Learning Focus: {focus_descriptions[learning_focus]}
    - Difficulty: {difficulty_descriptions[difficulty]}
    
    EDUCATIONAL REQUIREMENTS:
    1. Each word must clearly demonstrate the target phonics pattern
    2. Words should be age-appropriate and within children's vocabulary range
    3. Include variety to maintain student engagement
    4. Ensure proper phonics rules are represented
    5. Create educationally meaningful definitions

        """

    if challenge_level == 'simple_sentences':
        prompt += """

!!!!! CRITICAL REQUIREMENT - DO NOT IGNORE THIS !!!!!

You are generating SIMPLE SENTENCES with phonics patterns.

ABSOLUTE RULE - NO EXCEPTIONS:
The targetLetter field MUST NEVER be "sentence" or "simple_sentence"!

You MUST identify the actual phonics pattern in the sentence and use that specific pattern.

Based on the learning focus:
"""
        
        if learning_focus == 'long_vowels':
            prompt += """
LEARNING FOCUS: Long Vowels

!!!!! CRITICAL WARNING - LONG VOWELS ARE COMPLEX !!!!!

Long vowel patterns require EXTRA ATTENTION!
You MUST specify exact patterns like "a_e", "ue", "ai", "oa"
NEVER EVER use "sentence" or "simple_sentence" for targetLetter!

This is MORE CRITICAL for long vowels than other patterns!

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

LEARNING FOCUS: Long Vowels


For EVERY sentence you generate:
1. Identify which long vowel pattern appears in the sentence
2. Use that SPECIFIC pattern in targetLetter

Required patterns for long vowels:
- Long A: "a_e" (cake, make, snake, take), "ai" (rain, wait), "ay" (day, play)
- Long E: "ee" (tree, see), "ea" (beach, eat), "e_e" (these)
- Long I: "i_e" (like, time, wise), "ie" (pie, tie), "igh" (night, light)
- Long O: "o_e" (home, hope, rope), "oa" (boat, road), "ow" (snow, blow)
- Long U: "u_e" (huge, cute, use), "ue" (blue, true), "ui" (fruit, juice)

EXAMPLE - CORRECT:
Sentence: "The huge snake slithered through the grass."
Analysis: This has "huge" (u_e) and "snake" (a_e)
Choose the most prominent: "a_e"
{{
    "word": "The huge snake slithered through the grass.",
    "targetLetter": "a_e",
    "pattern": "long_a",
    "patternPosition": "multiple"
}}

EXAMPLE - WRONG (DO NOT DO THIS):
{{
    "word": "The huge snake slithered through the grass.",
    "targetLetter": "sentence",
    "pattern": "simple_sentence"
}}
"""
        elif learning_focus == 'short_vowels':
            prompt += """
LEARNING FOCUS: Short Vowels

Use: "a", "e", "i", "o", or "u" based on which short vowel appears most in the sentence.

Example: "The cat sat on a mat." -> targetLetter: "a", pattern: "short_a"
"""
        elif learning_focus == 'blends':
            prompt += """
LEARNING FOCUS: Consonant Blends

Use the specific blend: "st", "bl", "fr", "gr", "cl", etc.

Example: "The frog can jump fast." -> targetLetter: "fr", pattern: "blend_fr"
"""
        elif learning_focus == 'digraphs':
            prompt += """
LEARNING FOCUS: Digraphs

Use the specific digraph: "sh", "ch", "th", "wh", "ph"

Example: "The ship sails on the sea." -> targetLetter: "sh", pattern: "digraph_sh"
"""
        
        prompt += """

FINAL REMINDER:
- targetLetter = specific pattern ("a_e", "ee", "sh", "bl", etc.)
- targetLetter NEVER EQUALS "sentence" or "simple_sentence"
- If you use "sentence", the game will break and students cannot learn!
"""

    prompt += """

    RETURN FORMAT - JSON array with this EXACT structure:
    [
        {{
            "word": "cat",
            "syllableBreakdown": "cat",
            "targetLetter": "a", 
            "definition": "A small furry pet that says meow",
            "pattern": "short_a",
            "patternPosition": "middle",
            "phonicsRule": "Short vowel 'a' makes the /æ/ sound like in 'apple'"
        }}
    ]
    
    SPECIFIC GUIDELINES FOR THIS REQUEST:
    
    Challenge Level ({challenge_level}):
    """
    
    if challenge_level == 'simple_words':
        prompt += """
    - Use 3-6 letter words
    - Single syllable preferred
    - Common everyday vocabulary
    - Clear phonics patterns
        """
    elif challenge_level == 'compound_words':
        prompt += """
    - Two distinct words joined (not hyphenated)
    - Each part should be recognizable to children
    
!!!!! FOR LONG VOWELS WITH COMPOUND WORDS !!!!!

The compound word MUST ACTUALLY CONTAIN a long vowel pattern!

CORRECT EXAMPLES:
- "rainbow" → has "ai" in "rain" ✅
- "toothpaste" → has "oo" and "a_e" ✅
- "seaweed" → has "ea" in "sea" and "ee" in "weed" ✅
- "mailbox" → has "ai" in "mail" ✅
- "moonlight" → has "oo" in "moon" and "igh" in "light" ✅

WRONG EXAMPLES - DO NOT GENERATE THESE:
- "sunset" → NO long vowels (short u, short e) ❌
- "butterfly" → NO clear long vowels ❌
- "hotdog" → NO long vowels (short o) ❌
- "backpack" → NO long vowels (short a) ❌

CHECK YOUR WORK:
1. Generate a compound word
2. Look at EACH part: Does it have a long vowel pattern?
3. If NO long vowel → Generate a DIFFERENT word!
4. If YES → Use that pattern for targetLetter
    """
    elif challenge_level == 'phrases':
        prompt += """
    - 2-4 words that go together naturally
    - Descriptive phrases children can visualize
    - Examples: "big blue car", "happy little dog"
    - Keep syllable breakdown as the full phrase
        """
    if challenge_level == 'simple_sentences':
        prompt += """
‼️ CRITICAL: GENERATE COMPLETE SENTENCES, NOT SINGLE WORDS! ‼️

- MUST be complete sentences with subject and verb
- 4-8 words per sentence
- End with proper punctuation (. ! ?)
- DO NOT generate single words like "cat" or "dog"
- Each "word" field must contain a FULL SENTENCE
- Examples for short vowels: "The cat sat on the mat.", "A big dog ran so fast.", "The sun is hot today."
- Examples for long vowels: "I like to bake a cake.", "The green tree is tall.", "We ride a bike home."

‼️ REMEMBER: YOU MUST GENERATE SENTENCES, NOT WORDS! ‼️
        """
    
    prompt += f"""
    
    Learning Focus ({learning_focus}):
    """
    
    if learning_focus == 'short_vowels':
        if challenge_level == 'simple_sentences':
            prompt += """
    - Focus on a, e, i, o, u making their short sounds
    - MUST generate complete SENTENCES (not single words!)
    - Each sentence must have a subject and verb
    - Include words with short vowel sounds in the sentences
    - Examples: "The cat sat down.", "A red pen is here.", "The pig is big.", "The dog can hop.", "The sun is fun."
            """
        else:
            prompt += """
    - Focus on a, e, i, o, u making their short sounds
    - Target different vowels across the word list
    - Clear examples of CVC patterns (consonant-vowel-consonant)
    - Examples: cat, bed, pig, dog, sun
            """
    elif learning_focus == 'long_vowels':
        prompt += """
    
!!!!! CRITICAL FOR LONG VOWELS - ALL CHALLENGE LEVELS !!!!!

Long vowel patterns are COMPLEX and require SPECIFIC targetLetter values!

YOU MUST USE EXACT PATTERNS:
- For long A: "a_e", "ai", "ay", "ea"
- For long E: "ee", "ea", "e_e", "ie"
- For long I: "i_e", "ie", "igh", "y"
- For long O: "o_e", "oa", "ow", "oe"
- For long U: "u_e", "ue", "ui", "ew"

EXAMPLES BY CHALLENGE LEVEL:

Simple Words: "cake" -> targetLetter: "a_e", pattern: "long_a"
Compound Words: "rainbow" -> targetLetter: "ai", pattern: "long_a"
Phrases: "green tree" -> targetLetter: "ee", pattern: "long_e"
Simple Sentences: "I like to bake." -> targetLetter: "a_e", pattern: "long_a"

!!!!! CRITICAL VALIDATION CHECK !!!!!

BEFORE you set targetLetter, VERIFY the pattern EXISTS in the word!

BAD Example:
Word: "whalebone" 
targetLetter: "oa" ❌ WRONG! There is NO "oa" in "whalebone"!

GOOD Example:
Word: "whalebone" (has wh-a-l-e-bone)
targetLetter: "a_e" ✅ CORRECT! The "a_e" exists in "whale"

STEP-BY-STEP CHECK:
1. Look at the word you generated
2. Find the long vowel pattern that ACTUALLY APPEARS in the word
3. Use that pattern for targetLetter
4. Double-check: Can you see those exact letters in the word?

NEVER use generic values like "long_vowels" or "vowels" in targetLetter!
ALWAYS use the specific pattern like "ee", "ai", "a_e"!
        """
        if challenge_level == 'simple_sentences':
            prompt += """
    - MUST generate complete SENTENCES (not single words!)
    - Each sentence must have a subject and verb
    - Include words with long vowel sounds in the sentences
            """
        else:
            prompt += """
    - Focus on long vowel sounds and patterns
    - Include silent-e pattern (cake, bike, home)
    - Include vowel teams where appropriate (ai, ea, oa)
    - Show how long vowels "say their name"
            """
    elif learning_focus == 'blends':
        prompt += """
    - Two or three consonants that each keep their sound
    - Include both beginning and ending blends
    - Common blends: bl, cl, fl, fr, gr, pl, pr, sl, sp, st, tr, dr, br
    - Examples: stop, tree, flag, clap
        """
    elif learning_focus == 'digraphs':
        prompt += """
    - Two letters that make one sound
    - Common digraphs: sh, ch, th, wh, ph, ng, ck
    - Examples: ship, chat, thin, when, phone
    - Show how two letters work together as a team
        """
    
    prompt += f"""
    
    Difficulty Level ({difficulty}):
    """
    
    if difficulty == 'easy':
        prompt += """
    - Use the most common, familiar words
    - Words children encounter daily
    - Simple, clear phonics patterns
    - Vocabulary from early readers
        """
    elif difficulty == 'medium':
        prompt += """
    - Grade-appropriate vocabulary
    - Moderate complexity in sound patterns
    - Mix of familiar and learning-level words
    - Good for building confidence
        """
    elif difficulty == 'hard':
        prompt += """
    - More challenging vocabulary to expand learning
    - Complex but teachable phonics patterns
    - Words that stretch students' abilities appropriately
    - Still within elementary comprehension
        """
    
    prompt += """
    
CRITICAL FORMATTING REQUIREMENTS:

You MUST return a JSON array where EVERY word object contains ALL 7 required fields:

1. "word": The actual word/phrase/sentence (string, not empty)
2. "syllableBreakdown": Syllables with hyphens, e.g., "sun-set" (string, not empty)
3. "targetLetter": The specific letter(s) or pattern being taught (string, not empty)
   ⚠️ CRITICAL: For simple_sentences, MUST be specific pattern, NEVER "sentence"
   - Short Vowels: "a", "e", "i", "o", "u"
   - Long Vowels: "a_e", "ai", "ay", "ee", "ea", "i_e", "ie", "igh", "o_e", "oa", "ow", "u_e", "ue", "ui"
   - Blends: "st", "bl", "fr", "cl", "gr", "pl", "pr", "tr", etc.
   - Digraphs: "sh", "ch", "th", "wh", "ph", "ng", "ck"
4. "definition": Simple, child-friendly meaning (string, not empty)
5. "pattern": Short identifier like "short_a", "digraph_sh", "compound" (string, not empty)
6. "patternPosition": Must be "beginning", "middle", "end", or "whole" (string, not empty)
7. "phonicsRule": Child-friendly explanation of the phonics rule (string, not empty)

EXAMPLE of a VALID word object:
{
    "word": "fish",
    "syllableBreakdown": "fish",
    "targetLetter": "sh",
    "definition": "An animal that lives in water",
    "pattern": "digraph_sh",
    "patternPosition": "end",
    "phonicsRule": "The letters 's' and 'h' work together to make the /sh/ sound"
}

DO NOT:
- Leave any field empty ("")
- Skip any of the 7 required fields
- Add extra fields
- Include trailing commas

Generate EXACTLY {word_count} complete word objects.
    """

        # 🔥 ADD THIS SECTION HERE (before return prompt)
    prompt += f"""

---

🚨 FINAL CHECK BEFORE RESPONDING 🚨

Count your word objects: [ ] 1, [ ] 2, [ ] 3... [ ] {word_count}

✅ Did you generate EXACTLY {word_count} complete word objects?
   - Each with all 7 required fields: word, syllableBreakdown, targetLetter, definition, pattern, patternPosition, phonicsRule
   - NO trailing commas
   - Proper JSON format

IF YOUR COUNT ≠ {word_count}, DO NOT RESPOND YET!
Add more words or remove words until you have EXACTLY {word_count}!

REQUIRED: {word_count} words | YOUR COUNT: _____
"""
    
    return prompt

def validate_word_structure(word_obj):
    """Validate that a word object has the required structure"""
    required_fields = ['word', 'syllableBreakdown', 'targetLetter', 'definition', 
                      'pattern', 'patternPosition', 'phonicsRule']
    
    if not isinstance(word_obj, dict):
        return False
    
    missing_fields = []
    empty_fields = []
    
    for field in required_fields:
        if field not in word_obj:
            missing_fields.append(field)
        elif not word_obj[field]:
            empty_fields.append(field)
    
    if missing_fields or empty_fields:
        # ADD THESE LINES:
        print(f"\n❌ INVALID: '{word_obj.get('word', 'UNKNOWN')}'")
        if missing_fields:
            print(f"   MISSING: {missing_fields}")
        if empty_fields:
            print(f"   EMPTY: {empty_fields}")
        # END OF NEW LINES
        return False
    
    return True

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_example_words(request):
    """
    Generate example words for a given phonics pattern using AI
    Now considers both pattern, challenge level, and learning focus
    """
    try:
        data = request.data
        pattern = data.get('pattern', 'short_a')
        challenge_level = data.get('challengeLevel', 'simple_words')
        learning_focus = data.get('learningFocus', 'short_vowels')
        count = data.get('count', 5)
        
        logger.info(f"Generating {count} examples for pattern: {pattern}, challenge: {challenge_level}, focus: {learning_focus}")
        
        # Create AI prompt that considers all contexts
        prompt = f"""Generate {count} example words that match ALL of these criteria:

1. Challenge Level: {challenge_level}
   - simple_words: Single words (3-7 letters)
   - compound_words: Two words joined together (like "snowflake", "rainbow")
   - phrases: Short 2-3 word phrases (like "red car", "big dog")
   - simple_sentences: Complete short sentences (like "The cat runs.")

2. Learning Focus: {learning_focus}
   - short_vowels: Words with a, e, i, o, u making short sounds
   - long_vowels: Words with a, e, i, o, u making long sounds
   - blends: Words with consonant blends (bl, st, fr, etc.)
   - digraphs: Words with digraphs (sh, ch, th, wh, ph)

3. Pattern: {pattern}

IMPORTANT: The examples MUST match the challenge level format!

Return ONLY a JSON array of {count} words/phrases/sentences, nothing else.
Format: ["example1", "example2", "example3", ...]

Examples:
- For compound_words + short_vowels: ["hotdog", "sunset", "sandbox", "batcap", "bedmat"]
- For simple_words + digraphs: ["ship", "chat", "fish", "bath", "phone"]
- For phrases + short_vowels: ["red cat", "hot dog", "big bus"]
"""
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a phonics education expert helping children learn to read."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        # Parse AI response
        ai_text = response.choices[0].message.content.strip()
        
        # Clean and parse JSON
        if '```json' in ai_text:
            ai_text = ai_text.split('```json')[1].split('```')[0].strip()
        elif '```' in ai_text:
            ai_text = ai_text.split('```')[1].split('```')[0].strip()
        
        example_words = json.loads(ai_text)
        
        logger.info(f"Successfully generated {len(example_words)} example words")
        
        return Response({
            'success': True,
            'examples': example_words,
            'pattern': pattern,
            'challengeLevel': challenge_level,
            'learningFocus': learning_focus
        })
        
    except Exception as e:
        logger.error(f"Error generating example words: {str(e)}")
        # Smart fallback based on challenge level and learning focus
        fallback = get_smart_fallback(
            data.get('pattern', 'short_a'),
            data.get('challengeLevel', 'simple_words'),
            data.get('learningFocus', 'short_vowels')
        )
        
        return Response({
            'success': True,
            'examples': fallback,
            'pattern': data.get('pattern'),
            'fallback': True
        })


def get_smart_fallback(pattern, challenge_level, learning_focus):
    """Generate smart fallback examples based on all parameters"""
    
    fallbacks = {
        'simple_words': {
            'short_vowels': ['cat', 'bed', 'pig', 'hot', 'sun'],
            'long_vowels': ['cake', 'tree', 'bike', 'rope', 'cube'],
            'blends': ['stop', 'frog', 'clip', 'drop', 'swim'],
            'digraphs': ['ship', 'chat', 'thin', 'when', 'phone']
        },
        'compound_words': {
            'short_vowels': ['hotdog', 'sunset', 'sandbox', 'batcap', 'laptop'],
            'long_vowels': ['rainbow', 'seaweed', 'beehive', 'moonlight', 'daytime'],
            'blends': ['playground', 'backpack', 'flagpole', 'classroom', 'snowflake'],
            'digraphs': ['seashell', 'toothbrush', 'fishpond', 'shopfront', 'pathway']
        },
        'phrases': {
            'short_vowels': ['red cat', 'hot dog', 'big bus', 'wet hen', 'fat pig'],
            'long_vowels': ['blue sky', 'green tree', 'nice day', 'home base', 'cute face'],
            'blends': ['stop sign', 'flag pole', 'drop zone', 'swim fast', 'step up'],
            'digraphs': ['fish tank', 'ship sail', 'thick rope', 'phone call', 'shop cart']
        },
        'simple_sentences': {
            'short_vowels': ['The cat sat.', 'A big dog ran.', 'The sun is hot.'],
            'long_vowels': ['I like cake.', 'The tree is green.', 'We play games.'],
            'blends': ['Stop the car.', 'The flag is blue.', 'Frogs can jump.'],
            'digraphs': ['Ships sail fast.', 'I chat with mom.', 'Fish swim quick.']
        }
    }
    
    return fallbacks.get(challenge_level, {}).get(learning_focus, ['word1', 'word2', 'word3', 'word4', 'word5'])
@api_view(['POST'])
@permission_classes([AllowAny])
def save_game_session(request):
    """
    Save a complete game session to Supabase
    
    Expected payload:
    {
        "timestamp": "2024-01-01T12:00:00Z",
        "challengeLevel": "simple_words",
        "learningFocus": "short_vowels",
        "difficulty": "easy",
        "wordsAttempted": 10,
        "wordsRecognized": 8,
        "successRate": 80.0,
        "averageResponseTime": 2500.5,
        "maxStreak": 5,
        "timeSpent": 120000,
        "patternStats": {...},
        "wordList": [...],
        "words": [...],
        "recognized": [...],
        "responseTimes": [...],
        "teamPlay": false,
        "teamScores": null
    }
    """
    try:
        data = request.data
        user = request.user
        
        # Prepare session data for Supabase
        session_data = {
            'user_id': user.id if user.is_authenticated else None,
            'user_email': user.email if user.is_authenticated else None,
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'challenge_level': data.get('challengeLevel'),
            'learning_focus': data.get('learningFocus'),
            'difficulty': data.get('difficulty'),
            'words_attempted': data.get('wordsAttempted', 0),
            'words_recognized': data.get('wordsRecognized', 0),
            'success_rate': data.get('successRate', 0.0),
            'average_response_time': data.get('averageResponseTime', 0.0),
            'max_streak': data.get('maxStreak', 0),
            'time_spent': data.get('timeSpent', 0),
            'pattern_stats': data.get('patternStats', {}),
            'word_list': data.get('wordList', []),
            'team_play': data.get('teamPlay', False),
            'team_scores': data.get('teamScores'),
            'completion_rate': data.get('completionRate', 0.0),
            'words_per_minute': data.get('wordsPerMinute', 0.0),
            'learning_efficiency': data.get('learningEfficiency', 0.0)
        }
        
        # Insert into Supabase
        response = supabase.table('phonics_game_sessions').insert(session_data).execute()
        
        if response.data:
            logger.info(f"Game session saved for user: {user.email if user.is_authenticated else 'anonymous'}")
            
            # Save detailed word performance if provided
            if 'words' in data and 'recognized' in data:
                save_word_performance(
                    response.data[0]['session_id'],
                    user.email if user.is_authenticated else None,
                    data
                )
            
            return Response({
                'success': True,
                'message': 'Game session saved successfully',
                'session_id': str(response.data[0]['session_id'])
            })
        else:
            raise Exception("Failed to save session to Supabase")
    
    except Exception as e:
        logger.error(f"Error saving game session: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def save_word_performance(session_id, user_email, session_data):
    """Save individual word performance details"""
    try:
        words = session_data.get('words', [])
        recognized = session_data.get('recognized', [])
        response_times = session_data.get('responseTimes', [])
        word_list = session_data.get('wordList', [])
        
        word_records = []
        for i, word in enumerate(words):
            word_records.append({
                'session_id': session_id,
                'user_email': user_email,
                'word': word,
                'pattern': word_list[i].get('pattern') if i < len(word_list) else None,
                'difficulty': session_data.get('difficulty'),
                'recognized': recognized[i] if i < len(recognized) else False,
                'response_time': response_times[i] if i < len(response_times) else None,
                'attempt_number': i + 1
            })
        
        if word_records:
            supabase.table('phonics_word_performance').insert(word_records).execute()
            logger.info(f"Saved {len(word_records)} word performance records")
    
    except Exception as e:
        logger.error(f"Error saving word performance: {str(e)}")


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_analytics(request):
    """
    Get analytics for the current user
    
    Query params:
    - limit: number of sessions to return (default 10)
    - pattern: filter by specific pattern
    """
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'User must be authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        limit = int(request.GET.get('limit', 10))
        pattern = request.GET.get('pattern', None)
        
        # Get recent sessions
        sessions_query = supabase.table('phonics_game_sessions')\
            .select('*')\
            .eq('user_email', user.email)\
            .order('timestamp', desc=True)\
            .limit(limit)
        
        sessions_response = sessions_query.execute()
        
        # Get pattern performance
        patterns_query = supabase.table('phonics_pattern_performance')\
            .select('*')\
            .eq('user_email', user.email)\
            .order('success_rate', desc=True)
        
        if pattern:
            patterns_query = patterns_query.eq('pattern', pattern)
        
        patterns_response = patterns_query.execute()
        
        return Response({
            'success': True,
            'sessions': sessions_response.data,
            'patterns': patterns_response.data,
            'total_sessions': len(sessions_response.data)
        })
    
    except Exception as e:
        logger.error(f"Error fetching user analytics: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_pattern_performance(request):
    """Get aggregated pattern performance for a user"""
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'User must be authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        response = supabase.table('phonics_pattern_performance')\
            .select('*')\
            .eq('user_email', user.email)\
            .order('total_attempts', desc=True)\
            .execute()
        
        return Response({
            'success': True,
            'patterns': response.data
        })
    
    except Exception as e:
        logger.error(f"Error fetching pattern performance: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def log_game_result(request):
    """
    LEGACY ENDPOINT - Redirects to save_game_session
    Kept for backwards compatibility
    """
    return save_game_session(request)

def generate_static_fallback_words(challenge_level, learning_focus, word_count):
    """Generate fallback words when AI fails - EXPANDED with many more words"""
    
    logger.warning(f"Using static fallback words: {word_count} words needed")
    
    # MASSIVELY EXPANDED word sets for better educational variety
    word_sets = {
        'simple_words': {
            'short_vowels': [
                # Short A words
                {'word': 'cat', 'syllableBreakdown': 'cat', 'targetLetter': 'a', 'definition': 'A small furry pet that says meow', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'bat', 'syllableBreakdown': 'bat', 'targetLetter': 'a', 'definition': 'A flying mammal or sports equipment', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'hat', 'syllableBreakdown': 'hat', 'targetLetter': 'a', 'definition': 'Something you wear on your head', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'mat', 'syllableBreakdown': 'mat', 'targetLetter': 'a', 'definition': 'A small rug or floor covering', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'rat', 'syllableBreakdown': 'rat', 'targetLetter': 'a', 'definition': 'A small rodent with a long tail', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'sat', 'syllableBreakdown': 'sat', 'targetLetter': 'a', 'definition': 'Past tense of sit', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'bag', 'syllableBreakdown': 'bag', 'targetLetter': 'a', 'definition': 'Used to carry things', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'can', 'syllableBreakdown': 'can', 'targetLetter': 'a', 'definition': 'A metal container or to be able to', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'man', 'syllableBreakdown': 'man', 'targetLetter': 'a', 'definition': 'An adult male person', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'pan', 'syllableBreakdown': 'pan', 'targetLetter': 'a', 'definition': 'A cooking utensil', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'ran', 'syllableBreakdown': 'ran', 'targetLetter': 'a', 'definition': 'Past tense of run', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'tan', 'syllableBreakdown': 'tan', 'targetLetter': 'a', 'definition': 'A brown color from the sun', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'van', 'syllableBreakdown': 'van', 'targetLetter': 'a', 'definition': 'A large vehicle for carrying things', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'bad', 'syllableBreakdown': 'bad', 'targetLetter': 'a', 'definition': 'Not good or naughty', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'dad', 'syllableBreakdown': 'dad', 'targetLetter': 'a', 'definition': 'Another word for father', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'had', 'syllableBreakdown': 'had', 'targetLetter': 'a', 'definition': 'Past tense of have', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'mad', 'syllableBreakdown': 'mad', 'targetLetter': 'a', 'definition': 'Very angry or upset', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'pad', 'syllableBreakdown': 'pad', 'targetLetter': 'a', 'definition': 'A soft cushion or writing tablet', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                {'word': 'sad', 'syllableBreakdown': 'sad', 'targetLetter': 'a', 'definition': 'Feeling unhappy', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the /æ/ sound like in 'apple'"},
                
                # Short E words
                {'word': 'bed', 'syllableBreakdown': 'bed', 'targetLetter': 'e', 'definition': 'Where you sleep', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'red', 'syllableBreakdown': 'red', 'targetLetter': 'e', 'definition': 'A bright color like fire', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'pen', 'syllableBreakdown': 'pen', 'targetLetter': 'e', 'definition': 'Used for writing', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'hen', 'syllableBreakdown': 'hen', 'targetLetter': 'e', 'definition': 'A female chicken', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'ten', 'syllableBreakdown': 'ten', 'targetLetter': 'e', 'definition': 'The number after nine', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'men', 'syllableBreakdown': 'men', 'targetLetter': 'e', 'definition': 'More than one man', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'den', 'syllableBreakdown': 'den', 'targetLetter': 'e', 'definition': 'A cozy room or animal home', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'net', 'syllableBreakdown': 'net', 'targetLetter': 'e', 'definition': 'A mesh for catching things', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'pet', 'syllableBreakdown': 'pet', 'targetLetter': 'e', 'definition': 'A beloved animal companion', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'wet', 'syllableBreakdown': 'wet', 'targetLetter': 'e', 'definition': 'Covered with water', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'get', 'syllableBreakdown': 'get', 'targetLetter': 'e', 'definition': 'To obtain or fetch something', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'let', 'syllableBreakdown': 'let', 'targetLetter': 'e', 'definition': 'To allow or permit', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'met', 'syllableBreakdown': 'met', 'targetLetter': 'e', 'definition': 'Past tense of meet', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'set', 'syllableBreakdown': 'set', 'targetLetter': 'e', 'definition': 'To put in place', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                {'word': 'yes', 'syllableBreakdown': 'yes', 'targetLetter': 'e', 'definition': 'A word meaning I agree', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the /ɛ/ sound like in 'egg'"},
                
                # Short I words
                {'word': 'sit', 'syllableBreakdown': 'sit', 'targetLetter': 'i', 'definition': 'To rest on a chair', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'big', 'syllableBreakdown': 'big', 'targetLetter': 'i', 'definition': 'Very large', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'pig', 'syllableBreakdown': 'pig', 'targetLetter': 'i', 'definition': 'A farm animal that oinks', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'win', 'syllableBreakdown': 'win', 'targetLetter': 'i', 'definition': 'To be first in a game', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'six', 'syllableBreakdown': 'six', 'targetLetter': 'i', 'definition': 'The number after five', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'hit', 'syllableBreakdown': 'hit', 'targetLetter': 'i', 'definition': 'To strike something', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'fit', 'syllableBreakdown': 'fit', 'targetLetter': 'i', 'definition': 'To be the right size', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'bit', 'syllableBreakdown': 'bit', 'targetLetter': 'i', 'definition': 'A small piece of something', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'lit', 'syllableBreakdown': 'lit', 'targetLetter': 'i', 'definition': 'Past tense of light', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'kit', 'syllableBreakdown': 'kit', 'targetLetter': 'i', 'definition': 'A set of tools or supplies', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'dig', 'syllableBreakdown': 'dig', 'targetLetter': 'i', 'definition': 'To make a hole in the ground', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'fig', 'syllableBreakdown': 'fig', 'targetLetter': 'i', 'definition': 'A sweet purple fruit', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'wig', 'syllableBreakdown': 'wig', 'targetLetter': 'i', 'definition': 'Fake hair you wear', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'zip', 'syllableBreakdown': 'zip', 'targetLetter': 'i', 'definition': 'To close with a zipper', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                {'word': 'tip', 'syllableBreakdown': 'tip', 'targetLetter': 'i', 'definition': 'The end of something pointed', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the /ɪ/ sound like in 'igloo'"},
                
                # Short O words
                {'word': 'dog', 'syllableBreakdown': 'dog', 'targetLetter': 'o', 'definition': 'A friendly pet that barks', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'hot', 'syllableBreakdown': 'hot', 'targetLetter': 'o', 'definition': 'Very warm', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'box', 'syllableBreakdown': 'box', 'targetLetter': 'o', 'definition': 'A container for things', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'fox', 'syllableBreakdown': 'fox', 'targetLetter': 'o', 'definition': 'A clever wild animal with a bushy tail', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'pot', 'syllableBreakdown': 'pot', 'targetLetter': 'o', 'definition': 'A container for cooking', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'dot', 'syllableBreakdown': 'dot', 'targetLetter': 'o', 'definition': 'A small round spot', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'got', 'syllableBreakdown': 'got', 'targetLetter': 'o', 'definition': 'Past tense of get', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'lot', 'syllableBreakdown': 'lot', 'targetLetter': 'o', 'definition': 'A large amount or parking area', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'not', 'syllableBreakdown': 'not', 'targetLetter': 'o', 'definition': 'A word meaning no', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'top', 'syllableBreakdown': 'top', 'targetLetter': 'o', 'definition': 'The highest part', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'hop', 'syllableBreakdown': 'hop', 'targetLetter': 'o', 'definition': 'To jump on one foot', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'mop', 'syllableBreakdown': 'mop', 'targetLetter': 'o', 'definition': 'A tool for cleaning floors', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'pop', 'syllableBreakdown': 'pop', 'targetLetter': 'o', 'definition': 'To burst or a fizzy drink', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'cop', 'syllableBreakdown': 'cop', 'targetLetter': 'o', 'definition': 'A police officer', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'job', 'syllableBreakdown': 'job', 'targetLetter': 'o', 'definition': 'Work that someone does', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                {'word': 'log', 'syllableBreakdown': 'log', 'targetLetter': 'o', 'definition': 'A piece of wood from a tree', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the /ɔ/ sound like in 'octopus'"},
                
                # Short U words
                {'word': 'sun', 'syllableBreakdown': 'sun', 'targetLetter': 'u', 'definition': 'A bright star in the sky', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'run', 'syllableBreakdown': 'run', 'targetLetter': 'u', 'definition': 'To move fast on foot', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'cup', 'syllableBreakdown': 'cup', 'targetLetter': 'u', 'definition': 'Used for drinking', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'bug', 'syllableBreakdown': 'bug', 'targetLetter': 'u', 'definition': 'A small insect', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'hug', 'syllableBreakdown': 'hug', 'targetLetter': 'u', 'definition': 'To squeeze someone with your arms', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'mug', 'syllableBreakdown': 'mug', 'targetLetter': 'u', 'definition': 'A large cup with a handle', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'rug', 'syllableBreakdown': 'rug', 'targetLetter': 'u', 'definition': 'A soft floor covering', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'cut', 'syllableBreakdown': 'cut', 'targetLetter': 'u', 'definition': 'To slice with scissors or knife', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'but', 'syllableBreakdown': 'but', 'targetLetter': 'u', 'definition': 'A word meaning however', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'hut', 'syllableBreakdown': 'hut', 'targetLetter': 'u', 'definition': 'A small simple house', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'nut', 'syllableBreakdown': 'nut', 'targetLetter': 'u', 'definition': 'A hard shell fruit', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'fun', 'syllableBreakdown': 'fun', 'targetLetter': 'u', 'definition': 'Something enjoyable', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'gun', 'syllableBreakdown': 'gun', 'targetLetter': 'u', 'definition': 'A tool that shoots', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'bun', 'syllableBreakdown': 'bun', 'targetLetter': 'u', 'definition': 'A small round bread', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
                {'word': 'dug', 'syllableBreakdown': 'dug', 'targetLetter': 'u', 'definition': 'Past tense of dig', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the /ʌ/ sound like in 'umbrella'"},
            ],
            
            'long_vowels': [
                # Long A words (a_e pattern)
                {'word': 'cake', 'syllableBreakdown': 'cake', 'targetLetter': 'a_e', 'definition': 'A sweet dessert for celebrations', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'make', 'syllableBreakdown': 'make', 'targetLetter': 'a_e', 'definition': 'To create something', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'take', 'syllableBreakdown': 'take', 'targetLetter': 'a_e', 'definition': 'To pick up and carry', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'game', 'syllableBreakdown': 'game', 'targetLetter': 'a_e', 'definition': 'Something fun to play', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'name', 'syllableBreakdown': 'name', 'targetLetter': 'a_e', 'definition': 'What you are called', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'same', 'syllableBreakdown': 'same', 'targetLetter': 'a_e', 'definition': 'Exactly alike', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'came', 'syllableBreakdown': 'came', 'targetLetter': 'a_e', 'definition': 'Past tense of come', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'lane', 'syllableBreakdown': 'lane', 'targetLetter': 'a_e', 'definition': 'A narrow road or path', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'mane', 'syllableBreakdown': 'mane', 'targetLetter': 'a_e', 'definition': 'Long hair on a horse neck', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'cane', 'syllableBreakdown': 'cane', 'targetLetter': 'a_e', 'definition': 'A walking stick', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'tape', 'syllableBreakdown': 'tape', 'targetLetter': 'a_e', 'definition': 'Sticky material for joining', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'cape', 'syllableBreakdown': 'cape', 'targetLetter': 'a_e', 'definition': 'A sleeveless cloak', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'gate', 'syllableBreakdown': 'gate', 'targetLetter': 'a_e', 'definition': 'A door in a fence', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'late', 'syllableBreakdown': 'late', 'targetLetter': 'a_e', 'definition': 'After the expected time', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'face', 'syllableBreakdown': 'face', 'targetLetter': 'a_e', 'definition': 'The front of your head', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                {'word': 'race', 'syllableBreakdown': 'race', 'targetLetter': 'a_e', 'definition': 'A contest of speed', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a' with silent e makes the /eɪ/ sound"},
                
                # Long I words (i_e pattern)
                {'word': 'bike', 'syllableBreakdown': 'bike', 'targetLetter': 'i_e', 'definition': 'Two-wheeled vehicle you pedal', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'kite', 'syllableBreakdown': 'kite', 'targetLetter': 'i_e', 'definition': 'Flies high in the sky', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'time', 'syllableBreakdown': 'time', 'targetLetter': 'i_e', 'definition': 'Hours and minutes', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'like', 'syllableBreakdown': 'like', 'targetLetter': 'i_e', 'definition': 'To enjoy something', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'nice', 'syllableBreakdown': 'nice', 'targetLetter': 'i_e', 'definition': 'Pleasant and kind', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'rice', 'syllableBreakdown': 'rice', 'targetLetter': 'i_e', 'definition': 'A grain that we eat', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'mice', 'syllableBreakdown': 'mice', 'targetLetter': 'i_e', 'definition': 'More than one mouse', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'dive', 'syllableBreakdown': 'dive', 'targetLetter': 'i_e', 'definition': 'To jump into water', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'hive', 'syllableBreakdown': 'hive', 'targetLetter': 'i_e', 'definition': 'Where bees live', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'five', 'syllableBreakdown': 'five', 'targetLetter': 'i_e', 'definition': 'The number after four', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'nine', 'syllableBreakdown': 'nine', 'targetLetter': 'i_e', 'definition': 'The number before ten', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'line', 'syllableBreakdown': 'line', 'targetLetter': 'i_e', 'definition': 'A straight mark', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'mine', 'syllableBreakdown': 'mine', 'targetLetter': 'i_e', 'definition': 'Belongs to me', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'wine', 'syllableBreakdown': 'wine', 'targetLetter': 'i_e', 'definition': 'A drink made from grapes', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                {'word': 'hide', 'syllableBreakdown': 'hide', 'targetLetter': 'i_e', 'definition': 'To go where no one can see', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i' with silent e makes the /aɪ/ sound"},
                
                # Long O words (o_e pattern)
                {'word': 'home', 'syllableBreakdown': 'home', 'targetLetter': 'o_e', 'definition': 'Where you live', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'bone', 'syllableBreakdown': 'bone', 'targetLetter': 'o_e', 'definition': 'Hard part inside your body', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'hope', 'syllableBreakdown': 'hope', 'targetLetter': 'o_e', 'definition': 'To wish for something', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'note', 'syllableBreakdown': 'note', 'targetLetter': 'o_e', 'definition': 'A short message', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'rope', 'syllableBreakdown': 'rope', 'targetLetter': 'o_e', 'definition': 'Thick string for climbing', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'code', 'syllableBreakdown': 'code', 'targetLetter': 'o_e', 'definition': 'A secret way of writing', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'rode', 'syllableBreakdown': 'rode', 'targetLetter': 'o_e', 'definition': 'Past tense of ride', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'nose', 'syllableBreakdown': 'nose', 'targetLetter': 'o_e', 'definition': 'Body part used for smelling', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'rose', 'syllableBreakdown': 'rose', 'targetLetter': 'o_e', 'definition': 'A beautiful flower', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'hose', 'syllableBreakdown': 'hose', 'targetLetter': 'o_e', 'definition': 'A tube for water', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'more', 'syllableBreakdown': 'more', 'targetLetter': 'o_e', 'definition': 'A greater amount', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'core', 'syllableBreakdown': 'core', 'targetLetter': 'o_e', 'definition': 'The center of something', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'hole', 'syllableBreakdown': 'hole', 'targetLetter': 'o_e', 'definition': 'An opening or empty space', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'mole', 'syllableBreakdown': 'mole', 'targetLetter': 'o_e', 'definition': 'A small animal that digs', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                {'word': 'poke', 'syllableBreakdown': 'poke', 'targetLetter': 'o_e', 'definition': 'To push with your finger', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o' with silent e makes the /oʊ/ sound"},
                
                # Long U words (u_e pattern)
                {'word': 'cute', 'syllableBreakdown': 'cute', 'targetLetter': 'u_e', 'definition': 'Very pretty or adorable', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'tune', 'syllableBreakdown': 'tune', 'targetLetter': 'u_e', 'definition': 'A song or melody', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'huge', 'syllableBreakdown': 'huge', 'targetLetter': 'u_e', 'definition': 'Very, very big', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'cube', 'syllableBreakdown': 'cube', 'targetLetter': 'u_e', 'definition': 'A shape with six square sides', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'tube', 'syllableBreakdown': 'tube', 'targetLetter': 'u_e', 'definition': 'A hollow cylinder', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'mute', 'syllableBreakdown': 'mute', 'targetLetter': 'u_e', 'definition': 'Silent or unable to speak', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'fuse', 'syllableBreakdown': 'fuse', 'targetLetter': 'u_e', 'definition': 'Safety device for electricity', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'rude', 'syllableBreakdown': 'rude', 'targetLetter': 'u_e', 'definition': 'Not polite or kind', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'dude', 'syllableBreakdown': 'dude', 'targetLetter': 'u_e', 'definition': 'A casual word for a person', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
                {'word': 'flute', 'syllableBreakdown': 'flute', 'targetLetter': 'u_e', 'definition': 'A musical instrument you blow', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u' with silent e makes the /juː/ sound"},
            ],
            
            'blends': [
                # Beginning blends with 'bl'
                {'word': 'blue', 'syllableBreakdown': 'blue', 'targetLetter': 'bl', 'definition': 'Color of the sky', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines /b/ and /l/ sounds"},
                {'word': 'black', 'syllableBreakdown': 'black', 'targetLetter': 'bl', 'definition': 'The darkest color', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines /b/ and /l/ sounds"},
                {'word': 'blow', 'syllableBreakdown': 'blow', 'targetLetter': 'bl', 'definition': 'To push air out', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines /b/ and /l/ sounds"},
                {'word': 'block', 'syllableBreakdown': 'block', 'targetLetter': 'bl', 'definition': 'A solid piece or to stop', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines /b/ and /l/ sounds"},
                {'word': 'blank', 'syllableBreakdown': 'blank', 'targetLetter': 'bl', 'definition': 'Empty or with nothing on it', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines /b/ and /l/ sounds"},
                
                # Beginning blends with 'cl'
                {'word': 'clap', 'syllableBreakdown': 'clap', 'targetLetter': 'cl', 'definition': 'To hit hands together', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines /k/ and /l/ sounds"},
                {'word': 'class', 'syllableBreakdown': 'class', 'targetLetter': 'cl', 'definition': 'A group of students', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines /k/ and /l/ sounds"},
                {'word': 'clean', 'syllableBreakdown': 'clean', 'targetLetter': 'cl', 'definition': 'Not dirty', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines /k/ and /l/ sounds"},
                {'word': 'climb', 'syllableBreakdown': 'climb', 'targetLetter': 'cl', 'definition': 'To go up using hands and feet', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines /k/ and /l/ sounds"},
                {'word': 'close', 'syllableBreakdown': 'close', 'targetLetter': 'cl', 'definition': 'To shut something', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines /k/ and /l/ sounds"},
                
                # Beginning blends with 'fl'
                {'word': 'flag', 'syllableBreakdown': 'flag', 'targetLetter': 'fl', 'definition': 'Symbol of a country', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines /f/ and /l/ sounds"},
                {'word': 'fly', 'syllableBreakdown': 'fly', 'targetLetter': 'fl', 'definition': 'To move through the air', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines /f/ and /l/ sounds"},
                {'word': 'flower', 'syllableBreakdown': 'flow-er', 'targetLetter': 'fl', 'definition': 'A pretty part of a plant', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines /f/ and /l/ sounds"},
                {'word': 'floor', 'syllableBreakdown': 'floor', 'targetLetter': 'fl', 'definition': 'What you walk on indoors', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines /f/ and /l/ sounds"},
                {'word': 'flat', 'syllableBreakdown': 'flat', 'targetLetter': 'fl', 'definition': 'Not bumpy or curved', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines /f/ and /l/ sounds"},
                
                # Beginning blends with 'fr'
                {'word': 'frog', 'syllableBreakdown': 'frog', 'targetLetter': 'fr', 'definition': 'Green animal that jumps', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines /f/ and /r/ sounds"},
                {'word': 'free', 'syllableBreakdown': 'free', 'targetLetter': 'fr', 'definition': 'Not trapped or costs nothing', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines /f/ and /r/ sounds"},
                {'word': 'from', 'syllableBreakdown': 'from', 'targetLetter': 'fr', 'definition': 'Starting at a place', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines /f/ and /r/ sounds"},
                {'word': 'fruit', 'syllableBreakdown': 'fruit', 'targetLetter': 'fr', 'definition': 'Sweet food that grows on plants', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines /f/ and /r/ sounds"},
                {'word': 'fresh', 'syllableBreakdown': 'fresh', 'targetLetter': 'fr', 'definition': 'New or not old', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines /f/ and /r/ sounds"},
                
                # Beginning blends with 'gr'
                {'word': 'grab', 'syllableBreakdown': 'grab', 'targetLetter': 'gr', 'definition': 'To take quickly', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines /g/ and /r/ sounds"},
                {'word': 'green', 'syllableBreakdown': 'green', 'targetLetter': 'gr', 'definition': 'Color of grass', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines /g/ and /r/ sounds"},
                {'word': 'grow', 'syllableBreakdown': 'grow', 'targetLetter': 'gr', 'definition': 'To get bigger', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines /g/ and /r/ sounds"},
                {'word': 'great', 'syllableBreakdown': 'great', 'targetLetter': 'gr', 'definition': 'Very good or large', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines /g/ and /r/ sounds"},
                {'word': 'grass', 'syllableBreakdown': 'grass', 'targetLetter': 'gr', 'definition': 'Green plants in yards', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines /g/ and /r/ sounds"},
                
                # Beginning blends with 'pl'
                {'word': 'plan', 'syllableBreakdown': 'plan', 'targetLetter': 'pl', 'definition': 'To think ahead', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines /p/ and /l/ sounds"},
                {'word': 'play', 'syllableBreakdown': 'play', 'targetLetter': 'pl', 'definition': 'To have fun with games', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines /p/ and /l/ sounds"},
                {'word': 'plant', 'syllableBreakdown': 'plant', 'targetLetter': 'pl', 'definition': 'A living green thing that grows', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines /p/ and /l/ sounds"},
                {'word': 'place', 'syllableBreakdown': 'place', 'targetLetter': 'pl', 'definition': 'A location or spot', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines /p/ and /l/ sounds"},
                {'word': 'plate', 'syllableBreakdown': 'plate', 'targetLetter': 'pl', 'definition': 'A dish for food', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines /p/ and /l/ sounds"},
                
                # Beginning blends with 'sl'
                {'word': 'slip', 'syllableBreakdown': 'slip', 'targetLetter': 'sl', 'definition': 'To slide accidentally', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines /s/ and /l/ sounds"},
                {'word': 'slow', 'syllableBreakdown': 'slow', 'targetLetter': 'sl', 'definition': 'Not fast', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines /s/ and /l/ sounds"},
                {'word': 'sleep', 'syllableBreakdown': 'sleep', 'targetLetter': 'sl', 'definition': 'To rest with eyes closed', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines /s/ and /l/ sounds"},
                {'word': 'slide', 'syllableBreakdown': 'slide', 'targetLetter': 'sl', 'definition': 'To move smoothly', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines /s/ and /l/ sounds"},
                {'word': 'slam', 'syllableBreakdown': 'slam', 'targetLetter': 'sl', 'definition': 'To close hard and loud', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines /s/ and /l/ sounds"},
                
                # Beginning blends with 'st'
                {'word': 'stop', 'syllableBreakdown': 'stop', 'targetLetter': 'st', 'definition': 'To quit moving', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines /s/ and /t/ sounds"},
                {'word': 'star', 'syllableBreakdown': 'star', 'targetLetter': 'st', 'definition': 'A bright light in the night sky', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines /s/ and /t/ sounds"},
                {'word': 'step', 'syllableBreakdown': 'step', 'targetLetter': 'st', 'definition': 'To move your foot', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines /s/ and /t/ sounds"},
                {'word': 'stay', 'syllableBreakdown': 'stay', 'targetLetter': 'st', 'definition': 'To remain in place', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines /s/ and /t/ sounds"},
                {'word': 'stick', 'syllableBreakdown': 'stick', 'targetLetter': 'st', 'definition': 'A thin piece of wood', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines /s/ and /t/ sounds"},
                
                # Beginning blends with 'tr'
                {'word': 'tree', 'syllableBreakdown': 'tree', 'targetLetter': 'tr', 'definition': 'Tall plant with leaves', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines /t/ and /r/ sounds"},
                {'word': 'trip', 'syllableBreakdown': 'trip', 'targetLetter': 'tr', 'definition': 'A journey somewhere', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines /t/ and /r/ sounds"},
                {'word': 'train', 'syllableBreakdown': 'train', 'targetLetter': 'tr', 'definition': 'Vehicle that runs on tracks', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines /t/ and /r/ sounds"},
                {'word': 'truck', 'syllableBreakdown': 'truck', 'targetLetter': 'tr', 'definition': 'Large vehicle for carrying things', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines /t/ and /r/ sounds"},
                {'word': 'true', 'syllableBreakdown': 'true', 'targetLetter': 'tr', 'definition': 'Real and correct', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines /t/ and /r/ sounds"},
            ],
            
            'digraphs': [
                # SH digraph words
                {'word': 'ship', 'syllableBreakdown': 'ship', 'targetLetter': 'sh', 'definition': 'A large boat', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'shop', 'syllableBreakdown': 'shop', 'targetLetter': 'sh', 'definition': 'A store where you buy things', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'shut', 'syllableBreakdown': 'shut', 'targetLetter': 'sh', 'definition': 'To close something', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'shoe', 'syllableBreakdown': 'shoe', 'targetLetter': 'sh', 'definition': 'What you wear on your feet', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'shark', 'syllableBreakdown': 'shark', 'targetLetter': 'sh', 'definition': 'A large ocean fish with sharp teeth', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'shell', 'syllableBreakdown': 'shell', 'targetLetter': 'sh', 'definition': 'Hard covering of sea creatures', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'shade', 'syllableBreakdown': 'shade', 'targetLetter': 'sh', 'definition': 'Cool area away from sun', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'fish', 'syllableBreakdown': 'fish', 'targetLetter': 'sh', 'definition': 'An animal that swims', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'wish', 'syllableBreakdown': 'wish', 'targetLetter': 'sh', 'definition': 'To hope for something', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                {'word': 'dish', 'syllableBreakdown': 'dish', 'targetLetter': 'sh', 'definition': 'A plate or bowl', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one /ʃ/ sound like 'shh'"},
                
                # CH digraph words  
                {'word': 'chair', 'syllableBreakdown': 'chair', 'targetLetter': 'ch', 'definition': 'Furniture for sitting', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'chip', 'syllableBreakdown': 'chip', 'targetLetter': 'ch', 'definition': 'A crispy snack', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'chat', 'syllableBreakdown': 'chat', 'targetLetter': 'ch', 'definition': 'To talk with friends', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'chin', 'syllableBreakdown': 'chin', 'targetLetter': 'ch', 'definition': 'Bottom part of your face', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'check', 'syllableBreakdown': 'check', 'targetLetter': 'ch', 'definition': 'To look at something carefully', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'cheese', 'syllableBreakdown': 'cheese', 'targetLetter': 'ch', 'definition': 'Yellow food made from milk', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'much', 'syllableBreakdown': 'much', 'targetLetter': 'ch', 'definition': 'A large amount', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'such', 'syllableBreakdown': 'such', 'targetLetter': 'ch', 'definition': 'Of that kind', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'lunch', 'syllableBreakdown': 'lunch', 'targetLetter': 'ch', 'definition': 'Meal in the middle of day', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                {'word': 'rich', 'syllableBreakdown': 'rich', 'targetLetter': 'ch', 'definition': 'Having lots of money', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one /tʃ/ sound like 'choo-choo'"},
                
                # TH digraph words
                {'word': 'this', 'syllableBreakdown': 'this', 'targetLetter': 'th', 'definition': 'The thing here', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'that', 'syllableBreakdown': 'that', 'targetLetter': 'th', 'definition': 'The thing over there', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'them', 'syllableBreakdown': 'them', 'targetLetter': 'th', 'definition': 'Those people', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'thin', 'syllableBreakdown': 'thin', 'targetLetter': 'th', 'definition': 'Not thick', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'thick', 'syllableBreakdown': 'thick', 'targetLetter': 'th', 'definition': 'Not thin', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'think', 'syllableBreakdown': 'think', 'targetLetter': 'th', 'definition': 'To use your mind', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'bath', 'syllableBreakdown': 'bath', 'targetLetter': 'th', 'definition': 'Washing in a tub', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'math', 'syllableBreakdown': 'math', 'targetLetter': 'th', 'definition': 'Subject with numbers', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'with', 'syllableBreakdown': 'with', 'targetLetter': 'th', 'definition': 'Together or alongside', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                {'word': 'path', 'syllableBreakdown': 'path', 'targetLetter': 'th', 'definition': 'A walkway', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one /θ/ or /ð/ sound with tongue between teeth"},
                
                # WH digraph words
                {'word': 'when', 'syllableBreakdown': 'when', 'targetLetter': 'wh', 'definition': 'At what time', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'where', 'syllableBreakdown': 'where', 'targetLetter': 'wh', 'definition': 'At what place', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'what', 'syllableBreakdown': 'what', 'targetLetter': 'wh', 'definition': 'Which thing', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'why', 'syllableBreakdown': 'why', 'targetLetter': 'wh', 'definition': 'For what reason', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'who', 'syllableBreakdown': 'who', 'targetLetter': 'wh', 'definition': 'Which person', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'white', 'syllableBreakdown': 'white', 'targetLetter': 'wh', 'definition': 'The lightest color', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'whale', 'syllableBreakdown': 'whale', 'targetLetter': 'wh', 'definition': 'Largest animal in the ocean', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'wheel', 'syllableBreakdown': 'wheel', 'targetLetter': 'wh', 'definition': 'Round thing that rolls', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'which', 'syllableBreakdown': 'which', 'targetLetter': 'wh', 'definition': 'What one', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
                {'word': 'whisper', 'syllableBreakdown': 'whis-per', 'targetLetter': 'wh', 'definition': 'To speak very quietly', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes one /hw/ sound like blowing air"},
            ]
        },
        
        'compound_words': {
            'short_vowels': [
                {'word': 'sunset', 'syllableBreakdown': 'sun-set', 'targetLetter': 'compound', 'definition': 'When the sun goes down', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'hotdog', 'syllableBreakdown': 'hot-dog', 'targetLetter': 'compound', 'definition': 'A sausage in a bun', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'catfish', 'syllableBreakdown': 'cat-fish', 'targetLetter': 'compound', 'definition': 'A type of fish with whiskers', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'pigpen', 'syllableBreakdown': 'pig-pen', 'targetLetter': 'compound', 'definition': 'Where pigs live', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'bedtime', 'syllableBreakdown': 'bed-time', 'targetLetter': 'compound', 'definition': 'Time to go to sleep', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'backpack', 'syllableBreakdown': 'back-pack', 'targetLetter': 'compound', 'definition': 'Bag worn on your back', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'cupcake', 'syllableBreakdown': 'cup-cake', 'targetLetter': 'compound', 'definition': 'Small sweet cake', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'doghouse', 'syllableBreakdown': 'dog-house', 'targetLetter': 'compound', 'definition': 'A house for a dog', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'sunhat', 'syllableBreakdown': 'sun-hat', 'targetLetter': 'compound', 'definition': 'Hat to protect from sun', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'sandbox', 'syllableBreakdown': 'sand-box', 'targetLetter': 'compound', 'definition': 'Box filled with sand for play', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'hotpot', 'syllableBreakdown': 'hot-pot', 'targetLetter': 'compound', 'definition': 'A cooking pot that stays hot', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'bathtub', 'syllableBreakdown': 'bath-tub', 'targetLetter': 'compound', 'definition': 'Tub for taking a bath', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'anthill', 'syllableBreakdown': 'ant-hill', 'targetLetter': 'compound', 'definition': 'Small hill made by ants', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'madman', 'syllableBreakdown': 'mad-man', 'targetLetter': 'compound', 'definition': 'A very angry person', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'redcap', 'syllableBreakdown': 'red-cap', 'targetLetter': 'compound', 'definition': 'A cap that is red', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
            ],
            'long_vowels': [
                {'word': 'rainbow', 'syllableBreakdown': 'rain-bow', 'targetLetter': 'compound', 'definition': 'Colors in the sky after rain', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'sunshine', 'syllableBreakdown': 'sun-shine', 'targetLetter': 'compound', 'definition': 'Bright light from the sun', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'moonlight', 'syllableBreakdown': 'moon-light', 'targetLetter': 'compound', 'definition': 'Light from the moon', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'snowflake', 'syllableBreakdown': 'snow-flake', 'targetLetter': 'compound', 'definition': 'A single piece of snow', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'seashell', 'syllableBreakdown': 'sea-shell', 'targetLetter': 'compound', 'definition': 'Shell found by the ocean', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'birdhouse', 'syllableBreakdown': 'bird-house', 'targetLetter': 'compound', 'definition': 'Small house for birds', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'homemade', 'syllableBreakdown': 'home-made', 'targetLetter': 'compound', 'definition': 'Made at home', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'playtime', 'syllableBreakdown': 'play-time', 'targetLetter': 'compound', 'definition': 'Time to play and have fun', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'daytime', 'syllableBreakdown': 'day-time', 'targetLetter': 'compound', 'definition': 'When the sun is up', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'mealtime', 'syllableBreakdown': 'meal-time', 'targetLetter': 'compound', 'definition': 'Time to eat food', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'lifetime', 'syllableBreakdown': 'life-time', 'targetLetter': 'compound', 'definition': 'All the time you live', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'peaceful', 'syllableBreakdown': 'peace-ful', 'targetLetter': 'compound', 'definition': 'Full of peace and calm', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'hopeful', 'syllableBreakdown': 'hope-ful', 'targetLetter': 'compound', 'definition': 'Full of hope', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
                {'word': 'graceful', 'syllableBreakdown': 'grace-ful', 'targetLetter': 'compound', 'definition': 'Moving with grace', 'pattern': 'compound_word', 'patternPosition': 'whole', 'phonicsRule': 'Two words joined together make a compound word'},
            ]
        },
        
        'phrases': {
            'short_vowels': [
                {'word': 'big red hat', 'syllableBreakdown': 'big red hat', 'targetLetter': 'phrase', 'definition': 'A large hat that is red', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'hot cup', 'syllableBreakdown': 'hot cup', 'targetLetter': 'phrase', 'definition': 'A warm cup for drinks', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'run fast', 'syllableBreakdown': 'run fast', 'targetLetter': 'phrase', 'definition': 'To move very quickly', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'sit down', 'syllableBreakdown': 'sit down', 'targetLetter': 'phrase', 'definition': 'To take a seat', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'big dog', 'syllableBreakdown': 'big dog', 'targetLetter': 'phrase', 'definition': 'A large pet dog', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'bad cat', 'syllableBreakdown': 'bad cat', 'targetLetter': 'phrase', 'definition': 'A naughty cat', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'red box', 'syllableBreakdown': 'red box', 'targetLetter': 'phrase', 'definition': 'A box that is red', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'fat pig', 'syllableBreakdown': 'fat pig', 'targetLetter': 'phrase', 'definition': 'A chubby pig', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'wet pen', 'syllableBreakdown': 'wet pen', 'targetLetter': 'phrase', 'definition': 'A pen covered with water', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'hot sun', 'syllableBreakdown': 'hot sun', 'targetLetter': 'phrase', 'definition': 'The warm star in the sky', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'big bat', 'syllableBreakdown': 'big bat', 'targetLetter': 'phrase', 'definition': 'A large flying animal', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'sad man', 'syllableBreakdown': 'sad man', 'targetLetter': 'phrase', 'definition': 'A man who feels unhappy', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'cut up', 'syllableBreakdown': 'cut up', 'targetLetter': 'phrase', 'definition': 'To slice into pieces', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'get up', 'syllableBreakdown': 'get up', 'targetLetter': 'phrase', 'definition': 'To rise from bed', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'hop up', 'syllableBreakdown': 'hop up', 'targetLetter': 'phrase', 'definition': 'To jump upward', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
            ],
            'long_vowels': [
                {'word': 'nice game', 'syllableBreakdown': 'nice game', 'targetLetter': 'phrase', 'definition': 'A fun and enjoyable game', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'take time', 'syllableBreakdown': 'take time', 'targetLetter': 'phrase', 'definition': 'To not rush', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'make cake', 'syllableBreakdown': 'make cake', 'targetLetter': 'phrase', 'definition': 'To bake a sweet dessert', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'ride bike', 'syllableBreakdown': 'ride bike', 'targetLetter': 'phrase', 'definition': 'To travel on a bicycle', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'blue kite', 'syllableBreakdown': 'blue kite', 'targetLetter': 'phrase', 'definition': 'A kite that is blue', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'white bike', 'syllableBreakdown': 'white bike', 'targetLetter': 'phrase', 'definition': 'A bicycle that is white', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'home made', 'syllableBreakdown': 'home made', 'targetLetter': 'phrase', 'definition': 'Created at home', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'nice time', 'syllableBreakdown': 'nice time', 'targetLetter': 'phrase', 'definition': 'A pleasant period', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'huge cake', 'syllableBreakdown': 'huge cake', 'targetLetter': 'phrase', 'definition': 'A very large cake', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'cute face', 'syllableBreakdown': 'cute face', 'targetLetter': 'phrase', 'definition': 'An adorable face', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'like home', 'syllableBreakdown': 'like home', 'targetLetter': 'phrase', 'definition': 'Similar to where you live', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'take note', 'syllableBreakdown': 'take note', 'targetLetter': 'phrase', 'definition': 'To write something down', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'make hope', 'syllableBreakdown': 'make hope', 'targetLetter': 'phrase', 'definition': 'To create optimism', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'late game', 'syllableBreakdown': 'late game', 'targetLetter': 'phrase', 'definition': 'A game that starts after time', 'pattern': 'descriptive_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
                {'word': 'save time', 'syllableBreakdown': 'save time', 'targetLetter': 'phrase', 'definition': 'To not waste time', 'pattern': 'action_phrase', 'patternPosition': 'whole', 'phonicsRule': 'A phrase describes something with multiple words'},
            ]
        },
        
        'simple_sentences': {
            'short_vowels': [
                {'word': 'The cat ran.', 'syllableBreakdown': 'The cat ran', 'targetLetter': 'sentence', 'definition': 'A sentence about a cat moving fast', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I see a dog.', 'syllableBreakdown': 'I see a dog', 'targetLetter': 'sentence', 'definition': 'A sentence about looking at a pet', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The sun is hot.', 'syllableBreakdown': 'The sun is hot', 'targetLetter': 'sentence', 'definition': 'A sentence about warm weather', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'A big red hat.', 'syllableBreakdown': 'A big red hat', 'targetLetter': 'sentence', 'definition': 'A sentence about a large colored hat', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The pig is fat.', 'syllableBreakdown': 'The pig is fat', 'targetLetter': 'sentence', 'definition': 'A sentence about a chubby pig', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I can run fast.', 'syllableBreakdown': 'I can run fast', 'targetLetter': 'sentence', 'definition': 'A sentence about running quickly', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The box is big.', 'syllableBreakdown': 'The box is big', 'targetLetter': 'sentence', 'definition': 'A sentence about a large container', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'My pen is red.', 'syllableBreakdown': 'My pen is red', 'targetLetter': 'sentence', 'definition': 'A sentence about a colored writing tool', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The bed is soft.', 'syllableBreakdown': 'The bed is soft', 'targetLetter': 'sentence', 'definition': 'A sentence about comfortable sleeping', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I sit on top.', 'syllableBreakdown': 'I sit on top', 'targetLetter': 'sentence', 'definition': 'A sentence about sitting up high', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The cup is hot.', 'syllableBreakdown': 'The cup is hot', 'targetLetter': 'sentence', 'definition': 'A sentence about a warm drinking vessel', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'A bug can hop.', 'syllableBreakdown': 'A bug can hop', 'targetLetter': 'sentence', 'definition': 'A sentence about an insect jumping', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The man is sad.', 'syllableBreakdown': 'The man is sad', 'targetLetter': 'sentence', 'definition': 'A sentence about someone feeling down', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I had a bat.', 'syllableBreakdown': 'I had a bat', 'targetLetter': 'sentence', 'definition': 'A sentence about owning sports equipment', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The log got wet.', 'syllableBreakdown': 'The log got wet', 'targetLetter': 'sentence', 'definition': 'A sentence about wood getting soaked', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
            ],
            'long_vowels': [
                {'word': 'I like cake.', 'syllableBreakdown': 'I like cake', 'targetLetter': 'sentence', 'definition': 'A sentence about enjoying dessert', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The bike is blue.', 'syllableBreakdown': 'The bike is blue', 'targetLetter': 'sentence', 'definition': 'A sentence about a colored bicycle', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'We play games.', 'syllableBreakdown': 'We play games', 'targetLetter': 'sentence', 'definition': 'A sentence about having fun together', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I am going home.', 'syllableBreakdown': 'I am going home', 'targetLetter': 'sentence', 'definition': 'A sentence about traveling to where you live', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The kite can fly.', 'syllableBreakdown': 'The kite can fly', 'targetLetter': 'sentence', 'definition': 'A sentence about a toy soaring', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'It is time to go.', 'syllableBreakdown': 'It is time to go', 'targetLetter': 'sentence', 'definition': 'A sentence about when to leave', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'My face is cute.', 'syllableBreakdown': 'My face is cute', 'targetLetter': 'sentence', 'definition': 'A sentence about looking adorable', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The tune is nice.', 'syllableBreakdown': 'The tune is nice', 'targetLetter': 'sentence', 'definition': 'A sentence about a pleasant song', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I hope it rains.', 'syllableBreakdown': 'I hope it rains', 'targetLetter': 'sentence', 'definition': 'A sentence about wishing for weather', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The cake is huge.', 'syllableBreakdown': 'The cake is huge', 'targetLetter': 'sentence', 'definition': 'A sentence about a very large dessert', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I can make rice.', 'syllableBreakdown': 'I can make rice', 'targetLetter': 'sentence', 'definition': 'A sentence about cooking grain', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The bone is white.', 'syllableBreakdown': 'The bone is white', 'targetLetter': 'sentence', 'definition': 'A sentence about a pale body part', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'We came at nine.', 'syllableBreakdown': 'We came at nine', 'targetLetter': 'sentence', 'definition': 'A sentence about arrival time', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'I like to dive.', 'syllableBreakdown': 'I like to dive', 'targetLetter': 'sentence', 'definition': 'A sentence about enjoying jumping in water', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
                {'word': 'The rose is pretty.', 'syllableBreakdown': 'The rose is pretty', 'targetLetter': 'sentence', 'definition': 'A sentence about a beautiful flower', 'pattern': 'simple_sentence', 'patternPosition': 'whole', 'phonicsRule': 'A sentence expresses a complete thought'},
            ]
        }
    }
    
    # Get appropriate word set (same logic as before)
    challenge_set = word_sets.get(challenge_level, word_sets['simple_words'])
    focus_set = challenge_set.get(learning_focus, challenge_set.get('short_vowels', []))
    
    if not focus_set:
        focus_set = word_sets['simple_words']['short_vowels']
    
    # Shuffle and select
    available_words = focus_set.copy()
    random.shuffle(available_words)
    
    selected_words = []
    for i in range(word_count):
        selected_words.append(available_words[i % len(available_words)])
    
    logger.info(f"Generated {len(selected_words)} fallback words from expanded sets")
    return selected_words