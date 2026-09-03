"""Map model scores to risk decisions without interpreting anonymized V features."""

from __future__ import annotations

from typing import Literal

RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
Recommendation = Literal["ALLOW", "MONITOR", "MANUAL_REVIEW", "BLOCK_AND_INVESTIGATE"]

RISK_THRESHOLDS = {
    "low_max": 30,
    "medium_max": 60,
    "high_max": 80,
}

RECOMMENDATION_BY_LEVEL: dict[RiskLevel, Recommendation] = {
    "LOW": "ALLOW",
    "MEDIUM": "MONITOR",
    "HIGH": "MANUAL_REVIEW",
    "CRITICAL": "BLOCK_AND_INVESTIGATE",
}

# Explanations refer only to model probability/score/level, not to V1–V28 semantics.
RISK_SUMMARY_BY_LEVEL: dict[RiskLevel, str] = {
    "LOW": (
        "The model found a low estimated probability of fraud for this transaction. "
        "The transaction is classified as low risk by the current baseline model."
    ),
    "MEDIUM": (
        "The model detected a moderate estimated probability of fraud. "
        "This transaction should be monitored or reviewed depending on additional business context."
    ),
    "HIGH": (
        "The model detected an elevated estimated probability of fraud. "
        "Additional verification or manual review is recommended."
    ),
    "CRITICAL": (
        "The model detected a very high estimated probability of fraud. "
        "The transaction should be investigated before approval."
    ),
}

MODEL_TYPE = "RandomForestClassifier"
DATASET_FEATURE_TYPE = "anonymized_transaction_features"


def risk_level_from_score(risk_score: int) -> RiskLevel:
    if risk_score <= RISK_THRESHOLDS["low_max"]:
        return "LOW"
    if risk_score <= RISK_THRESHOLDS["medium_max"]:
        return "MEDIUM"
    if risk_score <= RISK_THRESHOLDS["high_max"]:
        return "HIGH"
    return "CRITICAL"


def recommendation_from_level(risk_level: RiskLevel) -> Recommendation:
    return RECOMMENDATION_BY_LEVEL[risk_level]


def risk_summary_from_level(risk_level: RiskLevel) -> str:
    return RISK_SUMMARY_BY_LEVEL[risk_level]


def decision_metadata() -> dict:
    return {
        "thresholds": dict(RISK_THRESHOLDS),
        "model_type": MODEL_TYPE,
        "dataset_feature_type": DATASET_FEATURE_TYPE,
    }
