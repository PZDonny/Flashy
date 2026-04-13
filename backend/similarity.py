from sentence_transformers import SentenceTransformer, util
from rapidfuzz import fuzz
from string import punctuation

MIN_CORRECT_SEMANTIC_SIMILARITY_THRESHOLD = 0.75
MIN_CLOSE_SEMANTIC_SIMILARITY_THRESHOLD = 0.60
MIN_CORRECT_STRING_SIMILARITY_THRESHOLD = 0.90
MIN_CLOSE_TYPO_SPELLING_THRESHOLD = 0.80
MIN_CLOSE_TYPO_MEANING_THRESHOLD = 0.7
_model = None


def get_model():
    global _model
    if _model is None:
        print("Loading SentenceTransformers model...")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def _sanitize_text(text):
        text = text.lower()
        text = text.translate(str.maketrans('', '', punctuation))
        return text.strip()

def is_semantic(term_definition, user_answer):
    """
    For checking semantic (meaning) similarity between the user input and a definition
    """
    term_definition = _sanitize_text(term_definition)
    user_answer = _sanitize_text(user_answer)

    #Check exact match first
    if term_definition == user_answer:
        return ("Correct. 100.00% Accuracy", 1.0, "correct")

    #Scores
    typo_score = fuzz.ratio(user_answer, term_definition) / 100    
    embedding = get_model().encode([term_definition, user_answer], normalize_embeddings=True)
    semantic_score = util.cos_sim(embedding[0], embedding[1]).item()

    #Correct (Typo Checked)
    if typo_score >= MIN_CORRECT_STRING_SIMILARITY_THRESHOLD:
        return (f"Correct. {typo_score*100:.2f}% Accuracy", typo_score, "correct")

    #Correct (Semantic Checked)
    if semantic_score >= MIN_CORRECT_SEMANTIC_SIMILARITY_THRESHOLD and typo_score >= MIN_CLOSE_TYPO_MEANING_THRESHOLD:
        return (f"Correct. {semantic_score*100:.2f}% Accuracy", semantic_score, "correct")


    score = max(typo_score, semantic_score)
    #Close
    if typo_score >= MIN_CLOSE_TYPO_MEANING_THRESHOLD or semantic_score >= MIN_CLOSE_SEMANTIC_SIMILARITY_THRESHOLD:
        return (f"Close. {score*100:.2f}% Accuracy", score, "close")

    #Incorrect
    return (f"Incorrect. {score*100:.2f}% Accuracy", score, "incorrect")

def is_string(term_definition, user_answer):
    """
    For exact comparisons of user input and a definition. Lenient against typos.
    """

    #Sanitized and lowercase for leniency
    term_definition = _sanitize_text(term_definition)
    user_answer = _sanitize_text(user_answer)
    is_match = term_definition.strip().lower() == user_answer.strip().lower()

    if is_match:
        result_label = 'Correct'
        result_class = 'correct'
        score = 1.0
    else:
        score = fuzz.ratio(user_answer, term_definition)
        if score >= MIN_CLOSE_TYPO_SPELLING_THRESHOLD:
            result_label = f'Close. {score:.2f}% Accuracy'
            result_class = 'close' 
        else:
            result_label = 'Incorrect'
            result_class = 'incorrect' 
    return (result_label, score, result_class)