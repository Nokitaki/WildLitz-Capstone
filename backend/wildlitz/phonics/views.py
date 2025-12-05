from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import random
import re
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

def fix_long_vowel_target_letter(word_object, challenge_level, learning_focus):
    """
    CRITICAL FIX: Validates targetLetter pattern actually exists in sentence.
    Only applies to simple_sentences + long_vowels.
    """
    if challenge_level != 'simple_sentences' or learning_focus != 'long_vowels':
        return word_object
    
    sentence = word_object.get('word', '')
    current_target = word_object.get('targetLetter', '')
    
    long_vowel_patterns = {
        'a_e': r'\b\w*a[^aeiou]e\b',
        'ai': r'\b\w*ai\w*\b',
        'ay': r'\b\w*ay\b',
        'ee': r'\b\w*ee\w*\b',
        'ea': r'\b\w*ea\w*\b',
        'e_e': r'\b\w*e[^aeiou]e\b',
        'i_e': r'\b\w*i[^aeiou]e\b',
        'ie': r'\b\w*ie\b',
        'igh': r'\b\w*igh\w*\b',
        'o_e': r'\b\w*o[^aeiou]e\b',
        'oa': r'\b\w*oa\w*\b',
        'ow': r'\b\w*ow\b',
        'u_e': r'\b\w*u[^aeiou]e\b',
        'ue': r'\b\w*ue\w*\b',
        'ui': r'\b\w*ui\w*\b',
    }
    
    pattern_priority = ['a_e', 'i_e', 'o_e', 'u_e', 'ee', 'ea', 'ai', 'oa', 'igh', 'ay', 'ow', 'ie', 'ue', 'ui', 'e_e']
    
    needs_fix = False
    if current_target in ['sentence', 'simple_sentence', None, ''] or not current_target:
        needs_fix = True
    elif current_target in long_vowel_patterns:
        if not re.search(long_vowel_patterns[current_target], sentence.lower()):
            needs_fix = True
            logger.warning(f"🚨 Pattern '{current_target}' NOT in: '{sentence}'")
    
    if needs_fix:
        found_pattern = None
        for pattern in pattern_priority:
            if pattern in long_vowel_patterns:
                if re.search(long_vowel_patterns[pattern], sentence.lower()):
                    found_pattern = pattern
                    break
        
        if found_pattern:
            word_object['targetLetter'] = found_pattern
            vowel_map = {
                'a_e': 'long_a', 'ai': 'long_a', 'ay': 'long_a',
                'e_e': 'long_e', 'ee': 'long_e', 'ea': 'long_e',
                'i_e': 'long_i', 'ie': 'long_i', 'igh': 'long_i',
                'o_e': 'long_o', 'oa': 'long_o', 'ow': 'long_o',
                'u_e': 'long_u', 'ue': 'long_u', 'ui': 'long_u'
            }
            if found_pattern in vowel_map:
                word_object['pattern'] = vowel_map[found_pattern]
            logger.info(f"✅ FIXED: '{sentence}' -> '{found_pattern}'")
        else:
            word_object['targetLetter'] = 'a_e'
            word_object['pattern'] = 'long_a'
            logger.error(f"❌ No pattern in '{sentence}', using fallback")
    
    return word_object

def validate_and_fix_ai_response(words_data, challenge_level, learning_focus):
    """
    Validates all AI responses for simple_sentences + long_vowels.
    """
    if not words_data:
        return []
    
    fixed_words = []
    for word_obj in words_data:
        fixed_obj = fix_long_vowel_target_letter(word_obj, challenge_level, learning_focus)
        fixed_words.append(fixed_obj)
    
    return fixed_words

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

def detect_long_vowel_pattern(word):
    """
    Automatically detect which long vowel pattern exists in a word.
    Returns the pattern string (e.g., 'a_e', 'ee', 'ai', 'ui') or None if not found.
    
    CRITICAL FIX: Check vowel teams FIRST, then magic-e patterns.
    This prevents "suitcase" from being identified as "u_e" when it's really "ui".
    """
    word_lower = word.lower()
    
    # ============================================
    # STEP 1: Check for vowel team patterns FIRST
    # ============================================
    vowel_teams = [
        # 4-letter teams
        'eigh', # eight, weigh
        'augh', # taught, caught
        'ough', # though, dough
        # 3-letter teams
        'igh',  # night, light, right
        # 2-letter teams
        'ai',   # rain, wait, train
        'ay',   # day, play, stay
        'ee',   # tree, see, feet
        'ea',   # beach, eat, read
        'ie',   # pie, tie, tried
        'oa',   # boat, road, toad
        'ow',   # snow, blow, show
        'ue',   # blue, true, clue
        'ui',   # fruit, juice, suitcase ← FIXES YOUR ISSUE!
        'ey',   # key, they, monkey
        'ew',   # new, few, grew
        'oo',   # moon, food, soon
    ]
    
    for team in vowel_teams:
        if team in word_lower:
            return team
    
    # ============================================
    # STEP 2: Check for magic-e patterns SECOND
    # ============================================
    magic_e_patterns = [
        ('a', 'e', 'a_e'),  # cake, make, snake
        ('i', 'e', 'i_e'),  # bike, kite, time
        ('o', 'e', 'o_e'),  # home, rope, bone
        ('u', 'e', 'u_e'),  # cute, tube, huge
        ('e', 'e', 'e_e'),  # these, Pete
    ]
    
    for vowel, e, pattern_name in magic_e_patterns:
        # Check for vowel + consonant + e pattern
        for i in range(len(word_lower) - 2):
            if (word_lower[i] == vowel and 
                word_lower[i + 2] == e and 
                word_lower[i + 1] not in ' aeiouy'):
                return pattern_name
    
    return None
def is_compound_word(word):
    """
    Validate if a word is truly a compound word by checking if it can be split
    into two recognizable English words.
    """
    if not word or len(word) < 4:
        return False
    
    word_lower = word.lower().replace('-', '').strip()
    
    # Blacklist of SINGLE WORDS that must be rejected
    single_word_blacklist = {
        # Common single words with blends
        'sled', 'street', 'trick', 'brave', 'crisp', 'black', 'blue', 'class',
        'clock', 'close', 'cloud', 'club', 'flag', 'flame', 'flash', 'flat',
        'floor', 'flower', 'frame', 'fresh', 'friend', 'front', 'frost',
        'glad', 'glass', 'globe', 'glove', 'grade', 'grand', 'grape', 'grass',
        'great', 'green', 'ground', 'group', 'plan', 'plane', 'plant', 'plate',
        'play', 'please', 'pride', 'print', 'price', 'prize', 'prove',
        'scale', 'scare', 'slide', 'slope', 'small', 'smart', 'smile', 'smoke',
        'snake', 'space', 'speak', 'speed', 'spell', 'spend', 'spill', 'sport',
        'spread', 'spring', 'square', 'stage', 'stamp', 'stand', 'star', 'start',
        'state', 'stick', 'still', 'stone', 'store', 'story', 'strange', 'strap',
        'stream', 'stress', 'strike', 'string', 'strong', 'trace', 'track', 'trade',
        'train', 'trash', 'treat', 'tree', 'trial', 'tribe', 'truck',
        
        # Common single words with digraphs
        'chair', 'chain', 'change', 'charge', 'cheap', 'cheat', 'check', 'cheek',
        'cheer', 'cheese', 'cherry', 'chest', 'chick', 'chicken', 'child', 'choice',
        'phone', 'photo', 'phrase', 'graph', 'dolphin', 'elephant', 'alphabet',
        'shell', 'ship', 'shirt', 'shock', 'shoot', 'shop', 'shore', 'short',
        'should', 'shout', 'show', 'shut', 'fish', 'dish', 'wish', 'rush', 'push',
        'brush', 'crash', 'fresh', 'trash',
        'thank', 'thick', 'thing', 'think', 'third', 'thirsty', 'thorn', 'those',
        'thought', 'three', 'throw', 'thumb', 'thunder', 'path', 'bath', 'math',
        'whale', 'wheat', 'wheel', 'when', 'where', 'which', 'while', 'whip', 'white',
        
        # Other common single words
        'another', 'together', 'nothing', 'something', 'anything', 'everything',
        'mother', 'father', 'brother', 'sister', 'weather', 'whether', 'water',
        'butter', 'letter', 'better', 'other', 'either',
        'apple', 'orange', 'banana', 'purple', 'yellow', 'number', 'little',
        'middle', 'people', 'animal', 'family', 'happy', 'ready', 'study'
    }
    
    # Reject if in blacklist
    if word_lower in single_word_blacklist:
        print(f"❌ BLACKLIST REJECTED: '{word}' is a single word, not compound")
        return False
    
    # Common word parts for compound word validation
    common_words = {
        'sun', 'hot', 'dog', 'cat', 'fish', 'sand', 'box', 'bed', 'mat', 'pig', 'pen',
        'back', 'pack', 'hat', 'time', 'day', 'night', 'light', 'sea', 'weed', 'shell',
        'rain', 'bow', 'snow', 'man', 'ball', 'mail', 'cupcake', 'cup', 'cake', 'bath',
        'tub', 'room', 'play', 'ground', 'yard', 'ship', 'boat', 'sail', 'air', 'port',
        'plane', 'fire', 'fly', 'butter', 'moon', 'star', 'foot', 'print', 'hand',
        'book', 'note', 'base', 'water', 'fall', 'hill', 'side', 'up', 'down', 'out',
        'in', 'door', 'way', 'some', 'any', 'every', 'thing', 'one', 'body', 'where',
        'tooth', 'brush', 'hair', 'cut', 'shoe', 'lace', 'neck', 'tie', 'arm', 'chair',
        'eye', 'brow', 'finger', 'nail', 'sun', 'flower', 'bee', 'hive', 'honey', 'comb',
        'rain', 'coat', 'under', 'over', 'flash', 'blue', 'bird', 'black', 'berry',
        'straw', 'grape', 'fruit', 'pan', 'stop', 'watch', 'class', 'check', 'point',
        'mark', 'white', 'board', 'frog', 'pond', 'grass', 'land', 'spot', 'book', 'shelf'
    }
    
    # Try to split the word into two parts
    for i in range(2, len(word_lower) - 1):  # Start at 2, end before last char
        part1 = word_lower[:i]
        part2 = word_lower[i:]
        
        # Check if both parts are common words
        if part1 in common_words and part2 in common_words:
            print(f"✅ COMPOUND ACCEPTED: '{word}' = '{part1}' + '{part2}'")
            return True
    
    # If it's long enough and not in blacklist, give it benefit of doubt
    # But warn that we couldn't definitively validate it
    if len(word_lower) >= 8:
        print(f"⚠️ POSSIBLY COMPOUND: '{word}' (long enough, not in blacklist, couldn't split)")
        return True
    
    print(f"❌ REJECTED: '{word}' - couldn't validate as compound word")
    return False

def is_phrase(text):
    """
    Validate if text is truly a phrase (2-4 words) rather than a single word.
    """
    if not text:
        return False
    
    # Clean the text
    text_clean = text.strip()
    
    # Count words (split by spaces)
    words = text_clean.split()
    word_count = len(words)
    
    # Must have 2-4 words to be a phrase
    if word_count < 2:
        print(f"❌ PHRASE REJECTED: '{text}' is a single word, not a phrase")
        return False
    
    if word_count > 4:
        print(f"⚠️ PHRASE WARNING: '{text}' has {word_count} words (might be a sentence)")
        return True  # Accept but warn
    
    # Check that each word is at least 2 characters (avoid "a b c" type phrases)
    if any(len(word.strip()) < 2 for word in words):
        print(f"❌ PHRASE REJECTED: '{text}' contains very short words")
        return False
    
    print(f"✅ PHRASE ACCEPTED: '{text}' ({word_count} words)")
    return True

