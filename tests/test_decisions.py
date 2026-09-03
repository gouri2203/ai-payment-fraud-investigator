"""Unit tests for risk mapping. These do not interpret anonymized V features."""

from backend.decisions import (
    RECOMMENDATION_BY_LEVEL,
    RISK_SUMMARY_BY_LEVEL,
    decision_metadata,
    recommendation_from_level,
    risk_level_from_score,
    risk_summary_from_level,
)


def test_risk_level_thresholds() -> None:
    assert risk_level_from_score(0) == "LOW"
    assert risk_level_from_score(30) == "LOW"
    assert risk_level_from_score(31) == "MEDIUM"
    assert risk_level_from_score(60) == "MEDIUM"
    assert risk_level_from_score(61) == "HIGH"
    assert risk_level_from_score(80) == "HIGH"
    assert risk_level_from_score(81) == "CRITICAL"
    assert risk_level_from_score(100) == "CRITICAL"


def test_recommendation_values() -> None:
    assert recommendation_from_level("LOW") == "ALLOW"
    assert recommendation_from_level("MEDIUM") == "MONITOR"
    assert recommendation_from_level("HIGH") == "MANUAL_REVIEW"
    assert recommendation_from_level("CRITICAL") == "BLOCK_AND_INVESTIGATE"
    assert set(RECOMMENDATION_BY_LEVEL.values()) == {
        "ALLOW",
        "MONITOR",
        "MANUAL_REVIEW",
        "BLOCK_AND_INVESTIGATE",
    }


def test_risk_summary_is_present_for_every_level() -> None:
    for level in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
        summary = risk_summary_from_level(level)
        assert isinstance(summary, str)
        assert len(summary) > 0
        assert "probability of fraud" in summary
        assert summary == RISK_SUMMARY_BY_LEVEL[level]
        assert "device" not in summary.lower()
        assert "location" not in summary.lower()
        assert "merchant" not in summary.lower()


def test_decision_metadata_shape() -> None:
    metadata = decision_metadata()
    assert metadata["thresholds"] == {
        "low_max": 30,
        "medium_max": 60,
        "high_max": 80,
    }
    assert metadata["model_type"] == "RandomForestClassifier"
    assert metadata["dataset_feature_type"] == "anonymized_transaction_features"
