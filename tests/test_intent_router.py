"""Unit tests for the deterministic half of the language/emotion intent router.

These are the first automated tests in this repository. They import
``intent_router`` only, which has no third-party dependencies, so the suite
runs without a database, a model server, or the FastAPI stack.
"""

import pytest

from intent_router import (
    DEFAULT_EMOTION,
    EMOTION_KEYWORDS,
    detect_emotion,
    detect_lang,
    extract_intent_text,
)


# --- detect_lang -----------------------------------------------------------

@pytest.mark.parametrize(
    "text, expected",
    [
        ("hello world", "en"),
        ("", "en"),
        ("مرحبا", "ar"),
        ("أين ملف الإعدادات؟", "ar"),
        ("deploy الخدمة now", "ar"),          # one Arabic character is enough
        ("1234 !@#$", "en"),
        ("naïve café", "en"),                  # Latin-1 accents are not Arabic
    ],
)
def test_detect_lang(text, expected):
    assert detect_lang(text) == expected


def test_detect_lang_ignores_arabic_presentation_forms():
    """Only U+0600..U+06FF is treated as Arabic.

    This pins the documented range rather than 'any Arabic-looking script'.
    U+FB50.. (Arabic Presentation Forms-A) falls outside it, so text made only
    of those characters is reported as English. Change this test deliberately
    if the range is widened.
    """
    assert detect_lang("ﭐﭑ") == "en"


# --- detect_emotion --------------------------------------------------------

@pytest.mark.parametrize(
    "text, expected",
    [
        ("please deploy this asap", "urgency"),
        ("هذا عاجل جدا", "urgency"),
        ("this is so frustrating", "frustration"),
        ("لا يعمل عندي", "frustration"),
        ("that is excellent, thank you", "satisfaction"),
        ("العمل ممتاز", "satisfaction"),
        ("I am confused by this output", "confusion"),
        ("غير واضح", "confusion"),
        ("list the open pull requests", DEFAULT_EMOTION),
        ("", DEFAULT_EMOTION),
    ],
)
def test_detect_emotion(text, expected):
    assert detect_emotion(text) == expected


def test_detect_emotion_is_case_insensitive():
    assert detect_emotion("URGENT") == "urgency"
    assert detect_emotion("Broken") == "frustration"


def test_every_configured_keyword_is_reachable():
    """No keyword may be shadowed into unreachability by an earlier bucket.

    ``detect_emotion`` returns the first bucket with a match, in dict order. A
    keyword that is a substring of some earlier bucket's keyword can never be
    the answer. Without this check, adding such a keyword would look like it
    worked while changing nothing.
    """
    unreachable = [
        (emotion, kw)
        for emotion, keywords in EMOTION_KEYWORDS.items()
        for kw in keywords
        if detect_emotion(kw) != emotion
    ]
    assert unreachable == [], (
        "these keywords can never be returned, because an earlier bucket "
        f"matches them first: {unreachable}"
    )


@pytest.mark.xfail(
    strict=True,
    reason=(
        "KNOWN DEFECT: emotion keywords are matched as bare substrings, so the "
        "urgency keyword 'now' fires inside ordinary words such as 'know' and "
        "'nowhere'. Fixing it (word-boundary matching) is a production "
        "behaviour change and is deliberately not part of this test-only "
        "change. strict=True means this test fails if the defect is fixed "
        "without removing the marker."
    ),
)
@pytest.mark.parametrize(
    "text",
    ["I do not know what to do", "nowhere to go", "acknowledge the request"],
)
def test_emotion_keywords_respect_word_boundaries(text):
    assert detect_emotion(text) == DEFAULT_EMOTION


# --- extract_intent_text ---------------------------------------------------

@pytest.mark.parametrize(
    "body, expected",
    [
        ({"query": "find the docs"}, "find the docs"),
        ({"message": "hi"}, "hi"),
        ({"task": "run the suite"}, "run the suite"),
        ({"query": "first", "message": "second"}, "first"),   # key order wins
        ({"query": "   ", "message": "second"}, "second"),     # blank is skipped
        ({"query": None, "task": "t"}, "t"),                   # non-str is skipped
        ({"query": 42, "task": "t"}, "t"),
        ({"other": "ignored"}, ""),
        ({}, ""),
        ([], ""),                                              # non-dict body
        (None, ""),
        ("a bare string", ""),
    ],
)
def test_extract_intent_text(body, expected):
    assert extract_intent_text(body) == expected
