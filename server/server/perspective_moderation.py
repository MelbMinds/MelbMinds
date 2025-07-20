import requests
import json
from typing import Dict, Tuple, List
from better_profanity import profanity

class PerspectiveModerator:
    def __init__(self):
        profanity.load_censor_words()

    def analyze_text(self, text: str):
        if not text or not text.strip():
            return {
                'is_toxic': False,
                'toxicity_score': 0.0,
                'attributes': {},
                'error': None
            }
        is_profane = profanity.contains_profanity(text)
        return {
            'is_toxic': is_profane,
            'toxicity_score': 1.0 if is_profane else 0.0,
            'attributes': {'profanity': 1.0 if is_profane else 0.0},
            'error': None
        }

    def validate_user_input(self, field_name: str, value: str):
        return {
            'valid': True,
            'message': '',
            'analysis': None
        }

perspective_moderator = PerspectiveModerator() 