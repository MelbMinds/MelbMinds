import requests
import json
from typing import Dict, Tuple, List

class PerspectiveModerator:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze"
        
        # Define toxicity attributes to check
        self.attributes = {
            'TOXICITY': {},
            'SEVERE_TOXICITY': {},
            'IDENTITY_ATTACK': {},
            'INSULT': {},
            'PROFANITY': {},
            'THREAT': {},
            'SEXUALLY_EXPLICIT': {},
            'FLIRTATION': {},
        }
    
    def analyze_text(self, text: str) -> Dict:
        """
        Analyze text using Perspective API
        
        Returns:
            Dict with analysis results
        """
        if not text or not text.strip():
            return {
                'is_toxic': False,
                'toxicity_score': 0.0,
                'attributes': {},
                'error': None
            }
        
        try:
            payload = {
                'comment': {
                    'text': text
                },
                'languages': ['en'],
                'requestedAttributes': self.attributes
            }
            
            params = {
                'key': self.api_key
            }
            
            response = requests.post(
                self.base_url,
                params=params,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_response(data)
            else:
                return {
                    'is_toxic': False,
                    'toxicity_score': 0.0,
                    'attributes': {},
                    'error': f'API Error: {response.status_code}'
                }
                
        except Exception as e:
            return {
                'is_toxic': False,
                'toxicity_score': 0.0,
                'attributes': {},
                'error': f'Request Error: {str(e)}'
            }
    
    def _parse_response(self, data: Dict) -> Dict:
        """Parse Perspective API response"""
        attributes = data.get('attributeScores', {})
        
        # Get toxicity scores
        toxicity_score = attributes.get('TOXICITY', {}).get('summaryScore', {}).get('value', 0.0)
        severe_toxicity_score = attributes.get('SEVERE_TOXICITY', {}).get('summaryScore', {}).get('value', 0.0)
        identity_attack_score = attributes.get('IDENTITY_ATTACK', {}).get('summaryScore', {}).get('value', 0.0)
        insult_score = attributes.get('INSULT', {}).get('summaryScore', {}).get('value', 0.0)
        profanity_score = attributes.get('PROFANITY', {}).get('summaryScore', {}).get('value', 0.0)
        threat_score = attributes.get('THREAT', {}).get('summaryScore', {}).get('value', 0.0)
        sexually_explicit_score = attributes.get('SEXUALLY_EXPLICIT', {}).get('summaryScore', {}).get('value', 0.0)
        
        # Determine if content is toxic (threshold: 0.7)
        is_toxic = (
            toxicity_score > 0.7 or
            severe_toxicity_score > 0.7 or
            identity_attack_score > 0.7 or
            insult_score > 0.7 or
            profanity_score > 0.7 or
            threat_score > 0.7 or
            sexually_explicit_score > 0.7
        )
        
        return {
            'is_toxic': is_toxic,
            'toxicity_score': toxicity_score,
            'attributes': {
                'toxicity': toxicity_score,
                'severe_toxicity': severe_toxicity_score,
                'identity_attack': identity_attack_score,
                'insult': insult_score,
                'profanity': profanity_score,
                'threat': threat_score,
                'sexually_explicit': sexually_explicit_score,
            },
            'error': None
        }
    
    def validate_user_input(self, field_name: str, value: str) -> Dict:
        """
        Validate user input using Perspective API
        
        Returns:
            Dict with 'valid' (bool), 'message' (str), and 'analysis' (dict)
        """
        if not value or not value.strip():
            return {
                'valid': True,
                'message': '',
                'analysis': None
            }
        
        analysis = self.analyze_text(value)
        
        if analysis['error']:
            # If API fails, allow the content but log the error
            print(f"Perspective API Error: {analysis['error']}")
            return {
                'valid': True,
                'message': '',
                'analysis': analysis
            }
        
        if analysis['is_toxic']:
            # Get the highest scoring attribute for the error message
            attributes = analysis['attributes']
            highest_attr = max(attributes.items(), key=lambda x: x[1])
            
            return {
                'valid': False,
                'message': f'Your {field_name} contains inappropriate content. Please revise your message.',
                'analysis': analysis,
                'highest_attribute': highest_attr[0],
                'score': highest_attr[1]
            }
        
        return {
            'valid': True,
            'message': '',
            'analysis': analysis
        }

# Initialize with your API key
perspective_moderator = PerspectiveModerator("AIzaSyCYq7pr8f8Sb1gy1h7JQDdJL4VwDLsE8-k") 