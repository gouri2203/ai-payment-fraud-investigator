"""Explainability module for Random Forest fraud detection.

Computes exact tree decision-path attribution (change in fraud probability
per feature across all decision trees in the ensemble).
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

from backend.schemas import FEATURE_ORDER, ReasonCode


def explain_transaction(
    model: RandomForestClassifier,
    feature_row: dict[str, float] | pd.DataFrame | np.ndarray,
    top_k: int = 5,
) -> list[ReasonCode]:
    """Compute top contributing features from Random Forest decision paths.

    Args:
        model: Fitted RandomForestClassifier.
        feature_row: 30 model features in FEATURE_ORDER.
        top_k: Number of top features to return (between 3 and 5).

    Returns:
        List of ReasonCode objects sorted by absolute contribution.
    """
    if isinstance(feature_row, dict):
        x_vals = np.array(
            [[feature_row[name] for name in FEATURE_ORDER]], dtype=np.float64
        )
    elif isinstance(feature_row, pd.DataFrame):
        x_vals = feature_row[FEATURE_ORDER].to_numpy(dtype=np.float64)
    elif isinstance(feature_row, np.ndarray):
        x_vals = (
            feature_row
            if feature_row.ndim == 2
            else feature_row.reshape(1, -1)
        ).astype(np.float64)
    else:
        raise ValueError(f"Unsupported feature input type: {type(feature_row)}")

    n_features = len(FEATURE_ORDER)
    if not hasattr(model, "estimators_") or not model.estimators_:
        return []

    contributions = np.zeros(n_features, dtype=np.float64)

    for tree in model.estimators_:
        tree_ = tree.tree_
        node_indicator = tree.decision_path(x_vals)
        node_index = node_indicator.indices

        for i in range(len(node_index) - 1):
            curr_node = node_index[i]
            next_node = node_index[i + 1]
            feat = tree_.feature[curr_node]
            if feat >= 0:
                curr_val = tree_.value[curr_node][0]
                curr_p = curr_val[1] / curr_val.sum()
                next_val = tree_.value[next_node][0]
                next_p = next_val[1] / next_val.sum()
                contributions[feat] += next_p - curr_p

    contributions /= len(model.estimators_)

    top_k = max(3, min(5, top_k))
    top_indices = np.argsort(np.abs(contributions))[::-1][:top_k]

    reasons: list[ReasonCode] = []
    for idx in top_indices:
        feat_name = FEATURE_ORDER[idx]
        delta = float(contributions[idx])
        val = float(x_vals[0, idx])
        direction = (
            "increases_fraud_risk" if delta > 0 else "decreases_fraud_risk"
        )

        if feat_name == "Amount":
            code = (
                "AMOUNT_ELEVATED_RISK" if delta > 0 else "AMOUNT_LOW_RISK"
            )
            desc = (
                f"Transaction amount of ₹{val:,.2f} contributed {delta * 100:+.2f}% "
                f"to estimated fraud probability."
            )
        elif feat_name == "Time":
            code = (
                "TRANSACTION_TIMING_ELEVATED_RISK"
                if delta > 0
                else "TRANSACTION_TIMING_BENIGN"
            )
            desc = (
                f"Elapsed time ({val:.1f}s) contributed {delta * 100:+.2f}% "
                f"to estimated fraud probability."
            )
        else:
            code = (
                f"PCA_{feat_name}_ELEVATED_RISK"
                if delta > 0
                else f"PCA_{feat_name}_BENIGN"
            )
            desc = (
                f"PCA component {feat_name} value ({val:+.3f}) shifted estimated "
                f"fraud probability by {delta * 100:+.2f}%."
            )

        reasons.append(
            ReasonCode(
                feature=feat_name,
                contribution=round(delta, 6),
                direction=direction,
                reason_code=code,
                description=desc,
            )
        )

    return reasons
