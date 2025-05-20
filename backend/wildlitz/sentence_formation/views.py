# sentence_formation/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import openai
from django.conf import settings

# Configure OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY

@csrf_exempt
@require_http_methods(["POST"])
def generate_crossword_clues(request):
    """
    Generate age-appropriate clues for a list of words using OpenAI GPT
    
    Expects JSON with:
    - words: list of words to generate clues for
    - theme: theme of the crossword/story
    - grade_level: target grade level
    """
    try:
        data = json.loads(request.body)
        words = data.get('words', [])
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        story_context = data.get('story_context', '')
        
        if not words:
            return JsonResponse({
                'error': 'No words provided'
            }, status=400)
        
        # Set up the prompt for GPT
        prompt = f"""
        Create age-appropriate clues for a {grade_level}rd grade crossword puzzle with a {theme} theme.
        
        For each word in this list, create a brief, clear clue that would help students guess the word:
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
            # Fallback: Create basic clues
            clues = {word: f"A {theme} word with {len(word)} letters" for word in words}
            
        return JsonResponse({
            'clues': clues
        })
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
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
        data = json.loads(request.body)
        correct_answer = data.get('correct_answer', '')
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        num_choices = data.get('num_choices', 3)
        
        if not correct_answer:
            return JsonResponse({
                'error': 'No correct_answer provided'
            }, status=400)
        
        # Set up the prompt for GPT
        prompt = f"""
        For a {grade_level}rd grade crossword puzzle with a {theme} theme, 
        generate {num_choices} plausible but incorrect answer choices for the word "{correct_answer}".
        
        The wrong answers should:
        1. Be the same length or very close to the same length as "{correct_answer}"
        2. Be real, age-appropriate words that students might know
        3. Be related to the theme or word meaning when possible
        4. Be distinct from each other and from the correct answer
        
        Format your response as a JSON array of strings containing only the wrong answers.
        Example: ["RIVER", "LAKES", "SHORE"]
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
            # Fallback: Create basic wrong answers by changing letters
            import random
            import string
            
            wrong_answers = []
            for _ in range(num_choices):
                wrong = list(correct_answer)
                # Change 1-2 characters
                for _ in range(random.randint(1, 2)):
                    pos = random.randint(0, len(wrong) - 1)
                    wrong[pos] = random.choice(string.ascii_uppercase)
                wrong_answer = ''.join(wrong)
                if wrong_answer != correct_answer and wrong_answer not in wrong_answers:
                    wrong_answers.append(wrong_answer)
        
        # Include the correct answer in the shuffled array
        all_choices = [correct_answer] + wrong_answers
        random.shuffle(all_choices)
        
        return JsonResponse({
            'choices': all_choices,
            'correct_answer': correct_answer
        })
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def generate_crossword_content(request):
    """
    Generate both clues and answer choices in a single request
    
    Expects JSON with:
    - words: list of words to generate content for
    - theme: theme of the crossword/story
    - grade_level: target grade level
    - story_context: text of the story for context
    """
    try:
        data = json.loads(request.body)
        words = data.get('words', [])
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        story_context = data.get('story_context', '')
        
        if not words:
            return JsonResponse({
                'error': 'No words provided'
            }, status=400)
        
        # Generate clues for all words
        clues_prompt = f"""
        Create age-appropriate clues for a {grade_level}rd grade crossword puzzle with a {theme} theme.
        
        For each word in this list, create a brief, clear clue that would help students guess the word:
        {', '.join(words)}
        
        Story context for reference:
        {story_context}
        
        Format your response as a JSON object where the keys are the words and the values are the clues.
        Example: {{"ocean": "Vast body of salt water that covers most of Earth", "shell": "Hard protective covering of sea creatures"}}
        """
        
        clues_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                {"role": "user", "content": clues_prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        clues_content = clues_response.choices[0].message.content
        
        # Parse clues
        try:
            import re
            clues_match = re.search(r'{[\s\S]*}', clues_content)
            if clues_match:
                clues = json.loads(clues_match.group(0))
            else:
                clues = json.loads(clues_content)
        except json.JSONDecodeError:
            # Fallback for clues
            clues = {word: f"A {theme} word with {len(word)} letters" for word in words}
        
        # Generate answer choices for each word
        choices = {}
        for word in words:
            try:
                # For each word, generate 3 wrong answers
                choices_prompt = f"""
                For a {grade_level}rd grade crossword puzzle with a {theme} theme, 
                generate 3 plausible but incorrect answer choices for the word "{word}".
                
                The wrong answers should:
                1. Be the same length or very close to the same length as "{word}"
                2. Be real, age-appropriate words that students might know
                3. Be related to the theme or word meaning when possible
                4. Be distinct from each other and from the correct answer
                
                Format your response as a JSON array of strings containing only the wrong answers.
                Example: ["RIVER", "LAKES", "SHORE"]
                """
                
                choices_response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                        {"role": "user", "content": choices_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=400
                )
                
                choices_content = choices_response.choices[0].message.content
                
                # Parse wrong answers
                import re
                choices_match = re.search(r'\[[\s\S]*\]', choices_content)
                if choices_match:
                    wrong_answers = json.loads(choices_match.group(0))
                else:
                    wrong_answers = json.loads(choices_content)
                
                # Shuffle and store
                import random
                all_choices = [word] + wrong_answers
                random.shuffle(all_choices)
                choices[word] = all_choices
                
            except Exception as word_error:
                # Fallback for this word
                import random
                import string
                
                # Create simple wrong answers
                wrong_answers = []
                for _ in range(3):
                    wrong = list(word)
                    # Change 1-2 characters
                    for _ in range(random.randint(1, 2)):
                        pos = random.randint(0, len(wrong) - 1)
                        wrong[pos] = random.choice(string.ascii_uppercase)
                    wrong_answer = ''.join(wrong)
                    if wrong_answer != word and wrong_answer not in wrong_answers:
                        wrong_answers.append(wrong_answer)
                
                # Add to choices
                all_choices = [word] + wrong_answers
                random.shuffle(all_choices)
                choices[word] = all_choices
        
        return JsonResponse({
            'clues': clues,
            'choices': choices
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)