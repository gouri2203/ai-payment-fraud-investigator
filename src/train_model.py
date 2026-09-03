"""
Train a Random Forest fraud detector on the credit-card dataset.

Run from the project root:
    python src/train_model.py

Accuracy is not used as the primary metric because Class is highly
imbalanced (fraud is the rare class). Precision, recall, F1, and
PR-AUC (average precision) are reported instead.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

# Resolve paths from the project root so this works regardless of CWD
# as long as the script lives at src/train_model.py.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "creditcard.csv"
MODELS_DIR = PROJECT_ROOT / "models"
MODEL_PATH = MODELS_DIR / "fraud_model.pkl"
METRICS_PATH = MODELS_DIR / "metrics.json"

TARGET_COLUMN = "Class"
FRAUD_LABEL = 1


def main() -> None:
    print(f"Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    print(f"Dataset shape: {df.shape}")
    print(f"Missing values count: {int(df.isna().sum().sum())}")

    class_counts = df[TARGET_COLUMN].value_counts().sort_index()
    class_rates = df[TARGET_COLUMN].value_counts(normalize=True).sort_index()
    print("Fraud class distribution (count):")
    print(class_counts.to_string())
    print("Fraud class distribution (proportion):")
    print(class_rates.to_string())

    # X = all columns except the binary fraud label; y = Class (0 genuine, 1 fraud)
    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]

    # Stratified split keeps the same fraud ratio in train and test sets.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )
    print(f"Train shape: {X_train.shape} | Test shape: {X_test.shape}")
    print(
        "Train fraud rate: "
        f"{y_train.mean():.6f} | Test fraud rate: {y_test.mean():.6f}"
    )

    # class_weight="balanced" up-weights the rare fraud class during training.
    model = RandomForestClassifier(
        n_estimators=100,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    print("Training RandomForestClassifier...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    # Probability of the fraud class is required for PR-AUC / average precision.
    y_score = model.predict_proba(X_test)[:, 1]

    # Binary metrics are computed for the fraud class (pos_label=1).
    precision = precision_score(y_test, y_pred, pos_label=FRAUD_LABEL, zero_division=0)
    recall = recall_score(y_test, y_pred, pos_label=FRAUD_LABEL, zero_division=0)
    f1 = f1_score(y_test, y_pred, pos_label=FRAUD_LABEL, zero_division=0)
    pr_auc = average_precision_score(y_test, y_score)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    report = classification_report(
        y_test,
        y_pred,
        labels=[0, 1],
        target_names=["genuine", "fraud"],
        zero_division=0,
    )

    print("\n--- Evaluation (fraud class is the positive class) ---")
    print(f"Precision: {precision:.6f}")
    print(f"Recall:    {recall:.6f}")
    print(f"F1-score:  {f1:.6f}")
    print(f"PR-AUC (Average Precision): {pr_auc:.6f}")
    print("Confusion matrix [[TN, FP], [FN, TP]]:")
    print(cm)
    print("\nClassification report:")
    print(report)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to: {MODEL_PATH}")

    metrics = {
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "pr_auc": float(pr_auc),
        "average_precision": float(pr_auc),
        "confusion_matrix": {
            "labels": [0, 1],
            "matrix": cm.tolist(),
            "true_negative": int(cm[0, 0]),
            "false_positive": int(cm[0, 1]),
            "false_negative": int(cm[1, 0]),
            "true_positive": int(cm[1, 1]),
        },
        "classification_report": report,
        "n_train": int(len(y_train)),
        "n_test": int(len(y_test)),
        "n_features": int(X.shape[1]),
        "feature_names": list(X.columns),
        "model": {
            "type": "RandomForestClassifier",
            "n_estimators": 100,
            "class_weight": "balanced",
            "random_state": 42,
        },
        "split": {
            "test_size": 0.2,
            "random_state": 42,
            "stratify": True,
        },
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved metrics to: {METRICS_PATH}")


if __name__ == "__main__":
    main()
