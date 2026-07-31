"""
Shared prompt clauses used across every AI feature (advisor, incident
summarization, insights, etc.) so grounding/explainability rules stay
consistent and are edited in exactly one place.
"""

GROUNDING_CLAUSE = (
    "If the provided data does not contain enough information to answer "
    "confidently, say so explicitly rather than guessing. Never state a "
    "number, district name, alert code, or metric that is not present in "
    "the data provided above."
)

EXPLAINABILITY_CLAUSE = (
    "For every flag, anomaly, or recommendation you produce, briefly cite "
    "the specific data point(s) that support it (e.g. 'flagged because "
    "water pressure dropped to 38 PSI, below the 45 PSI threshold'). If "
    "reasoning from a pattern across multiple data points rather than a "
    "single value, describe the pattern explicitly rather than asserting "
    "a conclusion without support."
)