def is_valid_compound_word(word_str):
    """
    Validate if a string is actually a compound word (not a single word).
    This filters out single words that slip through AI generation.
    
    Returns:
        bool: True if word appears to be a compound word, False otherwise
    """
    if not word_str:
        return False
    
    word_lower = word_str.lower().strip()
    
    # REJECT if has spaces (that's a phrase, not compound)
    if ' ' in word_lower:
        print(f"❌ COMPOUND REJECTED: '{word_str}' contains spaces (it's a phrase)")
        return False
    
    # REJECT if too short (compound words are usually 6+ characters)
    if len(word_lower) < 6:
        print(f"❌ COMPOUND REJECTED: '{word_str}' is too short ({len(word_lower)} chars)")
        return False
    
    # Common compound word parts
    compound_parts = [
        'back', 'sun', 'hot', 'sand', 'box', 'man', 'dog', 'cat', 'fish', 
        'fire', 'rain', 'snow', 'mail', 'bed', 'hand', 'book', 'note', 
        'base', 'water', 'fall', 'hill', 'side', 'door', 'way', 'tooth', 
        'brush', 'hair', 'shoe', 'neck', 'arm', 'chair', 'eye', 'finger', 
        'bee', 'honey', 'coat', 'under', 'over', 'flash', 'blue', 'bird', 
        'black', 'berry', 'straw', 'grape', 'fruit', 'pan', 'stop', 'watch', 
        'class', 'check', 'point', 'mark', 'white', 'board', 'frog', 'pond', 
        'grass', 'land', 'spot', 'light', 'play', 'ground'
    ]
    
    # Check if word starts or ends with common compound parts
    for part in compound_parts:
        if word_lower.startswith(part) or word_lower.endswith(part):
            # Make sure it's longer than just the part itself
            if len(word_lower) > len(part) + 2:
                print(f"✅ COMPOUND ACCEPTED: '{word_str}' (contains '{part}')")
                return True
    
    # If it has multiple capital letters (CamelCase), might be compound
    capitals = sum(1 for c in word_str if c.isupper())
    if capitals >= 2:
        print(f"✅ COMPOUND ACCEPTED: '{word_str}' (has CamelCase)")
        return True
    
    print(f"❌ COMPOUND REJECTED: '{word_str}' - couldn't validate as compound")
    return False


def is_valid_phrase(word_str):
    """
    Validate if a string is actually a phrase (2-4 words) not a single word.
    This filters out single words that slip through AI generation.
    
    Returns:
        bool: True if string is a valid phrase (2+ words), False otherwise
    """
    if not word_str:
        return False
    
    # Clean and split by spaces
    words = word_str.strip().split()
    word_count = len(words)
    
    # REJECT if only 1 word
    if word_count < 2:
        print(f"❌ PHRASE REJECTED: '{word_str}' is a single word")
        return False
    
    # Accept if 2-4 words
    if word_count <= 4:
        print(f"✅ PHRASE ACCEPTED: '{word_str}' ({word_count} words)")
        return True
    
    # Warn if more than 4 words but still accept
    print(f"⚠️ PHRASE WARNING: '{word_str}' has {word_count} words (might be too long)")
    return True



def regenerate_if_invalid(words, learning_focus):
    """
    Check each word and FIX incorrect targetLetter values.
    For long_vowels, validates and corrects the targetLetter pattern.
    """
    if learning_focus == 'short_vowels':
        validated_words = []
        for word_obj in words:
            word = word_obj.get('word', '')
            
            # Check if word contains any LONG vowel pattern
            has_long_vowel = detect_long_vowel_pattern(word)
            
            if has_long_vowel:
                # REJECT this word - it has a long vowel pattern!
                print(f"❌ REJECTED (short vowels): '{word}' - contains long vowel pattern '{has_long_vowel}'")
            else:
                # ACCEPT this word - no long vowel patterns found
                print(f"✅ VALID (short vowels): '{word}' - only short vowels")
                validated_words.append(word_obj)
        
        return validated_words
    if learning_focus != 'long_vowels':
        return words
    
    validated_words = []
    for word_obj in words:
        word = word_obj.get('word', '')
        target = word_obj.get('targetLetter', '')
        
        # Try to validate with current targetLetter
        if validate_long_vowel_pattern(word, target):
            validated_words.append(word_obj)
            print(f"✅ VALID: '{word}' with targetLetter '{target}'")
        else:
            # Try to find and fix the correct pattern
            print(f"⚠️  INVALID: '{word}' with targetLetter '{target}' - attempting to fix...")
            
            # Try to detect the correct long vowel pattern
            correct_pattern = detect_long_vowel_pattern(word)
            
            if correct_pattern:
                # Fix the targetLetter
                word_obj['targetLetter'] = correct_pattern
                # Also update the pattern field if needed
                if not word_obj.get('pattern', '').startswith('long_'):
                    if correct_pattern[0] == 'a':
                        word_obj['pattern'] = 'long_a'
                    elif correct_pattern[0] == 'e':
                        word_obj['pattern'] = 'long_e'
                    elif correct_pattern[0] == 'i':
                        word_obj['pattern'] = 'long_i'
                    elif correct_pattern[0] == 'o':
                        word_obj['pattern'] = 'long_o'
                    elif correct_pattern[0] == 'u':
                        word_obj['pattern'] = 'long_u'
                
                print(f"✅ FIXED: '{word}' → targetLetter changed to '{correct_pattern}'")
                validated_words.append(word_obj)
            else:
                # Can't fix it, reject the word
                print(f"❌ REJECTED: '{word}' - no valid long vowel pattern found")
    
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
    """Generate words for the vanishing game using OpenAI GPT"""
    try:
        # Extract parameters from request
        data = request.data
        challenge_level = data.get('challengeLevel', 'simple_words')
        learning_focus = data.get('learningFocus', 'short_vowels')
        difficulty = data.get('difficulty', 'easy')
        word_count = data.get('wordCount', 10)
        
        logger.info(f"🚀 OPTIMIZED: Generating {word_count} words for {challenge_level}/{learning_focus}/{difficulty}")
        
        # Calculate actual word count needed
        actual_word_count = word_count
        
        # ⚡ OPTIMIZATION 1: Adjust buffer for compound_words and phrases
        if challenge_level == 'compound_words':
            requested_count = int(word_count * 2.5)
            logger.info(f"🔥 COMPOUND WORDS: Requesting {requested_count} words (2.5x buffer)")
        elif challenge_level == 'phrases':
            requested_count = int(word_count * 2)
            logger.info(f"🔥 PHRASES: Requesting {requested_count} words (2x buffer)")
        else:
            requested_count = word_count
        
        # ⚡ OPTIMIZATION 2: Reduced validation attempts (2 instead of 5)
        validated_words = []
        
        # 🎯 KEY CHANGE: Only 2 attempts for compound_words and phrases
        if challenge_level in ['compound_words', 'phrases']:
            max_attempts = 2  # ⚡ REDUCED FROM 5 to 2
            print(f"⚡ FAST MODE: Using 2/2 validation for {challenge_level}")
        else:
            max_attempts = 5  # Keep 5 for simple_words and sentences
        
        attempt = 0
        
        # ⚡ OPTIMIZATION 3: Attempt validation with reduced retries
        while len(validated_words) < actual_word_count and attempt < max_attempts:
            attempt += 1
            
            remaining_needed = actual_word_count - len(validated_words)
            
            if attempt == 1:
                generate_count = requested_count
            else:
                generate_count = int(remaining_needed * 1.5)
            
            print(f"\n🔄 ATTEMPT {attempt}/{max_attempts}: Generating {generate_count} words (need {remaining_needed} more)")
            
            # Generate words using OpenAI
            new_words = generate_phonics_words_with_ai(challenge_level, learning_focus, difficulty, generate_count)
            
            # ⚡ CONDITIONAL VALIDATION - Strict for compound_words/phrases, lenient for simple_words
            if challenge_level in ['compound_words', 'phrases']:
                # STRICT validation for compound_words and phrases (KEEP THIS)
                print(f"🔍 STRICT VALIDATION for {challenge_level}/{learning_focus}...")
                new_words = validate_pattern_isolation(new_words, learning_focus, challenge_level)
                print(f"✅ Pattern validation: {len(new_words)}/{generate_count} words passed")
            else:
                # LENIENT validation for simple_words and simple_sentences
                print(f"✅ LENIENT mode for {challenge_level} - accepting AI words with basic checks")
                # Just do basic structure validation, no pattern checking
                new_words = [w for w in new_words if validate_word_structure(w)]
                print(f"✅ Basic validation: {len(new_words)}/{generate_count} words passed")
            
            # Long vowel specific validation (ONLY for compound_words/phrases)
            if learning_focus == 'long_vowels' and challenge_level in ['compound_words', 'phrases']:
                new_words = regenerate_if_invalid(new_words, learning_focus)
            
            # Challenge-specific filtering
            if challenge_level == 'compound_words':
                print(f"🔍 FILTERING COMPOUND WORDS...")
                before_count = len(new_words)
                filtered_words = []
                for word_obj in new_words:
                    if is_valid_compound_word(word_obj.get('word', '')):
                        filtered_words.append(word_obj)
                new_words = filtered_words
                print(f"✅ Compound filter: {len(new_words)}/{before_count} are valid compound words")
                
            elif challenge_level == 'phrases':
                print(f"🔍 FILTERING PHRASES...")
                before_count = len(new_words)
                filtered_words = []
                for word_obj in new_words:
                    if is_valid_phrase(word_obj.get('word', '')):
                        filtered_words.append(word_obj)
                new_words = filtered_words
                print(f"✅ Phrase filter: {len(new_words)}/{before_count} are valid phrases")
            
            # Add validated words
            validated_words.extend(new_words)
            
            # Remove duplicates
            seen_words = set()
            unique_words = []
            for word_obj in validated_words:
                word_text = word_obj.get('word', '').lower()
                if word_text not in seen_words:
                    seen_words.add(word_text)
                    unique_words.append(word_obj)
            
            validated_words = unique_words
            
            print(f"📊 Total valid unique words so far: {len(validated_words)}/{actual_word_count}")
            
            if len(validated_words) >= actual_word_count:
                print(f"✅ SUCCESS! Got {len(validated_words)} validated words")
                final_words = validated_words[:actual_word_count]
                
                return Response({
                    'success': True,
                    'words': final_words,
                    'ai_generated': True,
                    'validation_attempts': attempt,
                    'config': {
                        'challengeLevel': challenge_level,
                        'learningFocus': learning_focus,
                        'difficulty': difficulty
                    }
                })
        
        # ⚡ OPTIMIZATION 4: HYBRID APPROACH - Use AI + Fallback
        if len(validated_words) > 0 and challenge_level in ['compound_words', 'phrases']:
            # We have SOME validated words, but not enough
            fallback_needed = actual_word_count - len(validated_words)
            
            print(f"\n🔀 HYBRID MODE:")
            print(f"   ✅ AI validated: {len(validated_words)} words")
            print(f"   📋 Fallback needed: {fallback_needed} words")
            
            # Get fallback words to fill the gap
            fallback_words = generate_static_fallback_words(challenge_level, learning_focus, fallback_needed)
            
            # Combine AI + fallback
            final_words = validated_words + fallback_words[:fallback_needed]
            
            print(f"   🎉 FINAL: {len(final_words)} words ({len(validated_words)} AI + {len(fallback_words[:fallback_needed])} fallback)")
            
            return Response({
                'success': True,
                'words': final_words,
                'ai_generated': True,
                'hybrid_mode': True,
                'ai_words_count': len(validated_words),
                'fallback_words_count': fallback_needed,
                'validation_attempts': attempt,
                'config': {
                    'challengeLevel': challenge_level,
                    'learningFocus': learning_focus,
                    'difficulty': difficulty
                }
            })
        
        # ⚡ OPTIMIZATION 5: Pure fallback if no AI words validated
        print(f"\n⚠️  Using pure fallback words (no AI words validated)")
        fallback_words = generate_static_fallback_words(challenge_level, learning_focus, actual_word_count)
        
        return Response({
            'success': True,
            'words': fallback_words,
            'ai_generated': False,
            'fallback_reason': 'validation_failed',
            'config': {
                'challengeLevel': challenge_level,
                'learningFocus': learning_focus,
                'difficulty': difficulty
            }
        })
        
    except Exception as e:
        logger.error(f"Error in optimized generation: {str(e)}")
        # Emergency fallback
        fallback_words = generate_static_fallback_words(challenge_level, learning_focus, word_count)
        return Response({
            'success': True,
            'words': fallback_words,
            'ai_generated': False,
            'fallback_reason': 'exception',
            'error': str(e)
        })

