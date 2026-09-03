# AI-Powered Payment Fraud Investigator

An enterprise-grade, full-stack fraud detection and real-time risk investigation platform. This system pairs a trained machine learning inference pipeline (FastAPI + scikit-learn) with a modern analyst dashboard (React + Vite + Recharts) for evaluating, investigating, and auditing suspicious payment transactions.

---

## Architecture Overview

The repository is structured as a full-stack monorepo separating machine learning artifacts, backend API services, and the React analyst client:

```text
ai-payment-fraud-investigator/
├── backend/                  # FastAPI inference & decision engine
│   ├── main.py               # API routes, CORS, and startup lifespan
│   ├── schemas.py            # Pydantic v2 request/response validation
│   ├── decisions.py          # Deterministic decision & threshold policy
│   └── requirements.txt      # Backend-specific dependencies
├── frontend/                 # React 19 + Vite 6 Single-Page Application
│   ├── src/
│   │   ├── App.jsx           # Dashboard, AI Investigator, Reports & Drawer
│   │   ├── App.css           # Custom theme & responsive layouts
│   │   └── main.jsx          # React DOM entry point
│   ├── package.json          # Node scripts & dependencies
│   └── vite.config.js        # Vite build configuration
├── models/                   # Serialized ML artifacts & performance telemetry
│   ├── fraud_model.pkl       # Trained Random Forest classifier (5.3 MB)
│   └── metrics.json          # Test split evaluation metrics & confusion matrix
├── src/                      # ML pipeline scripts
│   └── train_model.py        # Model training, stratification & evaluation
├── data/                     # Dataset storage & demo samples
│   ├── demo_transactions.json# Balanced 20-sample derived dataset (tracked)
│   └── creditcard.csv        # Raw Kaggle dataset (150.8 MB - Git ignored)
├── tests/                    # Automated backend & API test suite
│   ├── test_predict_api.py   # FastAPI endpoint & payload validation tests
│   ├── test_decisions.py     # Decision logic & risk threshold tests
│   └── conftest.py           # Pytest client fixtures & test payloads
├── pytest.ini                # Pytest configuration
├── requirements.txt          # Root Python environment dependencies
└── .gitignore                # Excludes large files (creditcard.csv), caches, node_modules
```

---

## Data Flow & System Design

```
                     ┌─────────────────────────────────────────┐
                     │          React 19 Analyst UI            │
                     │  (Dashboard, Investigator, Reports)     │
                     └───────┬─────────────────────────▲───────┘
                             │                         │
      GET /demo-transactions │                         │ Prediction Response
      (Load 20 real records) │                         │ (Score, Level, Rec, Prob)
                             ▼                         │
                     ┌─────────────────────────────────┴───────┐
                     │          FastAPI Backend Service        │
                     │             (Port 8000)                 │
                     └───────┬─────────────────────────▲───────┘
                             │                         │
     POST /predict           │                         │ Probabilities
     (30 Features:           ▼                         │ (Class 0 / Class 1)
      Time, V1-V28, Amount) ┌──────────────────────────┴───────┐
                            │    Random Forest Classifier      │
                            │   (models/fraud_model.pkl)       │
                            └──────────────────────────────────┘
```

1. **Demo Transactions**: The AI Investigator queries `GET /demo-transactions` on load to fetch a curated, balanced set of real transactions from `data/demo_transactions.json`.
2. **Feature Extraction**: When an analyst investigates a case, the exact 30 numerical model features (`Time`, `V1` through `V28`, and `Amount`) are extracted without manual interpretation.
3. **Live Inference**: The features are posted to `POST /predict`. The Random Forest model generates an estimated fraud probability.
4. **Policy & Recommendations**: The decision engine maps the probability to a 0–100 risk score and generates an operational recommendation (`ALLOW`, `MONITOR`, `MANUAL_REVIEW`, or `BLOCK_AND_INVESTIGATE`).
5. **Audit & Reporting**: The Reports page allows operators to inspect system telemetry, audit trail statistics, and export active investigations as CSV files.

---

## Machine Learning Model Information

The classifier was trained on the European Cardholders fraud dataset using a stratified 80/20 train/test split:

- **Model Type**: `RandomForestClassifier` (100 estimators, balanced class weighting, `random_state=42`)
- **Features Used (30 total)**:
  - `Time`: Seconds elapsed between this transaction and the first transaction in the dataset.
  - `V1` – `V28`: Anonymized numerical features resulting from PCA transformation.
  - `Amount`: Transaction amount in dataset currency.
- **Evaluation Metrics (on 56,962 test transactions)**:
  - **Precision**: 90.59%
  - **Recall**: 78.57%
  - **F1 Score**: 84.15%
  - **PR-AUC / Average Precision**: 86.29%
  - **Confusion Matrix**:
    - True Negatives: `56,856`
    - False Positives: `8`
    - False Negatives: `21`
    - True Positives: `77`

### Decision Thresholds & Recommendations

The risk engine maps continuous model probabilities into discrete operational actions:

