"""Unit tests for the financial cost impact endpoint."""

from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app


def test_financial_impact_endpoint_default_assumptions():
    with TestClient(app) as client:
        resp = client.get("/financial-impact")
        assert resp.status_code == 200

        data = resp.json()

        # Empirical test-set outcomes (56,962 transactions)
        assert data["total_test_transactions"] == 56962
        assert data["total_test_volume"] == 5072061.46
        assert data["currency"] == "EUR"

        # Confusion matrix breakdown
        tp = data["true_positives"]
        assert tp["count"] == 77
        assert tp["volume"] == 6424.72
        assert tp["average_amount"] == 83.44

        fp = data["false_positives"]
        assert fp["count"] == 8
        assert fp["volume"] == 229.25
        assert fp["average_amount"] == 28.66

        fn = data["false_negatives"]
        assert fn["count"] == 21
        assert fn["volume"] == 4220.21
        assert fn["average_amount"] == 200.96

        tn = data["true_negatives"]
        assert tn["count"] == 56856
        assert tn["volume"] == 5061187.28
        assert tn["average_amount"] == 89.02

        # Operational assumptions
        assumptions = data["assumptions"]
        assert assumptions["is_assumption"] is True
        assert assumptions["chargeback_fee_per_fn"] == 15.0
        assert assumptions["manual_review_cost_per_fp"] == 2.0
        assert "assumption" in assumptions["disclaimer"].lower()

        # Calculated impact
        impact = data["estimated_impact"]
        assert impact["direct_fraud_losses_fn"] == 4220.21
        assert impact["chargeback_penalties_fn"] == round(21 * 15.0, 2)
        assert impact["total_fn_cost"] == round(4220.21 + (21 * 15.0), 2)
        assert impact["manual_review_cost_fp"] == round(8 * 2.0, 2)
        assert impact["flagged_friction_volume_fp"] == 229.25
        assert impact["total_prevented_fraud_tp"] == 6424.72
        assert impact["net_financial_protection"] == round(
            6424.72 - (impact["total_fn_cost"] + impact["manual_review_cost_fp"]),
            2,
        )


def test_financial_impact_endpoint_custom_assumptions():
    with TestClient(app) as client:
        custom_fee = 30.0
        custom_review = 10.0
        resp = client.get(
            f"/financial-impact?chargeback_fee={custom_fee}&manual_review_cost={custom_review}"
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["assumptions"]["chargeback_fee_per_fn"] == custom_fee
        assert data["assumptions"]["manual_review_cost_per_fp"] == custom_review

        impact = data["estimated_impact"]
        assert impact["chargeback_penalties_fn"] == round(21 * custom_fee, 2)
        assert impact["manual_review_cost_fp"] == round(8 * custom_review, 2)
        expected_total_fn = round(4220.21 + (21 * custom_fee), 2)
        assert impact["total_fn_cost"] == expected_total_fn
        expected_net = round(
            6424.72 - (expected_total_fn + (8 * custom_review)), 2
        )
        assert impact["net_financial_protection"] == expected_net
