"""
FastAPI backend for the trained fraud detection model.

Start from the project root:
    python -m uvicorn backend.main:app --reload
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import json
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.decisions import (
    decision_metadata,
    recommendation_from_level,
    risk_level_from_score,
    risk_summary_from_level,
)
from backend.explainability import explain_transaction
from backend.schemas import (
    CostAssumptions,
    DemoTransaction,
    EstimatedImpact,
    FEATURE_ORDER,
    FinancialImpactResponse,
    FinancialMetricCategory,
    HealthResponse,
    PredictionResponse,
    TransactionFeatures,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "fraud_model.pkl"
DEMO_DATA_PATH = PROJECT_ROOT / "data" / "demo_transactions.json"
FINANCIAL_BASELINE_PATH = PROJECT_ROOT / "models" / "financial_impact_baseline.json"
MODEL_VERSION = "baseline-random-forest-v1"

model = None
demo_transactions: list[DemoTransaction] = []


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Trained model not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def load_demo_transactions() -> list[DemoTransaction]:
    if not DEMO_DATA_PATH.exists():
        raise FileNotFoundError(f"Demo transactions not found at {DEMO_DATA_PATH}")
    with open(DEMO_DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
    return [DemoTransaction(**record) for record in records]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global model, demo_transactions
    model = load_model()
    demo_transactions = load_demo_transactions()
    yield
    model = None
    demo_transactions = []


app = FastAPI(
    title="AI Payment Fraud Investigator API",
    version=MODEL_VERSION,
    lifespan=lifespan,
)

# Allow a future React frontend (Vite/CRA local ports) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="online", model_loaded=model is not None)


@app.get("/demo-transactions", response_model=list[DemoTransaction])
def get_demo_transactions() -> list[DemoTransaction]:
    global demo_transactions
    if not demo_transactions:
        demo_transactions = load_demo_transactions()
    return demo_transactions


def load_financial_baseline() -> dict:
    if not FINANCIAL_BASELINE_PATH.exists():
        raise FileNotFoundError(
            f"Financial baseline not found at {FINANCIAL_BASELINE_PATH}"
        )
    with open(FINANCIAL_BASELINE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/financial-impact", response_model=FinancialImpactResponse)
def get_financial_impact(
    chargeback_fee: float = 15.0,
    manual_review_cost: float = 2.0,
) -> FinancialImpactResponse:
    baseline = load_financial_baseline()
    cm = baseline["confusion_matrix"]
    tp = cm["true_positives"]
    fp = cm["false_positives"]
    fn = cm["false_negatives"]
    tn = cm["true_negatives"]

    direct_fraud_losses_fn = fn["volume"]
    chargeback_penalties_fn = round(fn["count"] * chargeback_fee, 2)
    total_fn_cost = round(direct_fraud_losses_fn + chargeback_penalties_fn, 2)

    manual_review_cost_fp = round(fp["count"] * manual_review_cost, 2)
    flagged_friction_volume_fp = fp["volume"]

    total_prevented_fraud_tp = tp["volume"]
    net_financial_protection = round(
        total_prevented_fraud_tp - (total_fn_cost + manual_review_cost_fp), 2
    )

    return FinancialImpactResponse(
        total_test_transactions=baseline["total_test_transactions"],
        total_test_volume=baseline["total_test_volume"],
        currency="EUR",
        true_positives=FinancialMetricCategory(**tp),
        false_positives=FinancialMetricCategory(**fp),
        false_negatives=FinancialMetricCategory(**fn),
        true_negatives=FinancialMetricCategory(**tn),
        assumptions=CostAssumptions(
            chargeback_fee_per_fn=chargeback_fee,
            manual_review_cost_per_fp=manual_review_cost,
            is_assumption=True,
            disclaimer=(
                "Transaction counts and amounts are empirical outcomes from 56,962 test set cases. "
                "Chargeback fees and review costs are configurable business assumptions."
            ),
        ),
        estimated_impact=EstimatedImpact(
            direct_fraud_losses_fn=direct_fraud_losses_fn,
            chargeback_penalties_fn=chargeback_penalties_fn,
            total_fn_cost=total_fn_cost,
            manual_review_cost_fp=manual_review_cost_fp,
            flagged_friction_volume_fp=flagged_friction_volume_fp,
            total_prevented_fraud_tp=total_prevented_fraud_tp,
            net_financial_protection=net_financial_protection,
        ),
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: TransactionFeatures) -> PredictionResponse:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    try:
        features = pd.DataFrame([payload.to_ordered_row()], columns=FEATURE_ORDER)
        fraud_probability = float(model.predict_proba(features)[0, 1])
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to score this transaction: {exc}",
        ) from exc

    risk_score = int(round(fraud_probability * 100))
    risk_score = max(0, min(100, risk_score))

    risk_level = risk_level_from_score(risk_score)
    reason_codes = explain_transaction(model, features, top_k=5)
    return PredictionResponse(
        fraud_probability=round(fraud_probability, 6),
        risk_score=risk_score,
        risk_level=risk_level,
        model_version=MODEL_VERSION,
        recommendation=recommendation_from_level(risk_level),
        risk_summary=risk_summary_from_level(risk_level),
        decision_metadata=decision_metadata(),
        reason_codes=reason_codes,
    )
