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
from backend.schemas import (
    DemoTransaction,
    FEATURE_ORDER,
    HealthResponse,
    PredictionResponse,
    TransactionFeatures,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "fraud_model.pkl"
DEMO_DATA_PATH = PROJECT_ROOT / "data" / "demo_transactions.json"
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
    return PredictionResponse(
        fraud_probability=round(fraud_probability, 6),
        risk_score=risk_score,
        risk_level=risk_level,
        model_version=MODEL_VERSION,
        recommendation=recommendation_from_level(risk_level),
        risk_summary=risk_summary_from_level(risk_level),
        decision_metadata=decision_metadata(),
    )
