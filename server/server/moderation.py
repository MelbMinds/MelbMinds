import re
from typing import List, Tuple, Dict

class ContentModerator:
    def __init__(self):
        # Comprehensive list of offensive words, slurs, and hate speech
        self.offensive_words = {
            # Racial slurs and hate speech
            'nigger', 'nigga', 'faggot', 'fag', 'dyke', 'kike', 'spic', 'chink', 'gook', 'wop', 'dago',
            'kraut', 'haji', 'raghead', 'towelhead', 'sandnigger', 'mudshark', 'junglebunny', 'porchmonkey',
            'coon', 'jigaboo', 'spook', 'spearchucker', 'zipperhead', 'slanteye', 'gook', 'chink',
            'wetback', 'beaner', 'spic', 'greaser', 'dago', 'wop', 'guinea', 'kraut', 'haji',
            'raghead', 'towelhead', 'sandnigger', 'cameljockey', 'sandnigger', 'mudshark',
            
            # General offensive terms
            'bitch', 'whore', 'slut', 'cunt', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'asshole',
            'motherfucker', 'fuck', 'shit', 'damn', 'bastard', 'sonofabitch', 'fucker', 'shithead',
            'dumbass', 'dumbfuck', 'stupid', 'idiot', 'retard', 'retarded', 'moron', 'imbecile',
            
            # Hate speech and discriminatory terms
            'nazi', 'hitler', 'white power', 'black power', 'supremacist', 'racist', 'bigot',
            'homophobe', 'transphobe', 'misogynist', 'sexist', 'antisemitic', 'islamophobe',
            
            # Violence and threats
            'kill', 'murder', 'death', 'suicide', 'bomb', 'terrorist', 'terrorism', 'bombing',
            'shoot', 'shooting', 'gun', 'weapon', 'violence', 'attack', 'assault', 'rape',
            
            # Drug-related (excluding medical terms)
            'cocaine', 'heroin', 'meth', 'crack', 'weed', 'marijuana', 'drugs', 'drug',
            'overdose', 'addict', 'junkie', 'druggie',
        }
        
        # Common variations and leetspeak
        self.leet_speak_map = {
            'a': ['@', '4', 'α'],
            'e': ['3', 'ε'],
            'i': ['1', '!', '|'],
            'o': ['0', 'θ'],
            's': ['$', '5'],
            't': ['7', '+'],
            'b': ['8', 'β'],
            'g': ['9', '6'],
            'l': ['1', '|'],
            'z': ['2'],
        }
        
        # Build regex patterns for detection
        self._build_patterns()
    
    def _build_patterns(self):
        """Build regex patterns for offensive word detection"""
        patterns = []
        
        for word in self.offensive_words:
            # Create variations with leetspeak
            word_variations = [word]
            
            # Add leetspeak variations
            for char, replacements in self.leet_speak_map.items():
                if char in word:
                    for replacement in replacements:
                        word_variations.append(word.replace(char, replacement))
            
            # Add common misspellings and variations
            word_variations.extend([
                word.replace('a', '@'),
                word.replace('e', '3'),
                word.replace('i', '1'),
                word.replace('o', '0'),
                word.replace('s', '$'),
                word.replace('t', '7'),
            ])
            
            # Create regex pattern for each variation
            for variation in set(word_variations):  # Remove duplicates
                # Match word boundaries and common separators
                pattern = r'\b' + re.escape(variation) + r'\b'
                patterns.append(pattern)
        
        self.offensive_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    
    def contains_offensive_content(self, text: str) -> Tuple[bool, List[str]]:
        """
        Check if text contains offensive content
        
        Returns:
            Tuple of (is_offensive, list_of_found_words)
        """
        if not text:
            return False, []
        
        text_lower = text.lower()
        found_words = []
        
        # Check against offensive patterns
        for pattern in self.offensive_patterns:
            matches = pattern.findall(text_lower)
            if matches:
                found_words.extend(matches)
        
        # Additional checks for common circumvention techniques
        # Check for words with extra characters (e.g., "f*u*c*k")
        for word in self.offensive_words:
            # Pattern to match word with optional characters between letters
            pattern = r'\b' + r'\w*'.join(word) + r'\b'
            if re.search(pattern, text_lower, re.IGNORECASE):
                found_words.append(word)
        
        # Check for repeated characters (e.g., "fuuuuck")
        for word in self.offensive_words:
            pattern = r'\b' + re.escape(word[0]) + r'+' + re.escape(word[1:]) + r'\b'
            if re.search(pattern, text_lower, re.IGNORECASE):
                found_words.append(word)
        
        return len(found_words) > 0, list(set(found_words))
    
    def sanitize_text(self, text: str) -> str:
        """
        Replace offensive words with asterisks
        
        Returns:
            Sanitized text with offensive words replaced by asterisks
        """
        if not text:
            return text
        
        sanitized_text = text
        
        for pattern in self.offensive_patterns:
            sanitized_text = pattern.sub('*' * 8, sanitized_text)
        
        return sanitized_text
    
    def validate_user_input(self, field_name: str, value: str) -> Dict[str, any]:
        """
        Validate user input for moderation
        
        Returns:
            Dict with 'valid' (bool), 'message' (str), and 'sanitized_value' (str)
        """
        if not value:
            return {
                'valid': True,
                'message': '',
                'sanitized_value': value
            }
        
        is_offensive, found_words = self.contains_offensive_content(value)
        
        if is_offensive:
            return {
                'valid': False,
                'message': f'Your {field_name} contains inappropriate language. Please revise your content.',
                'sanitized_value': self.sanitize_text(value),
                'found_words': found_words
            }
        
        return {
            'valid': True,
            'message': '',
            'sanitized_value': value
        }

# Global moderator instance
moderator = ContentModerator() 