| Risk Score | Risk Tier | Recommendation | Action Description |
| :--- | :--- | :--- | :--- |
| **0 – 30** | `LOW` | `ALLOW` | Low fraud probability; transaction classified as safe. |
| **31 – 60** | `MEDIUM` | `MONITOR` | Moderate probability; monitor or review with customer profile. |
| **61 – 80** | `HIGH` | `MANUAL_REVIEW` | Elevated probability; secondary authentication or manual review. |
| **81 – 100** | `CRITICAL` | `BLOCK_AND_INVESTIGATE` | Very high probability; suspend transaction and open case. |

---

## Dataset Disclaimer & Git Storage Policy

> [!IMPORTANT]
> **Large File Notice**: `data/creditcard.csv` (~150.8 MB) is intentionally excluded from Git tracking via `.gitignore` because it exceeds GitHub's 100 MB hard file size limit.

- **Demo Dataset**: To allow the full application and demo to function out-of-the-box, the repository includes `data/demo_transactions.json`. This is a deterministic, balanced 20-record sample (10 confirmed fraud cases, 10 genuine cases) extracted directly from `creditcard.csv` with their exact feature values preserved.
- **Full Dataset Source**: If you wish to re-train the model from scratch, download the Credit Card Fraud Detection dataset from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud), place `creditcard.csv` into the `data/` folder, and run:
  ```bash
  python src/train_model.py
  ```

---

## API Endpoints

The FastAPI backend exposes the following endpoints on `http://127.0.0.1:8000`:

### 1. Health Check
- **Route**: `GET /health`
- **Response**:
  ```json
  {
    "status": "online",
    "model_loaded": true
  }
  ```

### 2. Demo Transactions
- **Route**: `GET /demo-transactions`
- **Description**: Returns all 20 curated real dataset transactions for live demonstration.
- **Response Shape**: Array of records with `id`, `dataset_index`, `Class`, and all 30 model features (`Time`, `V1`–`V28`, `Amount`).

### 3. Real-Time Fraud Prediction
- **Route**: `POST /predict`
- **Request Body**:
  ```json
  {
    "Time": 406.0,
    "V1": -2.312226,
    "V2": 1.951992,
    "V3": -1.609851,
    "...": "...",
    "V28": 0.133558,
    "Amount": 0.0
  }
  ```
- **Response Body**:
  ```json
  {
    "fraud_probability": 0.941234,
    "risk_score": 94,
    "risk_level": "CRITICAL",
    "model_version": "baseline-random-forest-v1",
    "recommendation": "BLOCK_AND_INVESTIGATE",
    "risk_summary": "The model detected a very high estimated probability of fraud. The transaction should be investigated before approval.",
    "decision_metadata": {
      "thresholds": { "low_max": 30, "medium_max": 60, "high_max": 80 },
      "model_type": "RandomForestClassifier",
      "dataset_feature_type": "anonymized_transaction_features"
    }
  }
  ```

---

## Setup & Installation Instructions

### Prerequisites
- **Python**: Version 3.10 or higher (tested on 3.12)
- **Node.js**: Version 18 or higher (tested on Node 20+)
- **npm**: Version 9 or higher

---

### Backend Setup

1. **Navigate to the project root**:
   ```bash
   cd C:\Users\MJYOT\ai-payment-fraud-investigator
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI backend**:
   ```bash
   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The interactive Swagger API documentation will be accessible at: `http://127.0.0.1:8000/docs`.

---

### Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd C:\Users\MJYOT\ai-payment-fraud-investigator\frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The dashboard will be available at: `http://localhost:5173`.

---

## How to Run the Demo

1. Ensure the **FastAPI backend** is running on port 8000.
2. Open `http://localhost:5173` in your browser.
3. In the sidebar, select **AI Investigator**:
   - The queue displays real dataset transactions fetched from `GET /demo-transactions`.
   - Each row shows actual dataset labels (`Class 0 Genuine` vs `Class 1 Fraud`), row index, amount, and timestamp.
4. Click **INVESTIGATE** on any row:
   - The investigation drawer opens.
   - The frontend automatically posts the 30 raw model features to `POST /predict`.
   - The live risk score, risk level badge, operational recommendation, estimated fraud probability, and model version update in real time.
5. In the sidebar, select **Reports**:
   - Review executive KPIs, system uptime, and model precision metrics.
   - Click **Download Report** to export the active investigation queue as a compliance-ready CSV file.

---

## Testing & Quality Assurance

### Run Backend Tests (Pytest)
From the project root:
```bash
pytest -v
```
Runs 12 unit and integration tests verifying:
- Risk level threshold boundaries and recommendations
- Decision metadata shapes and summaries
- API `/health`, input validation, missing field detection, and extra field rejection
- Demo transactions endpoint integrity
- End-to-end inference scoring of real dataset rows

### Run Frontend Linter & Production Build
From the `frontend/` directory:
```bash
# Run oxlint
npm run lint

# Build production bundle
npm run build
```

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
