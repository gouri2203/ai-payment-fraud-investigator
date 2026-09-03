# AI-Powered Payment Fraud Investigator — Frontend

This is the React client for the AI-Powered Payment Fraud Investigator platform.

For the full documentation, architecture diagram, API specifications, and machine learning model telemetry, see the [Root README](../README.md).

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Run linter
npm run lint

# Build production bundle
npm run build
```

## Key Features

- **Executive Dashboard**: Real-time risk volume telemetry, flagged transaction metrics, and interactive charts (Recharts).
- **AI Investigator**: Direct integration with the FastAPI backend (`http://127.0.0.1:8000`) for loading real dataset transactions (`GET /demo-transactions`) and running live machine learning inference (`POST /predict`).
- **Reports & Audit**: Operational compliance view with a dedicated "Download Report" button for CSV export of current case queues.
- **Investigation Drawer**: In-depth transaction breakdown displaying live fraud probability, risk score gauge (0–100), operational recommendation, and ground truth validation.
