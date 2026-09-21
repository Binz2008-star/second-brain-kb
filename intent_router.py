"""Pure language / emotional-intent detection for the Second Brain API.

This module deliberately has **no third-party imports**. It holds the
deterministic part of the intent router so it can be imported and tested
without FastAPI, a database, or a model server. The FastAPI dependency that
wraps it (``detect_intent``) stays in ``api.py``, where the Request object
lives.
"""

ARABIC_UNICODE_MIN = 0x0600
ARABIC_UNICODE_MAX = 0x06FF

EMOTION_KEYWORDS = {
    "urgency": [
        "asap", "urgent", "immediately", "hurry", "quick", "now",
        "عاجل", "فورا", "بسرعة", "ضروري", "مستعجل",
    ],
    "frustration": [
        "annoying", "frustrated", "frustrating", "stupid", "broken",
        "not working", "fix this", "worst", "hate",
        "مزعج", "سيء", "معطل", "خاطئ", "غاضب", "منزعج", "لا يعمل",
    ],
    "satisfaction": [
        "great", "awesome", "excellent", "perfect", "wonderful", "love it",
        "ممتاز", "رائع", "مثالي", "أحسنت",
    ],
    "confusion": [
        "confused", "unclear", "not sure", "what do you mean", "huh",
        "مش فاهم", "غير واضح", "لا أفهم", "مش واضح",
    ],
}

DEFAULT_EMOTION = "neutral"

INTENT_BODY_KEYS = ("query", "message", "task")


def detect_lang(text: str) -> str:
    """Return 'ar' if any Arabic Unicode character is present, else 'en'."""
    for ch in text:
        if ARABIC_UNICODE_MIN <= ord(ch) <= ARABIC_UNICODE_MAX:
            return "ar"
    return "en"


def detect_emotion(text: str) -> str:
    """Scan lowercased text for common emotional indicator keywords."""
    lowered = text.lower()
    for emotion, keywords in EMOTION_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return emotion
    return DEFAULT_EMOTION


def extract_intent_text(body: object) -> str:
    """Pick the first non-empty string under a known key of a JSON body."""
    if not isinstance(body, dict):
        return ""
    for key in INTENT_BODY_KEYS:
        value = body.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return ""
