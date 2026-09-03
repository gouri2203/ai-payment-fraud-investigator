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


class ReasonCode(BaseModel):
    feature: str = Field(..., description="Feature name from the 30 model inputs")
    contribution: float = Field(
        ..., description="Change in predicted fraud probability (delta)"
    )
    direction: str = Field(
        ..., description="'increases_fraud_risk' or 'decreases_fraud_risk'"
    )
    reason_code: str = Field(..., description="Human-readable reason code identifier")
    description: str = Field(..., description="Fact-based summary of feature impact")


class PredictionResponse(BaseModel):
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    model_version: str
    recommendation: Recommendation
    risk_summary: str
    decision_metadata: DecisionMetadata
    reason_codes: list[ReasonCode] = Field(
        default_factory=list,
        description="Top contributing features derived from decision paths",
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class FinancialMetricCategory(BaseModel):
    count: int = Field(..., description="Number of transactions in this category")
    volume: float = Field(..., description="Total monetary volume of transactions")
    average_amount: float = Field(..., description="Average amount per transaction")


class CostAssumptions(BaseModel):
    chargeback_fee_per_fn: float = Field(
        ..., description="Assumed dispute/chargeback penalty per missed fraud"
    )
    manual_review_cost_per_fp: float = Field(
        ..., description="Assumed operational review cost per false alarm"
    )
    is_assumption: bool = Field(
        default=True,
        description="Flag explicitly indicating values are operational assumptions",
    )
    disclaimer: str = Field(
        ..., description="Notice clarifying real vs assumed figures"
    )


class EstimatedImpact(BaseModel):
    direct_fraud_losses_fn: float = Field(
        ..., description="Actual volume lost to missed fraud (FN)"
    )
    chargeback_penalties_fn: float = Field(
        ..., description="Estimated network chargeback penalties (FN count * fee)"
    )
    total_fn_cost: float = Field(
        ..., description="Direct fraud loss + chargeback penalties"
    )
    manual_review_cost_fp: float = Field(
        ..., description="Operational review cost from false alarms (FP count * review_cost)"
    )
    flagged_friction_volume_fp: float = Field(
        ..., description="Actual volume of innocent transactions flagged (FP)"
    )
    total_prevented_fraud_tp: float = Field(
        ..., description="Actual fraud volume successfully blocked (TP)"
    )
    net_financial_protection: float = Field(
        ..., description="Protected fraud volume minus total FN and FP costs"
    )


class FinancialImpactResponse(BaseModel):
    total_test_transactions: int
    total_test_volume: float
    currency: str
    true_positives: FinancialMetricCategory
    false_positives: FinancialMetricCategory
    false_negatives: FinancialMetricCategory
    true_negatives: FinancialMetricCategory
    assumptions: CostAssumptions
    estimated_impact: EstimatedImpact

