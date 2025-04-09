# test_openai.py
import os
from openai import OpenAI



client = OpenAI(api_key=api_key)

try:
    print("Attempting to call OpenAI API...")
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are an educational assistant."},
            {"role": "user", "content": "Generate 3 simple words for syllabification practice."}
        ]
    )
    print("API call successful!")
    print(completion.choices[0].message.content)
except Exception as e:
    print(f"Error calling OpenAI API: {str(e)}")