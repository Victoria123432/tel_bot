"""
Loads the trained spaCy model (with TextCategorizer) and exposes
the analyze() function used by the FastAPI app.
"""

from pathlib import Path
import spacy

_MODEL_PATH = Path(__file__).parent / "trained_model"

_nlp = None


def _load():
    global _nlp
    print(f"[NLP] Loading trained model from {_MODEL_PATH}")
    _nlp = spacy.load(_MODEL_PATH)


def _get_nlp():
    if _nlp is None:
        _load()
    return _nlp


_CITY_LABELS = {"LOC", "GPE", "FACILITY"}


def analyze(text: str) -> dict:
    """
    Analyze a user message and return intent, city, and all NER entities.

    Returns:
      {
        "intent":   "WEATHER" | "CURRENCY" | "GREETING" | "OTHER",
        "city":     str | None,
        "entities": [{"text": str, "label": str}, ...]
      }
    """
    nlp = _get_nlp()
    doc = nlp(text)

    # Intent from TextCategorizer
    intent = "OTHER"
    if doc.cats:
        intent = max(doc.cats, key=lambda k: doc.cats[k])

    # Named Entity Recognition
    entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]

    # Extract first city-like entity
    city = None
    for ent in doc.ents:
        if ent.label_ in _CITY_LABELS:
            city = ent.text
            break

    return {
        "intent":   intent,
        "city":     city,
        "entities": entities,
    }
