import re

def clean_text(text: str) -> str:
    """
    Clean text for chatbot intent classification.
    - Lowercase
    - Remove special characters
    - Keep words & spaces
    """
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = ' '.join(text.split())
    return text

def preprocess_text(text: str) -> str:
    """
    Final preprocessing pipeline for chatbot.
    """
    return clean_text(text)
