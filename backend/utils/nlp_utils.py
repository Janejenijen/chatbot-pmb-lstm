import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

# Initialize Sastrawi stemmer
factory = StemmerFactory()
stemmer = factory.create_stemmer()

def clean_text(text: str) -> str:
    """
    Remove special characters, numbers, and extra spaces.
    Converts to lowercase.
    """
    # Convert to lowercase
    text = text.lower()
    # Remove special characters and numbers, keep only letters and spaces
    text = re.sub(r'[^a-z\s]', ' ', text)
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

def stem_text(text: str) -> str:
    """
    Reduce words to their root form using Sastrawi.
    """
    return stemmer.stem(text)

def preprocess_text(text: str) -> str:
    """
    Full preprocessing pipeline: Clean -> Stem.
    """
    cleaned = clean_text(text)
    stemmed = stem_text(cleaned)
    return stemmed
