from sentence_transformers import SentenceTransformer, util
from string import punctuation

MIN_SIMILARITY_THRESHOLD = 0.75
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

def is_similar(term_definition, user_answer):
    term_definition = _sanitize_text(term_definition)
    user_answer = _sanitize_text(user_answer)

    embedding = get_model().encode([term_definition, user_answer], normalize_embeddings=True)
    similarity = util.cos_sim(embedding[0], embedding[1]).item()

    result = similarity >= MIN_SIMILARITY_THRESHOLD

    return result, similarity