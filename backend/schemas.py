"""Pydantic request/response schemas for the fraud API.

Feature names match the ULB credit-card dataset and the trained model:
Time, V1–V28, Amount. Do not rename these columns.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from backend.decisions import Recommendation, RiskLevel

# Same column order used when training models/fraud_model.pkl
FEATURE_ORDER: list[str] = [
    "Time",
    *[f"V{i}" for i in range(1, 29)],
    "Amount",
]

class TransactionFeatures(BaseModel):
    """One transaction in the exact feature layout expected by the model."""

    model_config = ConfigDict(extra="forbid")

    Time: float = Field(..., description="Seconds elapsed between this transaction and the first in the dataset")
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Amount: float = Field(..., description="Transaction amount")

    def to_ordered_row(self) -> dict[str, float]:
        """Return features as a dict in training column order."""
        data = self.model_dump()
        return {name: data[name] for name in FEATURE_ORDER}


class DemoTransaction(BaseModel):
    """A demo transaction from the dataset including ID, index, Class, and model features."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique demo transaction ID")
    dataset_index: int = Field(..., description="Row index in original dataset")
    Class: int = Field(..., description="Actual class label: 0 for genuine, 1 for fraud")
    Time: float = Field(..., description="Seconds elapsed between this transaction and the first in the dataset")
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Amount: float = Field(..., description="Transaction amount")

    def to_transaction_features(self) -> TransactionFeatures:
        """Extract model features as a TransactionFeatures instance."""
        data = self.model_dump()
        return TransactionFeatures(**{name: data[name] for name in FEATURE_ORDER})


class DecisionThresholds(BaseModel):
    low_max: int
    medium_max: int
    high_max: int


class DecisionMetadata(BaseModel):
    thresholds: DecisionThresholds
    model_type: str
    dataset_feature_type: str


class PredictionResponse(BaseModel):
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    model_version: str
    recommendation: Recommendation
    risk_summary: str
    decision_metadata: DecisionMetadata


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