def generate_phonics_words_with_ai(challenge_level, learning_focus, difficulty, word_count):
    """Generate phonics-based words using OpenAI GPT with educational expertise"""
    
    print(f"🎯 Requested word_count: {word_count}")
    print(f"📋 Challenge level: {challenge_level}")

    # 🔥 SMART LIMITS: Max per single API call based on token limits
    if challenge_level == 'simple_sentences':
        MAX_PER_CALL = 15  # 15 sentences × 250 tokens = 3750 tokens (safe)
    elif challenge_level == 'phrases':
        MAX_PER_CALL = 25  # ⚡ Generate max 25 in ONE call (no batching!)
    elif challenge_level == 'compound_words':
        MAX_PER_CALL = 25  # ⚡ Generate max 25 in ONE call (no batching!)
    else:  # simple_words
        MAX_PER_CALL = 34  # 34 words × 100 tokens = 3400 tokens
    
    # ⚡ FOR COMPOUND_WORDS & PHRASES: Generate max 25, use fallback for rest
    if challenge_level in ['compound_words', 'phrases']:
        if word_count <= 25:
            # Generate all words with AI (single call)
            print(f"✅ Single call: generating {word_count} items")
            return generate_single_batch(challenge_level, learning_focus, difficulty, word_count)
        else:
            # Generate 25 with AI, rest with fallback
            print(f"⚡ HYBRID: Generating 25 with AI, {word_count - 25} with fallback")
            ai_words = generate_single_batch(challenge_level, learning_focus, difficulty, 25)
            fallback_words = generate_static_fallback_words(challenge_level, learning_focus, word_count - 25)
            return ai_words + fallback_words
    
    # For simple_words and simple_sentences (keep original behavior)
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
            words = validate_and_fix_ai_response(words, challenge_level, learning_focus)
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

⚠️ CRITICAL VERIFICATION STEP ⚠️

After you write each sentence, CHECK:
1. Find the word with the long vowel
2. Look at the EXACT letters in that word
3. Match the targetLetter to what you SEE

EXAMPLES:

✅ CORRECT:
Sentence: "The wise owl sat on a rope."
Word: "rope" has r-o-p-e (this is "o_e" pattern)
targetLetter: "o_e" ✅

❌ WRONG:
Sentence: "The owl hooted loudly."
Word: "hooted" has h-o-o-t-e-d (this is "oo" pattern, NOT "o_e")
targetLetter: "o_e" ❌ WRONG!
Correct: targetLetter: "oo" ✅

✅ CORRECT:
Sentence: "The queen wore a crown."
Word: "queen" has q-u-e-e-n (this is "ue" pattern)
targetLetter: "ue" ✅

