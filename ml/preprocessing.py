"""
PulseSentiment Text Preprocessing Module
Conservative, sentiment-aware NLP cleaner for Twitter/X posts.
"""

import re
import html
from typing import List, Union
import unicodedata

# Common English contraction mappings to ensure negations and intent are preserved
CONTRACTION_MAP = {
    "can't": "can not",
    "cannot": "can not",
    "won't": "will not",
    "shan't": "shall not",
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'d": " would",
    "'ll": " will",
    "'ve": " have",
    "'m": " am",
    "ain't": "is not",
    "aren't": "are not",
    "couldn't": "could not",
    "didn't": "did not",
    "doesn't": "does not",
    "don't": "do not",
    "hadn't": "had not",
    "hasn't": "has not",
    "haven't": "have not",
    "isn't": "is not",
    "mightn't": "might not",
    "mustn't": "must not",
    "needn't": "need not",
    "shouldn't": "should not",
    "wasn't": "was not",
    "weren't": "were not",
    "wouldn't": "would not",
}

# Standard English stopwords excluding sentiment-critical words like negations
PRESERVED_SENTIMENT_WORDS = {
    "not", "no", "nor", "neither", "never", "none", "hardly", "barely",
    "scarcely", "without", "against", "very", "too", "more", "most", "but", "however"
}

def get_sentiment_stopwords() -> List[str]:
    """
    Returns standard English stopwords excluding sentiment-bearing words.
    Prevents common prepositions and neutral pronouns from distorting sentiment weights.
    """
    neutral_stops = [
        "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are", 
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", 
        "by", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
        "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", 
        "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", 
        "me", "my", "myself", "of", "off", "on", "once", "only", "or", "other", 
        "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", 
        "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", 
        "then", "there", "these", "they", "this", "those", "through", "to", "under", 
        "until", "up", "was", "we", "were", "what", "when", "where", "which", "while", 
        "who", "whom", "why", "will", "with", "you", "your", "yours", "yourself", "yourselves"
    ]
    return [w for w in neutral_stops if w not in PRESERVED_SENTIMENT_WORDS]

# Emoticon sentiment hints preserved as tokens
EMOTICON_MAP = {
    ":-)": " emoticon_positive ",
    ":)": " emoticon_positive ",
    ":D": " emoticon_positive ",
    ":-D": " emoticon_positive ",
    ";)": " emoticon_positive ",
    ";-)": " emoticon_positive ",
    "<3": " emoticon_positive ",
    ":-(": " emoticon_negative ",
    ":(": " emoticon_negative ",
    ":'(": " emoticon_negative ",
    ":/": " emoticon_negative ",
    ":-/": " emoticon_negative ",
    ">:(": " emoticon_negative ",
    "D:": " emoticon_negative ",
}

NEGATION_WORDS = {"not", "no", "never", "neither", "without"}
NEGATION_SCOPE_BOUNDARIES = {"but", "however"}


def expand_contractions(text: str) -> str:
    """Expands contractions while keeping negations explicit."""
    for contraction, expansion in CONTRACTION_MAP.items():
        # Match word boundaries or apostrophe patterns
        text = re.sub(re.escape(contraction), expansion, text, flags=re.IGNORECASE)
    return text


def clean_tweet_text(text: Union[str, float, None]) -> str:
    """
    Cleans a tweet string conservatively:
    - Decodes HTML entities (e.g. &amp; -> &)
    - Replaces URLs with a neutral token or removes them
    - Strips user mentions (@user) to prevent overfitting to specific handles
    - Extracts meaningful text from hashtags (#amazing -> amazing)
    - Preserves emoticons as semantic tokens
    - Normalizes elongated letters (e.g., 'sooooo good' -> 'soo good')
    - Preserves crucial punctuation for sentiment context while normalizing whitespace
    """
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)

    # 1. Unescape HTML entities
    text = html.unescape(text)

    # 2. Normalize unicode (accents, characters)
    text = unicodedata.normalize("NFKD", text)

    # 3. Handle known emoticons before lowering and stripping punctuation
    for emo, token in EMOTICON_MAP.items():
        text = text.replace(emo, token)

    # 4. Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # 5. Remove user mentions (@username)
    text = re.sub(r"@\w+", " ", text)

    # 6. Process hashtags: turn #love into love, #NeverAgain into never again
    # Separate camelCase hashtags (e.g., #BestDayEver -> Best Day Ever)
    def unpack_hashtag(match):
        tag = match.group(1)
        # Split camel case:
        split_words = re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\b)', tag)
        if split_words:
            return " " + " ".join(split_words) + " "
        return " " + tag + " "

    text = re.sub(r"#(\w+)", unpack_hashtag, text)

    # 7. Expand contractions
    text = expand_contractions(text)

    # 8. Convert to lowercase
    text = text.lower()

    # 9. Normalize elongated repeated characters (e.g. 'loooove' -> 'loove', max 2 repeats)
    text = re.sub(r"(.)\1{2,}", r"\1\1", text)

    # 10. Replace non-alphanumeric characters (keep words, numbers, and basic token spacing)
    text = re.sub(r"[^a-z0-9_\s]", " ", text)

    # 11. Normalize extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def extract_negated_terms(text: str) -> str:
    """Return normalized words within a short negation scope as explicit features."""
    tokens = clean_tweet_text(text).split()
    negated_terms = []
    for index, token in enumerate(tokens):
        if token not in NEGATION_WORDS:
            continue
        for following_token in tokens[index + 1:index + 4]:
            if following_token in NEGATION_SCOPE_BOUNDARIES:
                break
            negated_terms.append(f"negated_{following_token}")
    return " ".join(negated_terms)


def preprocess_corpus(texts: List[str]) -> List[str]:
    """Applies clean_tweet_text to a batch/list of texts."""
    return [clean_tweet_text(t) for t in texts]
