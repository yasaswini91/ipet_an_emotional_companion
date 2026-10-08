"""
Safety Dataset Filtering Pipeline for iPET (ACL 2025 Section 3.1)
"All generated data underwent expert safety filtering to eliminate toxic, harmful, or emotionally manipulative content."
"""

import re
from typing import Dict, Any, Tuple

HARMFUL_PATTERNS = [
    r"\b(kill|suicide|die|hurt myself|self-harm|cut myself|end my life)\b",
    r"\b(hate you|ugly|worthless|idiot|stupid pet|abuse|cruel)\b",
    r"\b(you are my only reason to live|i will never speak to real people|i don't need humans|isolate myself)\b",
    r"\b(ssn|credit card|\d{3}-\d{2}-\d{4}|\b\d{16}\b)\b",
]

def evaluate_entry(entry: Dict[str, Any]) -> Tuple[bool, str, float]:
    """
    Evaluates an entry against safety and emotional healthiness rubrics.
    Returns: (is_safe, category, safety_score)
    """
    text = f"{entry.get('user_prompt', '')} {entry.get('assistant_response', '')} {entry.get('outline_T1', '')}"
    
    for pattern in HARMFUL_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            if re.search(r"suicide|self-harm|hurt myself", text, re.IGNORECASE):
                return False, "self_harm", 0.05
            if re.search(r"only reason to live|never speak to real people", text, re.IGNORECASE):
                return False, "parasocial_overdependence", 0.10
            if re.search(r"\d{3}-\d{2}-\d{4}|\b\d{16}\b", text):
                return False, "pii_leak", 0.00
            return False, "toxicity", 0.15

    # Check response quality and length
    response = entry.get("assistant_response", "")
    if len(response.strip()) < 10:
        return False, "low_quality", 0.30

    return True, "safe", 0.99
