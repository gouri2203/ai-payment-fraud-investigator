"""API tests for /health and /predict."""

from __future__ import annotations

import numpy as np

from tests.conftest import GENUINE_PAYLOAD, REQUIRED_PREDICT_FIELDS


def _assert_predict_structure(body: dict) -> None:
    assert REQUIRED_PREDICT_FIELDS.issubset(body.keys())
    assert 0.0 <= body["fraud_probability"] <= 1.0
    assert 0 <= body["risk_score"] <= 100
    assert body["risk_level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert body["recommendation"] in {
        "ALLOW",
        "MONITOR",
        "MANUAL_REVIEW",
        "BLOCK_AND_INVESTIGATE",
    }
    assert isinstance(body["risk_summary"], str) and body["risk_summary"]
    metadata = body["decision_metadata"]
    assert metadata["thresholds"] == {
        "low_max": 30,
        "medium_max": 60,
        "high_max": 80,
    }
    assert metadata["model_type"] == "RandomForestClassifier"
    assert metadata["dataset_feature_type"] == "anonymized_transaction_features"


def test_health(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "model_loaded": True}


def test_low_prediction_response(client) -> None:
    response = client.post("/predict", json=GENUINE_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    _assert_predict_structure(body)
    assert body["risk_level"] == "LOW"
    assert body["recommendation"] == "ALLOW"
    assert body["risk_score"] <= 30
    assert "low estimated probability of fraud" in body["risk_summary"]
    assert body["model_version"] == "baseline-random-forest-v1"


def test_medium_high_critical_response_structure(client, monkeypatch) -> None:
    import backend.main as main

    class FakeModel:
        def __init__(self, fraud_probability: float) -> None:
            self.fraud_probability = fraud_probability

        def predict_proba(self, _features):
            p = self.fraud_probability
            return np.array([[1.0 - p, p]])

    cases = [
        (0.55, "MEDIUM", "MONITOR", "moderate estimated probability"),
        (0.72, "HIGH", "MANUAL_REVIEW", "elevated estimated probability"),
        (0.94, "CRITICAL", "BLOCK_AND_INVESTIGATE", "very high estimated probability"),
    ]
    for probability, level, recommendation, summary_snippet in cases:
        monkeypatch.setattr(main, "model", FakeModel(probability))
        response = client.post("/predict", json=GENUINE_PAYLOAD)
        assert response.status_code == 200
        body = response.json()
        _assert_predict_structure(body)
        assert body["risk_level"] == level
        assert body["recommendation"] == recommendation
        assert summary_snippet in body["risk_summary"]
        assert "risk_summary" in body


def test_invalid_input_missing_amount(client) -> None:
    payload = dict(GENUINE_PAYLOAD)
    del payload["Amount"]
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "Amount"


def test_invalid_input_extra_field(client) -> None:
    payload = dict(GENUINE_PAYLOAD)
    payload["Class"] = 0
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    assert "Extra inputs are not permitted" in response.json()["detail"][0]["msg"]


def test_invalid_input_wrong_type(client) -> None:
    payload = dict(GENUINE_PAYLOAD)
    payload["Amount"] = "not-a-number"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_demo_transactions_endpoint(client) -> None:
    response = client.get("/demo-transactions")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) == 20

    genuine_count = sum(1 for item in items if item["Class"] == 0)
    fraud_count = sum(1 for item in items if item["Class"] == 1)
    assert genuine_count == 10
    assert fraud_count == 10

    required_keys = {"id", "dataset_index", "Class", "Time", "Amount", *[f"V{i}" for i in range(1, 29)]}
    for item in items:
        assert required_keys.issubset(item.keys())
        assert item["id"].startswith("TXN-")
        assert isinstance(item["dataset_index"], int)
        assert isinstance(item["Time"], (int, float))
        assert isinstance(item["Amount"], (int, float))


def test_demo_transaction_can_be_scored_by_predict(client) -> None:
    demo_resp = client.get("/demo-transactions")
    assert demo_resp.status_code == 200
    first_item = demo_resp.json()[0]

    predict_payload = {k: v for k, v in first_item.items() if k not in ("id", "dataset_index", "Class")}
    assert len(predict_payload) == 30

    predict_resp = client.post("/predict", json=predict_payload)
    assert predict_resp.status_code == 200
    pred_data = predict_resp.json()
    _assert_predict_structure(pred_data)

