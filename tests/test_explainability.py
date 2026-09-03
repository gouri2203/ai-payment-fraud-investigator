"""Unit tests for Random Forest tree explainability and reason codes."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient

from backend.explainability import explain_transaction
from backend.main import app
from backend.schemas import FEATURE_ORDER, ReasonCode

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "fraud_model.pkl"
DEMO_PATH = PROJECT_ROOT / "data" / "demo_transactions.json"


@pytest.fixture(scope="module")
def trained_model():
    assert MODEL_PATH.exists(), f"Model not found at {MODEL_PATH}"
    return joblib.load(MODEL_PATH)


@pytest.fixture(scope="module")
def demo_records() -> list[dict]:
    assert DEMO_PATH.exists(), f"Demo data not found at {DEMO_PATH}"
    with open(DEMO_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_explain_transaction_structure(trained_model, demo_records):
    sample = demo_records[0]
    feature_row = {k: sample[k] for k in FEATURE_ORDER}

    reasons = explain_transaction(trained_model, feature_row, top_k=5)

    assert isinstance(reasons, list)
    assert 3 <= len(reasons) <= 5

    for reason in reasons:
        assert isinstance(reason, ReasonCode)
        assert reason.feature in FEATURE_ORDER
        assert isinstance(reason.contribution, float)
        assert reason.direction in (
            "increases_fraud_risk",
            "decreases_fraud_risk",
        )
        if reason.contribution > 0:
            assert reason.direction == "increases_fraud_risk"
        else:
            assert reason.direction == "decreases_fraud_risk"
        assert len(reason.reason_code) > 0
        assert len(reason.description) > 0

    # Ensure reasons are sorted by absolute contribution descending
    magnitudes = [abs(r.contribution) for r in reasons]
    assert magnitudes == sorted(magnitudes, reverse=True)


def test_explain_transaction_fraud_sample_features(trained_model, demo_records):
    # Find a confirmed fraud sample
    fraud_samples = [d for d in demo_records if d["Class"] == 1]
    assert len(fraud_samples) > 0
    sample = fraud_samples[0]
    feature_row = {k: sample[k] for k in FEATURE_ORDER}

    reasons = explain_transaction(trained_model, feature_row, top_k=5)
    features_present = {r.feature for r in reasons}

    # At least one of the known globally influential PCA features should be in top reasons
    influential_features = {"V14", "V10", "V12", "V17", "V4", "Time", "Amount"}
    assert len(features_present.intersection(influential_features)) > 0


def test_predict_api_includes_reason_codes():
    with TestClient(app) as client:
        with open(DEMO_PATH, "r", encoding="utf-8") as f:
            demo_data = json.load(f)

        sample = demo_data[0]
        payload = {k: sample[k] for k in FEATURE_ORDER}

        resp = client.post("/predict", json=payload)
        assert resp.status_code == 200

        data = resp.json()
        assert "reason_codes" in data
        assert isinstance(data["reason_codes"], list)
        assert len(data["reason_codes"]) == 5

        for item in data["reason_codes"]:
            assert "feature" in item
            assert "contribution" in item
            assert "direction" in item
            assert "reason_code" in item
            assert "description" in item