DOUBLE-CHECK EVERY SENTENCE:
- Does the targetLetter pattern ACTUALLY appear in the word?
- Can you point to those exact letters in order?
- If not, change the targetLetter or change the sentence!
```

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
    # Add this right after the phrase description
        prompt += """

        🚨 PHRASE VALIDATION RULES 🚨

        A phrase MUST have 2-4 words that work together naturally.

        VALID phrase examples:
        ✅ "big red car" (3 words, descriptive)
        ✅ "happy dog" (2 words, descriptive)
        ✅ "run fast" (2 words, action)
        ✅ "hot sun" (2 words, descriptive)

        INVALID examples (DO NOT GENERATE):
        ❌ "car" (single word - not a phrase!)
        ❌ "running" (single word)
        ❌ "a b c d e" (too many short words)

        BEFORE SUBMITTING: Count the words! If it's 1 word → NOT A PHRASE!
        """
        if challenge_level == 'compound_words':
            prompt += f"""

    🔥🔥🔥 MANDATORY: EVERY WORD MUST BE A COMPOUND WORD 🔥🔥🔥

    COMPOUND WORD = TWO REAL WORDS JOINED TOGETHER

    You MUST generate {word_count} COMPOUND WORDS (not single words!)

    REQUIRED FORMAT FOR EVERY WORD:
    - Split it into two parts: "word1" + "word2" = "compound"
    - Both parts must be real English words
    - Example: "hot" + "dog" = "hotdog" ✅
    - NOT allowed: "cat" (single word) ❌

    BEFORE WRITING EACH WORD, ASK:
    1. Can I split this into "part1 + part2"?
    2. Are BOTH parts real words?
    3. If NO to either → DON'T USE IT!

            """
            
            if learning_focus == 'short_vowels':
                prompt += """
    COMPOUND WORDS WITH SHORT VOWELS:

    Generate COMPOUND words where both parts use short vowel sounds.

    EXAMPLES (use patterns like these):
    1. "hotdog" = "hot" + "dog" (both short vowels)
    2. "catfish" = "cat" + "fish" (both short vowels)
    3. "pigpen" = "pig" + "pen" (both short vowels)
    4. "sandbox" = "sand" + "box" (both short vowels)
    5. "sunset" = "sun" + "set" (both short vowels)
    6. "backpack" = "back" + "pack" (both short vowels)
    7. "hotpot" = "hot" + "pot" (both short vowels)
    8. "ragdoll" = "rag" + "doll" (both short vowels)
    9. "piglet" = "pig" + "let" (both short vowels)
    10. "hatbox" = "hat" + "box" (both short vowels)

    CRITICAL: Every word MUST be two words joined! Not just "cat" or "dog"!
                """
                
            elif learning_focus == 'long_vowels':
                prompt += """
    COMPOUND WORDS WITH LONG VOWELS:

    Generate COMPOUND words where at least one part has a long vowel.

    EXAMPLES (use patterns like these):
    1. "rainbow" = "rain" + "bow" (long vowel: ai, ow)
    2. "mailbox" = "mail" + "box" (long vowel: ai)
    3. "seaweed" = "sea" + "weed" (long vowel: ea, ee)
    4. "sailboat" = "sail" + "boat" (long vowel: ai, oa)
    5. "cupcake" = "cup" + "cake" (long vowel: a_e)
    6. "daytime" = "day" + "time" (long vowel: ay, i_e)
    7. "moonlight" = "moon" + "light" (long vowel: oo, igh)
    8. "beehive" = "bee" + "hive" (long vowel: ee, i_e)
    9. "seashell" = "sea" + "shell" (long vowel: ea)
    10. "raincoat" = "rain" + "coat" (long vowel: ai, oa)

    CRITICAL: Every word MUST be two words joined! Not just "rain" or "moon"!
                """
                
            elif learning_focus == 'blends':
                prompt += """
    COMPOUND WORDS WITH BLENDS:

    Generate COMPOUND words where at least one part has a consonant blend.

    EXAMPLES (use patterns like these):
    1. "starfish" = "star" + "fish" (blend: st)
    2. "classroom" = "class" + "room" (blend: cl)
    3. "playground" = "play" + "ground" (blend: pl, gr)
    4. "grassland" = "grass" + "land" (blend: gr)
    5. "stopwatch" = "stop" + "watch" (blend: st)
    6. "driftwood" = "drift" + "wood" (blend: dr)
    7. "drumstick" = "drum" + "stick" (blend: dr, st)
    8. "backpack" = "back" + "pack" (blend: ck, ck)
    9. "blueberry" = "blue" + "berry" (blend: bl)
    10. "snowflake" = "snow" + "flake" (blend: sn, fl)

    CRITICAL: Every word MUST be two words joined! Not just "stop" or "grass"!
                """
                
            elif learning_focus == 'digraphs':
                prompt += """
    COMPOUND WORDS WITH DIGRAPHS:

    Generate COMPOUND words where at least one part has a digraph (sh, ch, th, wh, ph).

    EXAMPLES (use patterns like these):
    1. "toothbrush" = "tooth" + "brush" (digraph: th, sh)
    2. "fishpond" = "fish" + "pond" (digraph: sh)
    3. "bathtub" = "bath" + "tub" (digraph: th)
    4. "whiteboard" = "white" + "board" (digraph: wh)
    5. "seashell" = "sea" + "shell" (digraph: sh)
    6. "checkpoint" = "check" + "point" (digraph: ch)
    7. "bathrobe" = "bath" + "robe" (digraph: th)
    8. "toothpick" = "tooth" + "pick" (digraph: th)
    9. "dishpan" = "dish" + "pan" (digraph: sh)
    10. "chessboard" = "chess" + "board" (digraph: ch)

    CRITICAL: Every word MUST be two words joined! Not just "fish" or "white"!
                """

            prompt += f"""

    🚨 FINAL REMINDER 🚨
    YOU ARE GENERATING {word_count} COMPOUND WORDS!
    NOT single words! NOT regular words!
    COMPOUND = TWO WORDS JOINED!

    If you write "cat" → WRONG! ❌
    If you write "catfish" → CORRECT! ✅

    Generate EXACTLY {word_count} COMPOUND WORDS now:
            """
        elif learning_focus == 'long_vowels':
            prompt += """
            
✅ COMPOUND WORD + LONG VOWEL RULES:

When combining compound_words with long_vowels:
- At least ONE part MUST contain a clear long vowel pattern
- Use targetLetter for the specific long vowel pattern (a_e, ai, ee, etc.)
- Both parts can have long vowels for extra challenge

EXAMPLES:
✅ CORRECT: "rainbow" (ai in rain), "seaweed" (ea in sea, ee in weed), "moonlight" (oo in moon, igh in light)
❌ WRONG: "hotdog" (both short vowels), "sunset" (both short vowels)

GENERATE: Compound words with clear long vowel patterns
            """
        elif learning_focus == 'blends':
            prompt += """
            
✅ COMPOUND WORD + BLEND RULES:

When combining compound_words with blends:
- At least ONE part should START or END with a consonant blend
- Use targetLetter for the specific blend (st, bl, fr, etc.)

EXAMPLES:
✅ CORRECT: "stopwatch" (st blend), "playground" (pl and gr blends), "backpack" (ck blend)
❌ WRONG: Words without clear blends

GENERATE: Compound words featuring consonant blends
            """
        elif learning_focus == 'digraphs':
            prompt += '''
            
✅ COMPOUND WORD + DIGRAPH RULES:

‼️ CRITICAL: MUST BE TRUE COMPOUND WORDS (TWO WORDS JOINED) ‼️

When combining compound_words with digraphs:
- MUST be a TRUE COMPOUND WORD: Two separate, recognizable words joined together
- At least ONE part should contain a digraph (sh, ch, th, wh, ph)
- Use targetLetter for the specific digraph

⚠️ REJECT SIMPLE WORDS - THESE ARE WRONG:
❌ "cherry" - This is ONE word, not compound! (even though it has 'ch')
❌ "whale" - This is ONE word, not compound! (even though it has 'wh')
❌ "fish" - This is ONE word, not compound! (even though it has 'sh')
❌ "shell" - This is ONE word, not compound! (even though it has 'sh')
❌ "path" - This is ONE word, not compound! (even though it has 'th')

✅ CORRECT EXAMPLES (TWO WORDS JOINED):
- "shipyard" (ship + yard, contains 'sh')
- "fishpond" (fish + pond, contains 'sh')
- "toothbrush" (tooth + brush, contains 'th' and 'sh')
- "whiteboard" (white + board, contains 'wh')
- "checkpoint" (check + point, contains 'ch')
- "bathtub" (bath + tub, contains 'th')
- "flashlight" (flash + light, contains 'sh')
- "seashell" (sea + shell, contains 'sh')

VALIDATION CHECKLIST:
[ ] Can you split it into TWO separate words?
[ ] Are both parts real words children know?
[ ] Does at least one part contain a digraph?

DO NOT GENERATE: Single words with digraphs!
ONLY GENERATE: Compound words (two words joined) that contain digraphs!

GENERATE: True compound words featuring digraphs
            '''
        # Add this right after the closing ''' of the digraph section
    prompt += """

    🚨 FINAL COMPOUND WORD VALIDATION 🚨

    Before submitting each compound word, verify:
    1. Can you split it into TWO separate words? (e.g., "hot" + "dog" = "hotdog")
    2. Are BOTH parts real English words that kids know?
    3. Does it make logical sense? (e.g., "hotdog" makes sense, "catbook" doesn't)

    IF ANY ANSWER IS NO → REJECT THAT WORD AND GENERATE A DIFFERENT ONE!

    Examples of VALID compound words:
    ✅ "hotdog" = hot + dog (both real words)
    ✅ "sandbox" = sand + box (both real words)
    ✅ "backpack" = back + pack (both real words)
    ✅ "sunflower" = sun + flower (both real words)

    Examples of INVALID (DO NOT GENERATE):
    ❌ "catfish" if it's just the animal name (teach only common kid meanings)
    ❌ Single words like "tree", "house", "friend"
    ❌ Made-up words like "catbook", "dogpen" (unless it's pigpen)

    REMEMBER: A compound word MUST be two real words joined together!
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
        prompt += """
        
    ⚠️ CRITICAL PATTERN ISOLATION ⚠️

    ONLY generate words with SHORT VOWELS!
    - MUST have: a, e, i, o, u making SHORT sounds ONLY
    - NO long vowels (no silent-e, no vowel teams like ai, ee, oa)
    - NO words like "cake", "bike", "meet", "boat", "cute"
    - YES words like "cat", "bed", "pig", "hot", "sun"

    VALIDATION CHECKLIST FOR EACH WORD:
    [ ] Does it contain ONLY short vowel sounds?
    [ ] Does it avoid silent-e patterns?
    [ ] Does it avoid vowel teams (ai, ee, oa, ay)?

    EXAMPLES TO FOLLOW:
    ✅ CORRECT: "cat", "bed", "pig", "hot", "cup", "run", "sit", "dog", "fun"
    ❌ WRONG: "cake" (long a), "time" (long i), "hope" (long o), "tree" (long e)
        """
        if challenge_level == 'simple_sentences':
            prompt += """
        - MUST generate complete SENTENCES (not single words!)
        - Each sentence must have a subject and verb
        - Include ONLY words with short vowel sounds
        - Examples: "The cat sat down.", "A red pen is here.", "The pig is big."
                """
        else:
            prompt += """
        - Clear examples of CVC patterns (consonant-vowel-consonant)
        - Single syllable preferred for simple words
                    """
    elif learning_focus == 'long_vowels':
        prompt += """

⚠️ CRITICAL PATTERN ISOLATION ⚠️

ONLY generate words with LONG VOWELS!
- MUST have: a_e, ai, ay, ee, ea, i_e, ie, igh, o_e, oa, ow, u_e, ue, ui
- NO short vowels (no CVC patterns like "cat", "bed", "pig")
- Each word MUST contain at least ONE long vowel pattern

VALIDATION CHECKLIST FOR EACH WORD:
[ ] Does it contain a long vowel pattern?
[ ] Is targetLetter the SPECIFIC pattern (not "long_vowels")?
[ ] Can you SEE that pattern in the word?

EXAMPLES TO FOLLOW:
✅ CORRECT: "cake" (a_e), "rain" (ai), "tree" (ee), "bike" (i_e), "boat" (oa)
❌ WRONG: "cat" (short a), "bed" (short e), "pig" (short i)
    
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
        
    ⚠️ CRITICAL PATTERN ISOLATION ⚠️

    ONLY generate words with CONSONANT BLENDS!
    - Two or three consonants that EACH keep their own sound
    - MUST start or end with: bl, cl, fl, fr, gr, pl, pr, sl, sp, st, tr, dr, br, cr, sc, sk, sm, sn, sw
    - Focus on BLENDS specifically, NOT digraphs
    - Each word MUST have a clear consonant blend

    VALIDATION CHECKLIST FOR EACH WORD:
    [ ] Does it start or end with a consonant blend?
    [ ] Are you using targetLetter = "st", "bl", "fr" (not "blends")?
    [ ] Is it a BLEND (two sounds) not a DIGRAPH (one sound)?

    EXAMPLES TO FOLLOW:
    ✅ CORRECT: "stop" (st), "frog" (fr), "clip" (cl), "grab" (gr), "swim" (sw)
    ❌ WRONG: "cat" (no blend), "ship" (sh is digraph, not blend)

    - Include both beginning and ending blends
    - Common blends: bl, cl, fl, fr, gr, pl, pr, sl, sp, st, tr, dr, br, cr, sc, sk, sm, sn, sw
            """
    elif learning_focus == 'digraphs':
        prompt += """
        
    ⚠️ CRITICAL PATTERN ISOLATION ⚠️

    ONLY generate words with DIGRAPHS!
    - Two letters that make ONE sound (not two sounds like blends)
    - MUST contain: sh, ch, th, wh, ph, ng, ck
    - Focus on DIGRAPHS specifically, NOT blends
    - Each word MUST have a clear digraph

    VALIDATION CHECKLIST FOR EACH WORD:
    [ ] Does it contain a digraph (sh, ch, th, wh, ph)?
    [ ] Are you using targetLetter = "sh", "ch", "th" (not "digraphs")?
    [ ] Is it a DIGRAPH (one sound) not a BLEND (two sounds)?

    EXAMPLES TO FOLLOW:
    ✅ CORRECT: "ship" (sh), "chat" (ch), "thin" (th), "when" (wh), "phone" (ph)
    ❌ WRONG: "cat" (no digraph), "stop" (st is blend, not digraph)

    - Common digraphs: sh, ch, th, wh, ph, ng, ck
    - Show how two letters work together as ONE team making ONE sound
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
# Check for generic targetLetter values
    if word_obj.get('targetLetter') in ['sentence', 'simple_sentence', 'vowels', 'blends', 'digraphs', 'short_vowels', 'long_vowels']:
        print(f"\n❌ INVALID: '{word_obj.get('word', 'UNKNOWN')}'")
        print(f"   GENERIC targetLetter: '{word_obj.get('targetLetter')}' (must be specific like 'a', 'sh', 'st', 'a_e')")
        return False
    
    return True

def validate_pattern_isolation(words, learning_focus, challenge_level='simple_words'):
    """
    Ensure generated words only contain the targeted pattern
    This prevents mixing of short vowels with long vowels, blends with digraphs, etc.
    """
    validated = []
    rejected_count = 0
    
    for word_obj in words:
        word = word_obj.get('word', '').lower()
        target = word_obj.get('targetLetter', '').lower()
        should_accept = True
        if challenge_level == 'phrases':
            if not is_phrase(word):
                print(f"❌ PHRASE REJECTED: '{word}' is not a phrase (single word or too short)")
                rejected_count += 1
                continue  # Skip this word entirely
            else:
                # It's a valid phrase - accept it!
                print(f"✅ PHRASE ACCEPTED: '{word}' (pattern checks skipped)")
                validated.append(word_obj)
                continue
                
        # Short vowels check - reject if contains long vowel patterns
        if learning_focus == 'short_vowels':
            long_patterns = ['a_e', 'ai', 'ay', 'ee', 'ea', 'i_e', 'ie', 'igh', 'o_e', 'oa', 'ow', 'u_e', 'ue', 'ui']
            
            # Check if word or target contains any long vowel pattern
            for pattern in long_patterns:
                if pattern in word.replace(' ', '').replace('-', '') or pattern in target:
                    print(f"❌ SHORT VOWEL REJECTED '{word}': Contains long vowel pattern '{pattern}'")
                    should_accept = False
                    break
            
            # Also check that target is actually a short vowel
            if should_accept and target not in ['a', 'e', 'i', 'o', 'u', 'short_a', 'short_e', 'short_i', 'short_o', 'short_u']:
                print(f"❌ SHORT VOWEL REJECTED '{word}': targetLetter '{target}' is not a short vowel")
                should_accept = False
        
        # Long vowels check - must contain at least one long vowel pattern
# Long vowels check - must contain at least one long vowel pattern
        elif learning_focus == 'long_vowels':
            long_patterns = ['a_e', 'ai', 'ay', 'ee', 'ea', 'i_e', 'ie', 'igh', 'o_e', 'oa', 'ow', 'u_e', 'ue', 'ui', 'ew', 'oo']
            has_long = any(pattern in target for pattern in long_patterns)
            
            if not has_long:
                print(f"❌ LONG VOWEL REJECTED '{word}': No long vowel pattern in targetLetter '{target}'")
                should_accept = False
            
# 🔥 NEW: Verify the pattern actually exists in the word 🔥
    else:
        # 🔥 ENHANCED: For sentences, verify pattern exists in a MEANINGFUL word
        if challenge_level == 'simple_sentences':
            # For sentences, check if pattern exists in ANY word (not just function words)
            sentence_words = word.split()
            pattern_found = False
            clean_target = target.replace('long_', '').replace('short_', '')
            
            # Skip function words
            function_words = ['the', 'a', 'an', 'to', 'is', 'was', 'are', 'were', 'of', 'in', 'on', 'at']
            
            for sentence_word in sentence_words:
                # Clean punctuation
                clean_word = sentence_word.replace('.', '').replace(',', '').replace('!', '').replace('?', '').lower()
                
                # Skip if it's a function word
                if clean_word in function_words:
                    continue
                
                # Check if pattern exists in this word
                if '_' in clean_target:
                    # Magic-e pattern
                    vowel, e = clean_target.split('_')
                    for i in range(len(clean_word) - 2):
                        if clean_word[i] == vowel and clean_word[i + 2] == e:
                            pattern_found = True
                            print(f"✅ Pattern '{clean_target}' found in word '{sentence_word}'")
                            break
                else:
                    # Regular pattern
                    if clean_target in clean_word:
                        pattern_found = True
                        print(f"✅ Pattern '{clean_target}' found in word '{sentence_word}'")
                        break
                
                if pattern_found:
                    break
            
            if not pattern_found:
                print(f"❌ LONG VOWEL REJECTED '{word}': Pattern '{target}' not found in any meaningful word")
                should_accept = False
            else:
                # For single words/compounds/phrases, use the existing validation
                word_lower = word.replace(' ', '').replace('.', '').replace('!', '').replace('?', '').lower()
                
                # For magic-e patterns (a_e, i_e, o_e, u_e, e_e)
                if '_' in target:
                    vowel = target.split('_')[0]
                    # Look for: vowel + consonant + e
                    pattern_found = False
                    for i in range(len(word_lower) - 2):
                        if word_lower[i] == vowel and word_lower[i + 2] == 'e':
                            pattern_found = True
                            break
                    
                    if not pattern_found:
                        print(f"❌ LONG VOWEL REJECTED '{word}': Pattern '{target}' not found in word (no {vowel}_e pattern)")
                        should_accept = False
                
                # For vowel teams (ai, ee, oa, ue, etc.)
                else:
                    if target not in word_lower:
                        print(f"❌ LONG VOWEL REJECTED '{word}': Pattern '{target}' not found in word")
                        should_accept = False
        
        # Blends check - must contain blend pattern
        elif learning_focus == 'blends':
            blend_patterns = ['bl', 'cl', 'fl', 'fr', 'gr', 'pl', 'pr', 'sl', 'sp', 'st', 'tr', 'dr', 'br', 'cr', 'sc', 'sk', 'sm', 'sn', 'sw', 'tw', 'str', 'spr', 'spl']
            has_blend = any(pattern in target for pattern in blend_patterns)
            
            if not has_blend:
                print(f"❌ BLEND REJECTED '{word}': No blend pattern in targetLetter '{target}'")
                should_accept = False
            
            # Make sure it's not a digraph
            digraph_patterns = ['sh', 'ch', 'th', 'wh', 'ph']
            has_digraph = any(pattern in target for pattern in digraph_patterns)
            if has_digraph:
                print(f"❌ BLEND REJECTED '{word}': Contains digraph '{target}', not blend")
                should_accept = False
        
        # Digraphs check - must contain digraph pattern
        elif learning_focus == 'digraphs':
            digraph_patterns = ['sh', 'ch', 'th', 'wh', 'ph', 'ng', 'ck']
            has_digraph = any(pattern in target for pattern in digraph_patterns)
            
            if not has_digraph:
                print(f"❌ DIGRAPH REJECTED '{word}': No digraph pattern in targetLetter '{target}'")
                should_accept = False
        
        # Check for generic targetLetter values (should never be used)
        if target in ['sentence', 'simple_sentence', 'vowels', 'blends', 'digraphs', 'short_vowels', 'long_vowels']:
            print(f"❌ GENERIC TARGET REJECTED '{word}': targetLetter is too generic: '{target}'")
            should_accept = False
        
        if should_accept:
            validated.append(word_obj)
        else:
            rejected_count += 1
    
    if rejected_count > 0:
        print(f"\n⚠️  VALIDATION SUMMARY: {rejected_count} words rejected, {len(validated)} words passed\n")
    
    return validated

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

🎯 CRITICAL: All examples must contain the EXACT SAME pattern: "{pattern}"

Examples:
- If pattern is "u": Generate "cup", "bug", "run", "hut"
- If pattern is "a_e": Generate "cake", "make", "take", "bake"  
- If pattern is "sh": Generate "shop", "ship", "shell", "shark"

DO NOT mix patterns! Every word MUST contain "{pattern}".

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

    if pattern in ['a', 'short_a']:
        return ['cat', 'hat', 'bat', 'mat', 'rat']
    elif pattern in ['e', 'short_e']:
        return ['bed', 'red', 'pet', 'wet', 'get']
    elif pattern in ['i', 'short_i']:
        return ['big', 'pig', 'sit', 'hit', 'fit']
    elif pattern in ['o', 'short_o']:
        return ['hot', 'pot', 'dot', 'top', 'hop']
    elif pattern in ['u', 'short_u']:
        return ['cup', 'sun', 'run', 'fun', 'bug']
    elif pattern in ['a_e', 'long_a']:
        return ['cake', 'make', 'take', 'bake', 'lake']
    elif pattern in ['i_e', 'long_i']:
        return ['bike', 'like', 'time', 'nice', 'five']
    elif pattern in ['ee']:
        return ['tree', 'see', 'bee', 'feet', 'meet']
    elif pattern in ['sh', 'digraph_sh']:
        return ['shop', 'ship', 'fish', 'wish', 'dish']
    elif pattern in ['ch', 'digraph_ch']:
        return ['chip', 'chat', 'chin', 'chop', 'much']
    elif pattern in ['bl', 'blend_bl']:
        return ['blue', 'blow', 'black', 'block', 'blend']
    elif pattern in ['st', 'blend_st']:
        return ['stop', 'step', 'stick', 'star', 'stay']
    
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
            'difficulty_progression': data.get('difficultyProgression', []),
            'team_play': data.get('teamPlay', False),
            'team_scores': data.get('teamScores'),
            'team_names': data.get('teamNames'),
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
        # Compound words with short vowels - 25 total
        {'word': 'hotdog', 'syllableBreakdown': 'hot-dog', 'targetLetter': 'o', 'definition': 'A sausage in a bun', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'sandbox', 'syllableBreakdown': 'sand-box', 'targetLetter': 'a', 'definition': 'Box filled with sand for play', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'catfish', 'syllableBreakdown': 'cat-fish', 'targetLetter': 'a', 'definition': 'A type of fish with whiskers', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'pigpen', 'syllableBreakdown': 'pig-pen', 'targetLetter': 'i', 'definition': 'Where pigs live', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'bedtime', 'syllableBreakdown': 'bed-time', 'targetLetter': 'e', 'definition': 'Time to go to sleep', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'backpack', 'syllableBreakdown': 'back-pack', 'targetLetter': 'a', 'definition': 'Bag worn on your back', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'sunset', 'syllableBreakdown': 'sun-set', 'targetLetter': 'u', 'definition': 'When the sun goes down', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'cupcake', 'syllableBreakdown': 'cup-cake', 'targetLetter': 'u', 'definition': 'Small sweet cake', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'doghouse', 'syllableBreakdown': 'dog-house', 'targetLetter': 'o', 'definition': 'A house for a dog', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'sunhat', 'syllableBreakdown': 'sun-hat', 'targetLetter': 'u', 'definition': 'Hat to protect from sun', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'hotpot', 'syllableBreakdown': 'hot-pot', 'targetLetter': 'o', 'definition': 'A cooking pot that stays hot', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'bathtub', 'syllableBreakdown': 'bath-tub', 'targetLetter': 'a', 'definition': 'Tub for taking a bath', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'laptop', 'syllableBreakdown': 'lap-top', 'targetLetter': 'a', 'definition': 'Portable computer', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'catnap', 'syllableBreakdown': 'cat-nap', 'targetLetter': 'a', 'definition': 'A short sleep', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'hatbox', 'syllableBreakdown': 'hat-box', 'targetLetter': 'a', 'definition': 'Box for storing hats', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'suntan', 'syllableBreakdown': 'sun-tan', 'targetLetter': 'u', 'definition': 'Brown skin from sun', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'dustpan', 'syllableBreakdown': 'dust-pan', 'targetLetter': 'u', 'definition': 'Pan for sweeping dust', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'hotshot', 'syllableBreakdown': 'hot-shot', 'targetLetter': 'o', 'definition': 'Someone very skilled', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'eggshell', 'syllableBreakdown': 'egg-shell', 'targetLetter': 'e', 'definition': 'Shell of an egg', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'fishnet', 'syllableBreakdown': 'fish-net', 'targetLetter': 'i', 'definition': 'Net for catching fish', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'pinball', 'syllableBreakdown': 'pin-ball', 'targetLetter': 'i', 'definition': 'Game with flippers and ball', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'piglet', 'syllableBreakdown': 'pig-let', 'targetLetter': 'i', 'definition': 'A baby pig', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'lipstick', 'syllableBreakdown': 'lip-stick', 'targetLetter': 'i', 'definition': 'Color for lips', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'ragdoll', 'syllableBreakdown': 'rag-doll', 'targetLetter': 'a', 'definition': 'Soft cloth doll', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'anthill', 'syllableBreakdown': 'ant-hill', 'targetLetter': 'a', 'definition': 'Small hill made by ants', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
    ],
    'long_vowels': [
        # Compound words with long vowels - 25 total
        {'word': 'rainbow', 'syllableBreakdown': 'rain-bow', 'targetLetter': 'ai', 'definition': 'Colorful arc in the sky', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ai' makes the name of the letter"},
        {'word': 'seaweed', 'syllableBreakdown': 'sea-weed', 'targetLetter': 'ea', 'definition': 'Plants that grow in ocean', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'beehive', 'syllableBreakdown': 'bee-hive', 'targetLetter': 'ee', 'definition': 'Home where bees live', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'moonlight', 'syllableBreakdown': 'moon-light', 'targetLetter': 'oo', 'definition': 'Light from the moon', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'oo' makes the name of the letter"},
        {'word': 'daytime', 'syllableBreakdown': 'day-time', 'targetLetter': 'ay', 'definition': 'When sun is out', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ay' makes the name of the letter"},
        {'word': 'railroad', 'syllableBreakdown': 'rail-road', 'targetLetter': 'ai', 'definition': 'Train track', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ai' makes the name of the letter"},
        {'word': 'beeline', 'syllableBreakdown': 'bee-line', 'targetLetter': 'ee', 'definition': 'Straight path', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'seashell', 'syllableBreakdown': 'sea-shell', 'targetLetter': 'ea', 'definition': 'Shell from the ocean', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'daybreak', 'syllableBreakdown': 'day-break', 'targetLetter': 'ay', 'definition': 'Time when day begins', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ay' makes the name of the letter"},
        {'word': 'teaspoon', 'syllableBreakdown': 'tea-spoon', 'targetLetter': 'ea', 'definition': 'Small spoon', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'steamboat', 'syllableBreakdown': 'steam-boat', 'targetLetter': 'ea', 'definition': 'Boat powered by steam', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'coastline', 'syllableBreakdown': 'coast-line', 'targetLetter': 'oa', 'definition': 'Edge of the ocean', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'oa' makes the name of the letter"},
        {'word': 'sailboat', 'syllableBreakdown': 'sail-boat', 'targetLetter': 'ai', 'definition': 'Boat with sails', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ai' makes the name of the letter"},
        {'word': 'nighttime', 'syllableBreakdown': 'night-time', 'targetLetter': 'igh', 'definition': 'When it is dark', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'igh' makes the name of the letter"},
        {'word': 'toenail', 'syllableBreakdown': 'toe-nail', 'targetLetter': 'oe', 'definition': 'Nail on your toe', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'oe' makes the name of the letter"},
        {'word': 'raincoat', 'syllableBreakdown': 'rain-coat', 'targetLetter': 'ai', 'definition': 'Coat worn in rain', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ai' makes the name of the letter"},
        {'word': 'speedboat', 'syllableBreakdown': 'speed-boat', 'targetLetter': 'ee', 'definition': 'Fast boat', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'seaplane', 'syllableBreakdown': 'sea-plane', 'targetLetter': 'ea', 'definition': 'Plane that lands on water', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'beefsteak', 'syllableBreakdown': 'beef-steak', 'targetLetter': 'ee', 'definition': 'Cut of beef meat', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'treehouse', 'syllableBreakdown': 'tree-house', 'targetLetter': 'ee', 'definition': 'House built in a tree', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'racetrack', 'syllableBreakdown': 'race-track', 'targetLetter': 'a_e', 'definition': 'Track for racing', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a_e' makes the name of the letter"},
        {'word': 'homemade', 'syllableBreakdown': 'home-made', 'targetLetter': 'o_e', 'definition': 'Made at home', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o_e' makes the name of the letter"},
        {'word': 'teacake', 'syllableBreakdown': 'tea-cake', 'targetLetter': 'ea', 'definition': 'Small sweet cake', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'seashore', 'syllableBreakdown': 'sea-shore', 'targetLetter': 'ea', 'definition': 'Land by the sea', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'boathouse', 'syllableBreakdown': 'boat-house', 'targetLetter': 'oa', 'definition': 'Building for boats', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'oa' makes the name of the letter"},
        {'word': 'highway', 'syllableBreakdown': 'high-way', 'targetLetter': 'igh', 'definition': 'Main road for travel', 'pattern': 'long_i', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'igh' makes the name of the letter"},
        {'word': 'coastline', 'syllableBreakdown': 'coast-line', 'targetLetter': 'oa', 'definition': 'Edge of the ocean', 'pattern': 'long_o', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'oa' makes the name of the letter"},
        {'word': 'steamboat', 'syllableBreakdown': 'steam-boat', 'targetLetter': 'ea', 'definition': 'Boat powered by steam', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'airmail', 'syllableBreakdown': 'air-mail', 'targetLetter': 'ai', 'definition': 'Mail sent by plane', 'pattern': 'long_a', 'patternPosition': 'end', 'phonicsRule': "Long vowel 'ai' makes the name of the letter"},
        {'word': 'payday', 'syllableBreakdown': 'pay-day', 'targetLetter': 'ay', 'definition': 'Day you get paid', 'pattern': 'long_a', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ay' makes the name of the letter"},
        {'word': 'treetop', 'syllableBreakdown': 'tree-top', 'targetLetter': 'ee', 'definition': 'Top of a tree', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'oatmeal', 'syllableBreakdown': 'oat-meal', 'targetLetter': 'oa', 'definition': 'Hot breakfast cereal', 'pattern': 'long_o', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'oa' makes the name of the letter"},
        {'word': 'speedboat', 'syllableBreakdown': 'speed-boat', 'targetLetter': 'ee', 'definition': 'Fast boat', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'racetrack', 'syllableBreakdown': 'race-track', 'targetLetter': 'a_e', 'definition': 'Track for racing', 'pattern': 'long_a', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'a_e' makes the name of the letter"},
        {'word': 'homemade', 'syllableBreakdown': 'home-made', 'targetLetter': 'o_e', 'definition': 'Made at home', 'pattern': 'long_o', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'o_e' makes the name of the letter"},
        {'word': 'teacup', 'syllableBreakdown': 'tea-cup', 'targetLetter': 'ea', 'definition': 'Cup for tea', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'peanut', 'syllableBreakdown': 'pea-nut', 'targetLetter': 'ea', 'definition': 'Type of nut', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'cheesecake', 'syllableBreakdown': 'cheese-cake', 'targetLetter': 'ee', 'definition': 'Sweet dessert', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'toenail', 'syllableBreakdown': 'toe-nail', 'targetLetter': 'oe', 'definition': 'Nail on your toe', 'pattern': 'long_o', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'oe' makes the name of the letter"},
        {'word': 'sidewalk', 'syllableBreakdown': 'side-walk', 'targetLetter': 'i_e', 'definition': 'Path beside the road', 'pattern': 'long_i', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'beefsteak', 'syllableBreakdown': 'beef-steak', 'targetLetter': 'ee', 'definition': 'Cut of beef meat', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'tadpole', 'syllableBreakdown': 'tad-pole', 'targetLetter': 'o_e', 'definition': 'Baby frog', 'pattern': 'long_o', 'patternPosition': 'end', 'phonicsRule': "Long vowel 'o_e' makes the name of the letter"},
        {'word': 'seashore', 'syllableBreakdown': 'sea-shore', 'targetLetter': 'ea', 'definition': 'Land by the sea', 'pattern': 'long_e', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'boathouse', 'syllableBreakdown': 'boat-house', 'targetLetter': 'oa', 'definition': 'Building for boats', 'pattern': 'long_o', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'oa' makes the name of the letter"},
        {'word': 'rosebud', 'syllableBreakdown': 'rose-bud', 'targetLetter': 'o_e', 'definition': 'Flower about to bloom', 'pattern': 'long_o', 'patternPosition': 'beginning', 'phonicsRule': "Long vowel 'o_e' makes the name of the letter"},
    ],
    'blends': [
        # Compound words with blends - 25 total
        {'word': 'playground', 'syllableBreakdown': 'play-ground', 'targetLetter': 'pl', 'definition': 'Place to play outside', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines the 'p' and 'l' sounds"},
        {'word': 'backpack', 'syllableBreakdown': 'back-pack', 'targetLetter': 'ck', 'definition': 'Bag worn on your back', 'pattern': 'ck_blend', 'patternPosition': 'end', 'phonicsRule': "The blend 'ck' combines at word end"},
        {'word': 'flagpole', 'syllableBreakdown': 'flag-pole', 'targetLetter': 'fl', 'definition': 'Pole for flying a flag', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'classroom', 'syllableBreakdown': 'class-room', 'targetLetter': 'cl', 'definition': 'Room for learning', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines the 'c' and 'l' sounds"},
        {'word': 'snowflake', 'syllableBreakdown': 'snow-flake', 'targetLetter': 'fl', 'definition': 'Single piece of snow', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'stopwatch', 'syllableBreakdown': 'stop-watch', 'targetLetter': 'st', 'definition': 'Timer for races', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines the 's' and 't' sounds"},
        {'word': 'frogpond', 'syllableBreakdown': 'frog-pond', 'targetLetter': 'fr', 'definition': 'Pond where frogs live', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines the 'f' and 'r' sounds"},
        {'word': 'grassland', 'syllableBreakdown': 'grass-land', 'targetLetter': 'gr', 'definition': 'Land covered with grass', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'blackboard', 'syllableBreakdown': 'black-board', 'targetLetter': 'bl', 'definition': 'Board for writing with chalk', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines the 'b' and 'l' sounds"},
        {'word': 'grandstand', 'syllableBreakdown': 'grand-stand', 'targetLetter': 'gr', 'definition': 'Large seating area', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'grapevine', 'syllableBreakdown': 'grape-vine', 'targetLetter': 'gr', 'definition': 'Plant that grows grapes', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'starfish', 'syllableBreakdown': 'star-fish', 'targetLetter': 'st', 'definition': 'Star-shaped sea animal', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines the 's' and 't' sounds"},
        {'word': 'bluebell', 'syllableBreakdown': 'blue-bell', 'targetLetter': 'bl', 'definition': 'Blue colored flower', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines the 'b' and 'l' sounds"},
        {'word': 'flatland', 'syllableBreakdown': 'flat-land', 'targetLetter': 'fl', 'definition': 'Land that is flat', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'drawbridge', 'syllableBreakdown': 'draw-bridge', 'targetLetter': 'dr', 'definition': 'Bridge that opens', 'pattern': 'dr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'dr' combines the 'd' and 'r' sounds"},
        {'word': 'clockwork', 'syllableBreakdown': 'clock-work', 'targetLetter': 'cl', 'definition': 'Mechanism of a clock', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines the 'c' and 'l' sounds"},
        {'word': 'spotlight', 'syllableBreakdown': 'spot-light', 'targetLetter': 'sp', 'definition': 'Strong beam of light', 'pattern': 'sp_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sp' combines the 's' and 'p' sounds"},
        {'word': 'greenhouse', 'syllableBreakdown': 'green-house', 'targetLetter': 'gr', 'definition': 'Glass building for plants', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'snapshot', 'syllableBreakdown': 'snap-shot', 'targetLetter': 'sn', 'definition': 'Quick photograph', 'pattern': 'sn_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sn' combines the 's' and 'n' sounds"},
        {'word': 'handspring', 'syllableBreakdown': 'hand-spring', 'targetLetter': 'sp', 'definition': 'Gymnastic move', 'pattern': 'sp_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sp' combines the 's' and 'p' sounds"},
        {'word': 'backyard', 'syllableBreakdown': 'back-yard', 'targetLetter': 'ck', 'definition': 'Yard behind a house', 'pattern': 'ck_blend', 'patternPosition': 'end', 'phonicsRule': "The blend 'ck' combines the 'c' and 'k' sounds"},
        {'word': 'drumstick', 'syllableBreakdown': 'drum-stick', 'targetLetter': 'dr', 'definition': 'Stick for playing drums', 'pattern': 'dr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'dr' combines the 'd' and 'r' sounds"},
        {'word': 'blacksmith', 'syllableBreakdown': 'black-smith', 'targetLetter': 'bl', 'definition': 'Person who works with metal', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines the 'b' and 'l' sounds"},
        {'word': 'blueprint', 'syllableBreakdown': 'blue-print', 'targetLetter': 'bl', 'definition': 'Building plan', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines the 'b' and 'l' sounds"},
        {'word': 'trackside', 'syllableBreakdown': 'track-side', 'targetLetter': 'tr', 'definition': 'Beside the track', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines the 't' and 'r' sounds"},
        {'word': 'scarecrow', 'syllableBreakdown': 'scare-crow', 'targetLetter': 'sc', 'definition': 'Dummy to scare birds', 'pattern': 'sc_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sc' combines the 's' and 'c' sounds"},
        {'word': 'campfire', 'syllableBreakdown': 'camp-fire', 'targetLetter': 'mp', 'definition': 'Fire at a campsite', 'pattern': 'mp_blend', 'patternPosition': 'end', 'phonicsRule': "The blend 'mp' combines the 'm' and 'p' sounds"},
        {'word': 'frostbite', 'syllableBreakdown': 'frost-bite', 'targetLetter': 'fr', 'definition': 'Injury from cold', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines the 'f' and 'r' sounds"},
        {'word': 'clockface', 'syllableBreakdown': 'clock-face', 'targetLetter': 'cl', 'definition': 'Front of a clock', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines the 'c' and 'l' sounds"},
        {'word': 'brickwork', 'syllableBreakdown': 'brick-work', 'targetLetter': 'br', 'definition': 'Work made of bricks', 'pattern': 'br_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'br' combines the 'b' and 'r' sounds"},
        {'word': 'flatbed', 'syllableBreakdown': 'flat-bed', 'targetLetter': 'fl', 'definition': 'Flat truck bed', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'grandchild', 'syllableBreakdown': 'grand-child', 'targetLetter': 'gr', 'definition': 'Child of your child', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'plywood', 'syllableBreakdown': 'ply-wood', 'targetLetter': 'pl', 'definition': 'Thin sheets of wood', 'pattern': 'pl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pl' combines the 'p' and 'l' sounds"},
        {'word': 'traintrack', 'syllableBreakdown': 'train-track', 'targetLetter': 'tr', 'definition': 'Rails for trains', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines the 't' and 'r' sounds"},
        {'word': 'springtime', 'syllableBreakdown': 'spring-time', 'targetLetter': 'sp', 'definition': 'Season of spring', 'pattern': 'sp_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sp' combines the 's' and 'r' sounds"},
        {'word': 'crosswalk', 'syllableBreakdown': 'cross-walk', 'targetLetter': 'cr', 'definition': 'Place to cross street', 'pattern': 'cr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cr' combines the 'c' and 'r' sounds"},
        {'word': 'skateboard', 'syllableBreakdown': 'skate-board', 'targetLetter': 'sk', 'definition': 'Board with wheels', 'pattern': 'sk_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sk' combines the 's' and 'k' sounds"},
        {'word': 'slipknot', 'syllableBreakdown': 'slip-knot', 'targetLetter': 'sl', 'definition': 'Knot that slips', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines the 's' and 'l' sounds"},
        {'word': 'grapevine', 'syllableBreakdown': 'grape-vine', 'targetLetter': 'gr', 'definition': 'Plant that grows grapes', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'flatland', 'syllableBreakdown': 'flat-land', 'targetLetter': 'fl', 'definition': 'Land that is flat', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'snapshot', 'syllableBreakdown': 'snap-shot', 'targetLetter': 'sn', 'definition': 'Quick photo', 'pattern': 'sn_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sn' combines the 's' and 'n' sounds"},
        {'word': 'drawbridge', 'syllableBreakdown': 'draw-bridge', 'targetLetter': 'dr', 'definition': 'Bridge that lifts up', 'pattern': 'dr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'dr' combines the 'd' and 'r' sounds"},
        {'word': 'cropland', 'syllableBreakdown': 'crop-land', 'targetLetter': 'cr', 'definition': 'Land for growing crops', 'pattern': 'cr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cr' combines the 'c' and 'r' sounds"},
        {'word': 'smokestack', 'syllableBreakdown': 'smoke-stack', 'targetLetter': 'sm', 'definition': 'Tall chimney', 'pattern': 'sm_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sm' combines the 's' and 'm' sounds"},
        {'word': 'sweatshirt', 'syllableBreakdown': 'sweat-shirt', 'targetLetter': 'sw', 'definition': 'Warm shirt', 'pattern': 'sw_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sw' combines the 's' and 'w' sounds"},
        {'word': 'pricetag', 'syllableBreakdown': 'price-tag', 'targetLetter': 'pr', 'definition': 'Tag showing price', 'pattern': 'pr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'pr' combines the 'p' and 'r' sounds"},
    ],
    'digraphs': [
        # Compound words with digraphs - 25 total
        {'word': 'seashell', 'syllableBreakdown': 'sea-shell', 'targetLetter': 'sh', 'definition': 'Shell found by the ocean', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'toothbrush', 'syllableBreakdown': 'tooth-brush', 'targetLetter': 'th', 'definition': 'Brush for teeth', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'fishpond', 'syllableBreakdown': 'fish-pond', 'targetLetter': 'sh', 'definition': 'Pond for keeping fish', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'shopfront', 'syllableBreakdown': 'shop-front', 'targetLetter': 'sh', 'definition': 'Front of a shop', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'pathway', 'syllableBreakdown': 'path-way', 'targetLetter': 'th', 'definition': 'Way or path to walk', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'shipyard', 'syllableBreakdown': 'ship-yard', 'targetLetter': 'sh', 'definition': 'Place where ships are built', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'checkmark', 'syllableBreakdown': 'check-mark', 'targetLetter': 'ch', 'definition': 'Mark showing something is right', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'thinktank', 'syllableBreakdown': 'think-tank', 'targetLetter': 'th', 'definition': 'Group of thinkers', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'whiteboard', 'syllableBreakdown': 'white-board', 'targetLetter': 'wh', 'definition': 'White board for writing', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes a sound like blowing air"},
        {'word': 'phonebook', 'syllableBreakdown': 'phone-book', 'targetLetter': 'ph', 'definition': 'Book of phone numbers', 'pattern': 'ph_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ph' makes the 'f' sound"},
        {'word': 'shellfish', 'syllableBreakdown': 'shell-fish', 'targetLetter': 'sh', 'definition': 'Sea creature with a shell', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'bathrobe', 'syllableBreakdown': 'bath-robe', 'targetLetter': 'th', 'definition': 'Robe worn after bath', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'matchbox', 'syllableBreakdown': 'match-box', 'targetLetter': 'ch', 'definition': 'Box for matches', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'watchtower', 'syllableBreakdown': 'watch-tower', 'targetLetter': 'ch', 'definition': 'Tower for watching', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'handshake', 'syllableBreakdown': 'hand-shake', 'targetLetter': 'sh', 'definition': 'Greeting with hands', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'fishhook', 'syllableBreakdown': 'fish-hook', 'targetLetter': 'sh', 'definition': 'Hook for catching fish', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'toothpick', 'syllableBreakdown': 'tooth-pick', 'targetLetter': 'th', 'definition': 'Pick for cleaning teeth', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'wishbone', 'syllableBreakdown': 'wish-bone', 'targetLetter': 'sh', 'definition': 'Bone you make a wish on', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'shipwreck', 'syllableBreakdown': 'ship-wreck', 'targetLetter': 'sh', 'definition': 'Destroyed ship', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'bathmat', 'syllableBreakdown': 'bath-mat', 'targetLetter': 'th', 'definition': 'Mat for bathroom floor', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'chalkboard', 'syllableBreakdown': 'chalk-board', 'targetLetter': 'ch', 'definition': 'Board for writing with chalk', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'thumbtack', 'syllableBreakdown': 'thumb-tack', 'targetLetter': 'th', 'definition': 'Pin for bulletin boards', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'sheepdog', 'syllableBreakdown': 'sheep-dog', 'targetLetter': 'sh', 'definition': 'Dog that herds sheep', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'washcloth', 'syllableBreakdown': 'wash-cloth', 'targetLetter': 'sh', 'definition': 'Cloth for washing', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'checkbook', 'syllableBreakdown': 'check-book', 'targetLetter': 'ch', 'definition': 'Book of bank checks', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
    ]
},

'phrases': {
    'short_vowels': [
        # Phrases with short vowels - 25 total
        {'word': 'big red hat', 'syllableBreakdown': 'big red hat', 'targetLetter': 'e', 'definition': 'A large hat that is red', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'hot dog', 'syllableBreakdown': 'hot dog', 'targetLetter': 'o', 'definition': 'A warm pet', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'run fast', 'syllableBreakdown': 'run fast', 'targetLetter': 'u', 'definition': 'To move very quickly', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'sit down', 'syllableBreakdown': 'sit down', 'targetLetter': 'i', 'definition': 'To take a seat', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'big dog', 'syllableBreakdown': 'big dog', 'targetLetter': 'i', 'definition': 'A large pet dog', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'bad cat', 'syllableBreakdown': 'bad cat', 'targetLetter': 'a', 'definition': 'A naughty cat', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'red box', 'syllableBreakdown': 'red box', 'targetLetter': 'e', 'definition': 'A box that is red', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'fat pig', 'syllableBreakdown': 'fat pig', 'targetLetter': 'a', 'definition': 'A chubby pig', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'wet pen', 'syllableBreakdown': 'wet pen', 'targetLetter': 'e', 'definition': 'A pen covered with water', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'hot sun', 'syllableBreakdown': 'hot sun', 'targetLetter': 'o', 'definition': 'The warm star in the sky', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'sad man', 'syllableBreakdown': 'sad man', 'targetLetter': 'a', 'definition': 'A man who feels unhappy', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'mad dad', 'syllableBreakdown': 'mad dad', 'targetLetter': 'a', 'definition': 'An angry father', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'tan van', 'syllableBreakdown': 'tan van', 'targetLetter': 'a', 'definition': 'A brown colored van', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'top cop', 'syllableBreakdown': 'top cop', 'targetLetter': 'o', 'definition': 'Best police officer', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'hot pot', 'syllableBreakdown': 'hot pot', 'targetLetter': 'o', 'definition': 'A cooking pot that is hot', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
        {'word': 'big bus', 'syllableBreakdown': 'big bus', 'targetLetter': 'u', 'definition': 'A large vehicle', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'wet hen', 'syllableBreakdown': 'wet hen', 'targetLetter': 'e', 'definition': 'A chicken covered in water', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'quick fox', 'syllableBreakdown': 'quick fox', 'targetLetter': 'i', 'definition': 'A fast fox', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'black cat', 'syllableBreakdown': 'black cat', 'targetLetter': 'a', 'definition': 'A dark colored cat', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'red bed', 'syllableBreakdown': 'red bed', 'targetLetter': 'e', 'definition': 'A bed that is red', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'thin bat', 'syllableBreakdown': 'thin bat', 'targetLetter': 'i', 'definition': 'A skinny bat', 'pattern': 'short_i', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'i' makes the sound like in 'igloo'"},
        {'word': 'jump up', 'syllableBreakdown': 'jump up', 'targetLetter': 'u', 'definition': 'To leap upward', 'pattern': 'short_u', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'u' makes the sound like in 'umbrella'"},
        {'word': 'ten cats', 'syllableBreakdown': 'ten cats', 'targetLetter': 'e', 'definition': 'Number of cats', 'pattern': 'short_e', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'e' makes the sound like in 'egg'"},
        {'word': 'fat rat', 'syllableBreakdown': 'fat rat', 'targetLetter': 'a', 'definition': 'A chubby rat', 'pattern': 'short_a', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'a' makes the sound like in 'apple'"},
        {'word': 'hot sand', 'syllableBreakdown': 'hot sand', 'targetLetter': 'o', 'definition': 'Warm sand at the beach', 'pattern': 'short_o', 'patternPosition': 'middle', 'phonicsRule': "Short vowel 'o' makes the sound like in 'octopus'"},
    ],
    'long_vowels': [
        # Phrases with long vowels - 25 total
        {'word': 'blue sky', 'syllableBreakdown': 'blue sky', 'targetLetter': 'u_e', 'definition': 'Sky that is blue', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u_e' makes the name of the letter"},
        {'word': 'green tree', 'syllableBreakdown': 'green tree', 'targetLetter': 'ee', 'definition': 'Tree with green leaves', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'nice day', 'syllableBreakdown': 'nice day', 'targetLetter': 'i_e', 'definition': 'A pleasant day', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'home base', 'syllableBreakdown': 'home base', 'targetLetter': 'o_e', 'definition': 'Starting point in baseball', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'o_e' makes the name of the letter"},
        {'word': 'cute face', 'syllableBreakdown': 'cute face', 'targetLetter': 'u_e', 'definition': 'A pretty face', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u_e' makes the name of the letter"},
        {'word': 'white snow', 'syllableBreakdown': 'white snow', 'targetLetter': 'i_e', 'definition': 'Snow that is white', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'long road', 'syllableBreakdown': 'long road', 'targetLetter': 'oa', 'definition': 'A road that is long', 'pattern': 'long_o', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'oa' makes the name of the letter"},
        {'word': 'deep sea', 'syllableBreakdown': 'deep sea', 'targetLetter': 'ee', 'definition': 'Ocean that is deep', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'sweet cake', 'syllableBreakdown': 'sweet cake', 'targetLetter': 'ee', 'definition': 'Cake that tastes sweet', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'clean plate', 'syllableBreakdown': 'clean plate', 'targetLetter': 'ea', 'definition': 'Plate that is clean', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'high kite', 'syllableBreakdown': 'high kite', 'targetLetter': 'i_e', 'definition': 'Kite flying up high', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'wide gate', 'syllableBreakdown': 'wide gate', 'targetLetter': 'i_e', 'definition': 'Gate that is wide', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'green bean', 'syllableBreakdown': 'green bean', 'targetLetter': 'ee', 'definition': 'Bean that is green', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'mean queen', 'syllableBreakdown': 'mean queen', 'targetLetter': 'ea', 'definition': 'A queen who is mean', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'sleep deep', 'syllableBreakdown': 'sleep deep', 'targetLetter': 'ee', 'definition': 'To sleep very deeply', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'free time', 'syllableBreakdown': 'free time', 'targetLetter': 'ee', 'definition': 'Time when you are free', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'three bees', 'syllableBreakdown': 'three bees', 'targetLetter': 'ee', 'definition': 'Number of bees', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'bake pie', 'syllableBreakdown': 'bake pie', 'targetLetter': 'a_e', 'definition': 'To make a pie', 'pattern': 'long_a', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'a_e' makes the name of the letter"},
        {'word': 'nice prize', 'syllableBreakdown': 'nice prize', 'targetLetter': 'i_e', 'definition': 'A good prize', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'clean slate', 'syllableBreakdown': 'clean slate', 'targetLetter': 'ea', 'definition': 'A fresh start', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'blue lake', 'syllableBreakdown': 'blue lake', 'targetLetter': 'u_e', 'definition': 'Lake that is blue', 'pattern': 'long_u', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'u_e' makes the name of the letter"},
        {'word': 'bright smile', 'syllableBreakdown': 'bright smile', 'targetLetter': 'i_e', 'definition': 'A big happy smile', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
        {'word': 'sweet treat', 'syllableBreakdown': 'sweet treat', 'targetLetter': 'ee', 'definition': 'A tasty snack', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ee' makes the name of the letter"},
        {'word': 'great day', 'syllableBreakdown': 'great day', 'targetLetter': 'ea', 'definition': 'A wonderful day', 'pattern': 'long_e', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'ea' makes the name of the letter"},
        {'word': 'bike ride', 'syllableBreakdown': 'bike ride', 'targetLetter': 'i_e', 'definition': 'Riding a bicycle', 'pattern': 'long_i', 'patternPosition': 'middle', 'phonicsRule': "Long vowel 'i_e' makes the name of the letter"},
    ],
    'blends': [
        # Phrases with blends - 25 total
        {'word': 'stop sign', 'syllableBreakdown': 'stop sign', 'targetLetter': 'st', 'definition': 'Sign that says stop', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines the 's' and 't' sounds"},
        {'word': 'flag pole', 'syllableBreakdown': 'flag pole', 'targetLetter': 'fl', 'definition': 'Pole for flying a flag', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'drop zone', 'syllableBreakdown': 'drop zone', 'targetLetter': 'dr', 'definition': 'Area for dropping', 'pattern': 'dr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'dr' combines the 'd' and 'r' sounds"},
        {'word': 'swim fast', 'syllableBreakdown': 'swim fast', 'targetLetter': 'sw', 'definition': 'To swim quickly', 'pattern': 'sw_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sw' combines the 's' and 'w' sounds"},
        {'word': 'step up', 'syllableBreakdown': 'step up', 'targetLetter': 'st', 'definition': 'To move upward', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines the 's' and 't' sounds"},
        {'word': 'black flag', 'syllableBreakdown': 'black flag', 'targetLetter': 'bl', 'definition': 'Flag that is black', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines the 'b' and 'l' sounds"},
        {'word': 'green frog', 'syllableBreakdown': 'green frog', 'targetLetter': 'gr', 'definition': 'Frog that is green', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'clean plate', 'syllableBreakdown': 'clean plate', 'targetLetter': 'cl', 'definition': 'Plate that is clean', 'pattern': 'cl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cl' combines the 'c' and 'l' sounds"},
        {'word': 'great plan', 'syllableBreakdown': 'great plan', 'targetLetter': 'gr', 'definition': 'A very good plan', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'strong tree', 'syllableBreakdown': 'strong tree', 'targetLetter': 'str', 'definition': 'Tree that is strong', 'pattern': 'str_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'str' combines three sounds"},
        {'word': 'fresh bread', 'syllableBreakdown': 'fresh bread', 'targetLetter': 'fr', 'definition': 'Bread that is fresh', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines the 'f' and 'r' sounds"},
        {'word': 'bring toys', 'syllableBreakdown': 'bring toys', 'targetLetter': 'br', 'definition': 'To carry toys', 'pattern': 'br_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'br' combines the 'b' and 'r' sounds"},
        {'word': 'flip coin', 'syllableBreakdown': 'flip coin', 'targetLetter': 'fl', 'definition': 'To toss a coin', 'pattern': 'fl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fl' combines the 'f' and 'l' sounds"},
        {'word': 'grill meat', 'syllableBreakdown': 'grill meat', 'targetLetter': 'gr', 'definition': 'To cook meat', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'track star', 'syllableBreakdown': 'track star', 'targetLetter': 'tr', 'definition': 'Star runner', 'pattern': 'tr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'tr' combines the 't' and 'r' sounds"},
        {'word': 'blue crab', 'syllableBreakdown': 'blue crab', 'targetLetter': 'bl', 'definition': 'Crab that is blue', 'pattern': 'bl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'bl' combines the 'b' and 'l' sounds"},
        {'word': 'dress up', 'syllableBreakdown': 'dress up', 'targetLetter': 'dr', 'definition': 'To wear nice clothes', 'pattern': 'dr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'dr' combines the 'd' and 'r' sounds"},
        {'word': 'spill milk', 'syllableBreakdown': 'spill milk', 'targetLetter': 'sp', 'definition': 'To accidentally pour milk', 'pattern': 'sp_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sp' combines the 's' and 'p' sounds"},
        {'word': 'great spot', 'syllableBreakdown': 'great spot', 'targetLetter': 'gr', 'definition': 'A very good place', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'slick trick', 'syllableBreakdown': 'slick trick', 'targetLetter': 'sl', 'definition': 'A clever trick', 'pattern': 'sl_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'sl' combines the 's' and 'l' sounds"},
        {'word': 'grand slam', 'syllableBreakdown': 'grand slam', 'targetLetter': 'gr', 'definition': 'Big baseball hit', 'pattern': 'gr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'gr' combines the 'g' and 'r' sounds"},
        {'word': 'crisp air', 'syllableBreakdown': 'crisp air', 'targetLetter': 'cr', 'definition': 'Fresh cool air', 'pattern': 'cr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'cr' combines the 'c' and 'r' sounds"},
        {'word': 'brown grass', 'syllableBreakdown': 'brown grass', 'targetLetter': 'br', 'definition': 'Grass that is brown', 'pattern': 'br_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'br' combines the 'b' and 'r' sounds"},
        {'word': 'fresh fruit', 'syllableBreakdown': 'fresh fruit', 'targetLetter': 'fr', 'definition': 'Fruit that is fresh', 'pattern': 'fr_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'fr' combines the 'f' and 'r' sounds"},
        {'word': 'steel frame', 'syllableBreakdown': 'steel frame', 'targetLetter': 'st', 'definition': 'Frame made of steel', 'pattern': 'st_blend', 'patternPosition': 'beginning', 'phonicsRule': "The blend 'st' combines the 's' and 't' sounds"},
    ],
    'digraphs': [
        # Phrases with digraphs - 25 total
        {'word': 'fish tank', 'syllableBreakdown': 'fish tank', 'targetLetter': 'sh', 'definition': 'Tank for keeping fish', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'ship sail', 'syllableBreakdown': 'ship sail', 'targetLetter': 'sh', 'definition': 'Sail on a ship', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'thick rope', 'syllableBreakdown': 'thick rope', 'targetLetter': 'th', 'definition': 'Rope that is thick', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'phone call', 'syllableBreakdown': 'phone call', 'targetLetter': 'ph', 'definition': 'Call on the phone', 'pattern': 'ph_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ph' makes the 'f' sound"},
        {'word': 'shop cart', 'syllableBreakdown': 'shop cart', 'targetLetter': 'sh', 'definition': 'Cart for shopping', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'white sheep', 'syllableBreakdown': 'white sheep', 'targetLetter': 'wh', 'definition': 'Sheep that is white', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes a sound like blowing air"},
        {'word': 'fresh cheese', 'syllableBreakdown': 'fresh cheese', 'targetLetter': 'ch', 'definition': 'Cheese that is fresh', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'push chair', 'syllableBreakdown': 'push chair', 'targetLetter': 'sh', 'definition': 'To move a chair', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'bath time', 'syllableBreakdown': 'bath time', 'targetLetter': 'th', 'definition': 'Time for a bath', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'check out', 'syllableBreakdown': 'check out', 'targetLetter': 'ch', 'definition': 'To leave a place', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'sharp knife', 'syllableBreakdown': 'sharp knife', 'targetLetter': 'sh', 'definition': 'Knife that is sharp', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'smooth path', 'syllableBreakdown': 'smooth path', 'targetLetter': 'th', 'definition': 'Path that is smooth', 'pattern': 'th_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'whale song', 'syllableBreakdown': 'whale song', 'targetLetter': 'wh', 'definition': 'Song of a whale', 'pattern': 'wh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'wh' makes a sound like blowing air"},
        {'word': 'phonics game', 'syllableBreakdown': 'phonics game', 'targetLetter': 'ph', 'definition': 'Game about phonics', 'pattern': 'ph_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ph' makes the 'f' sound"},
        {'word': 'three shapes', 'syllableBreakdown': 'three shapes', 'targetLetter': 'th', 'definition': 'Number of shapes', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'thin thread', 'syllableBreakdown': 'thin thread', 'targetLetter': 'th', 'definition': 'Thread that is thin', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
        {'word': 'catch ball', 'syllableBreakdown': 'catch ball', 'targetLetter': 'ch', 'definition': 'To grab a ball', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'wash hands', 'syllableBreakdown': 'wash hands', 'targetLetter': 'sh', 'definition': 'To clean your hands', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'shut door', 'syllableBreakdown': 'shut door', 'targetLetter': 'sh', 'definition': 'To close a door', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'choose one', 'syllableBreakdown': 'choose one', 'targetLetter': 'ch', 'definition': 'To pick one', 'pattern': 'ch_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'brush teeth', 'syllableBreakdown': 'brush teeth', 'targetLetter': 'sh', 'definition': 'To clean your teeth', 'pattern': 'sh_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'teach math', 'syllableBreakdown': 'teach math', 'targetLetter': 'ch', 'definition': 'To instruct in math', 'pattern': 'ch_digraph', 'patternPosition': 'end', 'phonicsRule': "The digraph 'ch' makes one sound like in 'choo-choo'"},
        {'word': 'share lunch', 'syllableBreakdown': 'share lunch', 'targetLetter': 'sh', 'definition': 'To divide lunch', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'short path', 'syllableBreakdown': 'short path', 'targetLetter': 'sh', 'definition': 'Path that is short', 'pattern': 'sh_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'sh' makes one sound like 'shh'"},
        {'word': 'thick book', 'syllableBreakdown': 'thick book', 'targetLetter': 'th', 'definition': 'Book with many pages', 'pattern': 'th_digraph', 'patternPosition': 'beginning', 'phonicsRule': "The digraph 'th' makes one sound"},
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