import { useState, useEffect } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Search,
  ShieldAlert,
  Brain,
  FileText,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./App.css";

const transactions = [
  {
    id: "TXN-982341",
    merchant: "TechWorld Store",
    customer: "Rahul Sharma",
    amount: 12500,
    riskScore: 94,
    riskLevel: "CRITICAL",
    time: "2 min ago",
    paymentMethod: "Credit Card",
    device: "Unknown Android Device",
    location: "Mumbai, India",
    recommendation: "BLOCK & INVESTIGATE",
    riskSummary:
      "The model detected a very high estimated probability of fraud. The transaction should be investigated before approval.",
  },
  {
    id: "TXN-982340",
    merchant: "QuickKart",
    customer: "Priya Patel",
    amount: 8400,
    riskScore: 82,
    riskLevel: "CRITICAL",
    time: "8 min ago",
    paymentMethod: "UPI",
    device: "Chrome Desktop",
    location: "Delhi, India",
    recommendation: "BLOCK & INVESTIGATE",
    riskSummary:
      "The model detected a very high estimated probability of fraud. Investigation is recommended before approval.",
  },
  {
    id: "TXN-982339",
    merchant: "Luxury Fashion",
    customer: "Amit Kumar",
    amount: 6799,
    riskScore: 71,
    riskLevel: "HIGH",
    time: "14 min ago",
    paymentMethod: "Credit Card",
    device: "iPhone",
    location: "Bengaluru, India",
    recommendation: "MANUAL REVIEW",
    riskSummary:
      "The model detected an elevated estimated probability of fraud. Additional verification is recommended.",
  },
  {
    id: "TXN-982338",
    merchant: "GameHub",
    customer: "Sneha Reddy",
    amount: 3200,
    riskScore: 56,
    riskLevel: "MEDIUM",
    time: "22 min ago",
    paymentMethod: "Debit Card",
    device: "Android",
    location: "Hyderabad, India",
    recommendation: "MONITOR",
    riskSummary:
      "The model detected a moderate estimated probability of fraud. This transaction should be monitored.",
  },
  {
    id: "TXN-982337",
    merchant: "Daily Mart",
    customer: "Vikram Singh",
    amount: 899,
    riskScore: 18,
    riskLevel: "LOW",
    time: "31 min ago",
    paymentMethod: "UPI",
    device: "iPhone",
    location: "Pune, India",
    recommendation: "ALLOW",
    riskSummary:
      "The model found a low estimated probability of fraud for this transaction.",
  },
];

const trendData = [
  { day: "Mon", low: 320, medium: 80, high: 35, critical: 12 },
  { day: "Tue", low: 360, medium: 72, high: 41, critical: 16 },
  { day: "Wed", low: 390, medium: 91, high: 28, critical: 9 },
  { day: "Thu", low: 350, medium: 86, high: 52, critical: 19 },
  { day: "Fri", low: 410, medium: 105, high: 60, critical: 24 },
  { day: "Sat", low: 370, medium: 89, high: 45, critical: 14 },
  { day: "Sun", low: 430, medium: 96, high: 38, critical: 11 },
];

const hourData = [
  { hour: "00", fraud: 8 },
  { hour: "04", fraud: 12 },
  { hour: "08", fraud: 26 },
  { hour: "12", fraud: 38 },
  { hour: "16", fraud: 29 },
  { hour: "20", fraud: 45 },
];

const distribution = [
  { name: "Low", value: 68 },
  { name: "Medium", value: 18 },
  { name: "High", value: 9 },
  { name: "Critical", value: 5 },
];

const API_BASE_URL = "http://127.0.0.1:8000";

const FEATURE_NAMES = [
  "Time",
  ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`),
  "Amount",
];

function getRiskClass(level) {
  return level ? level.toLowerCase() : "low";
}

function App() {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [status, setStatus] = useState({});
  const [notes, setNotes] = useState("");

  const [demoTransactions, setDemoTransactions] = useState([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  const fetchDemoTransactions = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/demo-transactions`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setDemoTransactions(data);
    } catch (err) {
      setDemoError(err.message || "Failed to fetch demo transactions from backend");
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (
      activePage === "AI Investigator" &&
      demoTransactions.length === 0 &&
      !demoLoading
    ) {
      // oxlint-disable-next-line react/set-state-in-effect
      setDemoLoading(true);
      setDemoError(null);
      fetch(`${API_BASE_URL}/demo-transactions`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setDemoTransactions(data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setDemoError(
              err.message || "Failed to fetch demo transactions from backend"
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setDemoLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activePage, demoTransactions.length, demoLoading]);

  const scoreTransaction = async (txn) => {
    if (!txn || txn.V1 === undefined) return;

    setPredictLoading(true);
    setPredictError(null);
    try {
      const payload = {};
      for (const key of FEATURE_NAMES) {
        payload[key] = Number(txn[key]);
      }

      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.detail || `HTTP ${res.status}: ${res.statusText}`
        );
      }

      const prediction = await res.json();
      setPredictions((prev) => ({
        ...prev,
        [txn.id]: prediction,
      }));
    } catch (err) {
      setPredictError(
        err.message || "Failed to score transaction with live /predict"
      );
    } finally {
      setPredictLoading(false);
    }
  };

  const openDemoInvestigation = (transaction) => {
    setSelectedTransaction(transaction);
    setNotes("");
    scoreTransaction(transaction);
  };

  const updateStatus = (id, value) => {
    setStatus((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  const openInvestigation = (transaction) => {
    setSelectedTransaction(transaction);
    setNotes("");
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return true;

    return (
      transaction.id.toLowerCase().includes(query) ||
      transaction.merchant.toLowerCase().includes(query) ||
      transaction.customer.toLowerCase().includes(query) ||
      transaction.riskLevel.toLowerCase().includes(query)
    );
  });

  const highRiskTransactions = filteredTransactions.filter(
    (transaction) =>
      transaction.riskLevel === "HIGH" ||
      transaction.riskLevel === "CRITICAL"
  );

  const allHighRiskTransactions = transactions.filter(
    (transaction) =>
      transaction.riskLevel === "HIGH" ||
      transaction.riskLevel === "CRITICAL"
  );

  const criticalCount = transactions.filter(
    (transaction) => transaction.riskLevel === "CRITICAL"
  ).length;

  const highCount = transactions.filter(
    (transaction) => transaction.riskLevel === "HIGH"
  ).length;

  const confirmedFraudCount = Object.values(status).filter(
    (value) => value === "CONFIRMED FRAUD"
  ).length;

  const amountAtRisk = transactions
    .filter(
      (transaction) =>
        transaction.riskLevel === "HIGH" ||
        transaction.riskLevel === "CRITICAL"
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const handleDownloadReport = () => {
    const csvHeaders = [
      "Transaction ID",
      "Merchant",
      "Customer",
      "Amount (INR)",
      "Risk Score",
      "Risk Level",
      "Time",
      "Payment Method",
      "Device",
      "Location",
      "Recommendation",
      "Investigation Status",
      "Risk Summary",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    const dataRows = allHighRiskTransactions.map((tx) => [
      escapeCsv(tx.id),
      escapeCsv(tx.merchant),
      escapeCsv(tx.customer),
      tx.amount,
      tx.riskScore,
      escapeCsv(tx.riskLevel),
      escapeCsv(tx.time),
      escapeCsv(tx.paymentMethod),
      escapeCsv(tx.device),
      escapeCsv(tx.location),
      escapeCsv(tx.recommendation),
      escapeCsv(status[tx.id] || "PENDING REVIEW"),
      escapeCsv(tx.riskSummary),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...dataRows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `fraud-investigation-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldAlert size={24} />
          </div>

          <div>
            <strong>AI RISK</strong>
            <span>MANAGER</span>
          </div>
        </div>

        <nav>
          <button
            className={`nav-item ${
              activePage === "Dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("Dashboard")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "Transactions" ? "active" : ""
            }`}
            onClick={() => setActivePage("Transactions")}
          >
            <CreditCard size={19} />
            Transactions
          </button>

          <button
            className={`nav-item ${
              activePage === "Alerts" ? "active" : ""
            }`}
            onClick={() => setActivePage("Alerts")}
          >
            <AlertTriangle size={19} />
            Alerts
          </button>

          <button
            className={`nav-item ${
              activePage === "Analytics" ? "active" : ""
            }`}
            onClick={() => setActivePage("Analytics")}
          >
            <Activity size={19} />
            Analytics
          </button>

          <button
            className={`nav-item ${
              activePage === "AI Investigator" ? "active" : ""
            }`}
            onClick={() => setActivePage("AI Investigator")}
          >
            <Brain size={19} />
            AI Investigator
          </button>

          <button
            className={`nav-item ${
              activePage === "Reports" ? "active" : ""
            }`}
            onClick={() => setActivePage("Reports")}
          >
            <FileText size={19} />
            Reports
          </button>
        </nav>

        <div className="system-status">
          <p>SYSTEM STATUS</p>

          <div>
            <span className="online-dot" />
            Model <b>Online</b>
          </div>

          <div>
            <span className="online-dot" />
            API <b>Online</b>
          </div>

          <div>
            <span className="demo-dot" />
            Database <b>Demo Mode</b>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* TOP BAR */}
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>

            <p>
              {activePage === "Dashboard" &&
                "Real-time transaction risk monitoring and fraud investigation"}

              {activePage === "Transactions" &&
                "View and investigate all transactions"}

              {activePage === "Alerts" &&
                "Transactions requiring immediate attention"}

              {activePage === "Analytics" &&
                "AI-powered transaction risk analytics and model performance"}

              {activePage === "AI Investigator" &&
                "Investigate suspicious transactions with AI risk insights"}

              {activePage === "Reports" &&
                "Fraud detection reports and investigation summaries"}
            </p>
          </div>

          <div className="search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </header>

        {/* ================= DASHBOARD ================= */}
        {activePage === "Dashboard" && (
          <>
            <section className="kpis">
              <Kpi
                title="Total Transactions"
                value={filteredTransactions.length}
                change="+12.4%"
                icon={<Activity size={24} />}
              />

              <Kpi
                title="High Risk Cases"
                value={highRiskTransactions.length}
                change="+8.2%"
                icon={<AlertTriangle size={24} />}
              />

              <Kpi
                title="Fraud Confirmed"
                value={confirmedFraudCount}
                change="+4.7%"
                icon={<ShieldAlert size={24} />}
              />

              <Kpi
                title="Risk Amount"
                value={`₹${amountAtRisk.toLocaleString()}`}
                change="+15.1%"
                icon={<DollarSign size={24} />}
              />
            </section>

            <section className="card chart-card">
              <div className="section-header">
                <div>
                  <h2>Risk Activity</h2>
                  <p>Seven-day transaction risk trend</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="low"
                    stackId="1"
                    fill="#2563eb"
                    stroke="#2563eb"
                  />

                  <Area
                    type="monotone"
                    dataKey="medium"
                    stackId="1"
                    fill="#f59e0b"
                    stroke="#f59e0b"
                  />

                  <Area
                    type="monotone"
                    dataKey="high"
                    stackId="1"
                    fill="#f97316"
                    stroke="#f97316"
                  />

                  <Area
                    type="monotone"
                    dataKey="critical"
                    stackId="1"
                    fill="#ef4444"
                    stroke="#ef4444"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="card">
              <div className="section-header">
                <div>
                  <h2>High Risk Transactions</h2>
                  <p>Transactions requiring attention</p>
                </div>
              </div>

              <TransactionTable
                transactions={highRiskTransactions}
                onInvestigate={openInvestigation}
                status={status}
              />
            </section>
          </>
        )}

        {/* ================= TRANSACTIONS ================= */}
        {activePage === "Transactions" && (
          <section className="card">
            <div className="section-header">
              <div>
                <h2>All Transactions</h2>
                <p>View and investigate all transactions</p>
              </div>
            </div>

            <TransactionTable
              transactions={filteredTransactions}
              onInvestigate={openInvestigation}
              status={status}
            />
          </section>
        )}

        {/* ================= ALERTS ================= */}
        {activePage === "Alerts" && (
          <>
            <section className="kpis">
              <Kpi
                title="Critical Cases"
                value={criticalCount}
                change="+5.1%"
                icon={<ShieldAlert size={24} />}
              />

              <Kpi
                title="High Risk Cases"
                value={highCount}
                change="+8.2%"
                icon={<AlertTriangle size={24} />}
              />

              <Kpi
                title="Confirmed Fraud"
                value={confirmedFraudCount}
                change="+4.7%"
                icon={<CheckCircle2 size={24} />}
              />

              <Kpi
                title="Investigation Queue"
                value={allHighRiskTransactions.length}
                change="Active"
                icon={<Activity size={24} />}
              />
            </section>

            <section className="card">
              <div className="section-header">
                <div>
                  <h2>Risk Alerts</h2>
                  <p>Transactions requiring immediate attention</p>
                </div>
              </div>

              <TransactionTable
                transactions={highRiskTransactions}
                onInvestigate={openInvestigation}
                status={status}
              />
            </section>
          </>
        )}

        {/* ================= ANALYTICS ================= */}
        {activePage === "Analytics" && (
          <>
            <section className="kpis">
              <Kpi
                title="Transactions Analyzed"
                value={transactions.length}
                change="+12.4%"
                icon={<Activity size={24} />}
              />

              <Kpi
                title="High Risk Rate"
                value="60%"
                change="+8.2%"
                icon={<AlertTriangle size={24} />}
              />

              <Kpi
                title="Fraud Cases"
                value={confirmedFraudCount}
                change="+4.7%"
                icon={<ShieldAlert size={24} />}
              />

              <Kpi
                title="Risk Exposure"
                value={`₹${amountAtRisk.toLocaleString()}`}
                change="+15.1%"
                icon={<DollarSign size={24} />}
              />
            </section>

            <section className="analytics-grid">
              <div className="card analytics-chart-card">
                <h2>Risk Activity</h2>
                <p>Seven-day transaction risk trend</p>

                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={trendData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="low"
                      stackId="1"
                      fill="#2563eb"
                      stroke="#2563eb"
                    />

                    <Area
                      type="monotone"
                      dataKey="medium"
                      stackId="1"
                      fill="#f59e0b"
                      stroke="#f59e0b"
                    />

                    <Area
                      type="monotone"
                      dataKey="high"
                      stackId="1"
                      fill="#f97316"
                      stroke="#f97316"
                    />

                    <Area
                      type="monotone"
                      dataKey="critical"
                      stackId="1"
                      fill="#ef4444"
                      stroke="#ef4444"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card analytics-chart-card">
                <h2>Fraud Activity by Hour</h2>
                <p>Fraud alerts by transaction hour</p>

                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={hourData}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />

                    <Bar
                      dataKey="fraud"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card analytics-chart-card">
                <h2>Risk Distribution</h2>

                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            [
                              "#2563eb",
                              "#f59e0b",
                              "#f97316",
                              "#ef4444",
                            ][index]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card model-card">
                <h2>Model Performance</h2>
                <p>Baseline Random Forest Model</p>

                <Metric label="PR-AUC" value="0.8629" />
                <Metric label="Precision" value="0.9059" />
                <Metric label="Recall" value="0.7857" />
                <Metric label="F1 Score" value="0.8415" />
              </div>
            </section>
          </>
        )}

        {/* ================= AI INVESTIGATOR ================= */}
        {activePage === "AI Investigator" && (
          <>
            <section className="kpis">
              <Kpi
                title="Demo Dataset Pool"
                value={
                  demoTransactions.length
                    ? `${demoTransactions.length} Transactions`
                    : "Loading..."
                }
                change="Curated Sample"
                icon={<AlertTriangle size={24} />}
              />

              <Kpi
                title="Actual Fraud Cases"
                value={
                  demoTransactions.length
                    ? `${
                        demoTransactions.filter((t) => t.Class === 1).length
                      } Cases`
                    : "--"
                }
                change="Class 1 (Fraud)"
                icon={<ShieldAlert size={24} />}
              />

              <Kpi
                title="Actual Genuine Cases"
                value={
                  demoTransactions.length
                    ? `${
                        demoTransactions.filter((t) => t.Class === 0).length
                      } Cases`
                    : "--"
                }
                change="Class 0 (Genuine)"
                icon={<CheckCircle2 size={24} />}
              />

              <Kpi
                title="Live Model Status"
                value="ONLINE"
                change="Random Forest v1"
                icon={<Activity size={24} />}
              />
            </section>

            <section className="card">
              <div
                className="section-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <h2>AI Investigation Queue (Live Dataset Sample)</h2>
                  <p>
                    Select an actual dataset transaction to score 30 model
                    features (Time, V1–V28, Amount) against POST /predict
                  </p>
                </div>

                <button
                  type="button"
                  className="investigate-button"
                  onClick={fetchDemoTransactions}
                  disabled={demoLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Reload demo transactions from backend"
                >
                  <RefreshCw size={13} />
                  {demoLoading ? "LOADING..." : "REFRESH DATA"}
                </button>
              </div>

              {demoLoading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#667085",
                  }}
                >
                  <p>
                    Fetching demo transactions from{" "}
                    <code>{API_BASE_URL}/demo-transactions</code>...
                  </p>
                </div>
              )}

              {demoError && (
                <div
                  style={{
                    padding: "18px 20px",
                    color: "#dc2626",
                    background: "#fee2e2",
                    borderRadius: "10px",
                    margin: "16px 0",
                    border: "1px solid #fecaca",
                  }}
                >
                  <p style={{ fontWeight: "bold", margin: 0 }}>
                    Failed to connect to backend demo API
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      margin: "6px 0 12px",
                      color: "#991b1b",
                    }}
                  >
                    {demoError}
                  </p>
                  <button
                    type="button"
                    className="investigate-button"
                    onClick={fetchDemoTransactions}
                  >
                    RETRY CONNECTION
                  </button>
                </div>
              )}

              {!demoLoading && !demoError && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Dataset Row</th>
                        <th>Amount</th>
                        <th>Ground Truth</th>
                        <th>Live Risk Score</th>
                        <th>Recommendation</th>
                        <th>Elapsed Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {demoTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            style={{ textAlign: "center", padding: "30px" }}
                          >
                            No demo transactions loaded.
                          </td>
                        </tr>
                      ) : (
                        demoTransactions.map((transaction) => {
                          const pred = predictions[transaction.id];
                          return (
                            <tr key={transaction.id}>
                              <td>
                                <strong>{transaction.id}</strong>
                              </td>
                              <td>Index #{transaction.dataset_index}</td>
                              <td>
                                ₹
                                {Number(transaction.Amount).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td>
                                <span
                                  className={`risk-badge ${
                                    transaction.Class === 1 ? "critical" : "low"
                                  }`}
                                >
                                  {transaction.Class === 1
                                    ? "Fraud (Class 1)"
                                    : "Genuine (Class 0)"}
                                </span>
                              </td>

                              <td>
                                {pred ? (
                                  <strong>{pred.risk_score}/100</strong>
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Pending Scoring
                                  </span>
                                )}
                              </td>

                              <td>
                                {pred ? (
                                  <span
                                    className={`risk-badge ${getRiskClass(
                                      pred.risk_level
                                    )}`}
                                  >
                                    {pred.recommendation.replace(/_/g, " ")}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                    }}
                                  >
                                    —
                                  </span>
                                )}
                              </td>

                              <td>{transaction.Time}s</td>

                              <td>
                                <button
                                  className="investigate-button"
                                  onClick={() =>
                                    openDemoInvestigation(transaction)
                                  }
                                >
                                  INVESTIGATE
                                </button>
                                {status[transaction.id] && (
                                  <small className="status-label">
                                    {status[transaction.id]}
                                  </small>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
{/* ================= REPORTS ================= */}
{activePage === "Reports" && (
  <div className="reports-page">
    <section className="card report-header-card">
      <div className="report-header-info">
        <div className="report-kicker">
          <FileText size={14} />
          <span>FRAUD OPERATIONS AUDIT REPORT</span>
        </div>
        <h2>Fraud Investigation Report</h2>
        <p>Comprehensive transaction risk telemetry, baseline model performance metrics, and prioritized high-risk investigation queue.</p>
        <div className="report-meta-tags">
          <span className="report-badge live">
            <span className="online-dot"></span> System Live
          </span>
          <span className="report-meta-text">
            Audit Scope: High-Risk Queue ({allHighRiskTransactions.length} cases) • Generated {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      <div className="report-actions">
        <button
          className="generate-report-button"
          onClick={() =>
            alert("Report generated locally in demo mode.")
          }
          title="Regenerate current report snapshot"
        >
          <FileText size={14} />
          GENERATE REPORT
        </button>

        <button
          className="download-report-button"
          onClick={handleDownloadReport}
          title="Export current high-risk cases and report data to CSV"
        >
          <Download size={14} />
          DOWNLOAD REPORT (CSV)
        </button>
      </div>
    </section>

    <div className="report-summary">
      <div className="report-stat">
        <span>Total Transactions</span>
        <strong>{transactions.length}</strong>
        <small className="report-stat-hint">Active session pool</small>
      </div>

      <div className="report-stat critical">
        <span>Critical</span>
        <strong className="danger-text">{criticalCount}</strong>
        <small className="report-stat-hint danger-text">Immediate block required</small>
      </div>

      <div className="report-stat high">
        <span>High Risk</span>
        <strong className="warning-text">{highCount}</strong>
        <small className="report-stat-hint warning-text">Flagged for investigation</small>
      </div>

      <div className="report-stat fraud">
        <span>Confirmed Fraud</span>
        <strong className="danger-text">{confirmedFraudCount}</strong>
        <small className="report-stat-hint">Analyst confirmed cases</small>
      </div>

      <div className="report-stat exposure">
        <span>Amount at Risk</span>
        <strong className="danger-text">₹{amountAtRisk.toLocaleString()}</strong>
        <small className="report-stat-hint">Critical + high exposure</small>
      </div>
    </div>

    <div className="report-two-column">
      <div className="card report-card">
        <div className="report-card-heading">
          <div>
            <h2>Model Performance</h2>
            <p>Baseline Random Forest Model evaluation metrics</p>
          </div>
          <div className="report-status-icon">
            <Brain size={20} />
          </div>
        </div>

        <div className="report-metrics-list">
          <Metric label="PR-AUC" value="0.8629" />
          <Metric label="Precision" value="0.9059" />
          <Metric label="Recall" value="0.7857" />
          <Metric label="F1 Score" value="0.8415" />
        </div>

        <div className="report-card-footer">
          <span className="model-tag">Validated Threshold: 0.70</span>
          <span className="model-tag-sub">Trained on Production Transactions</span>
        </div>
      </div>

      <div className="card report-card">
        <div className="report-card-heading">
          <div>
            <h2>Report Status</h2>
            <p>System-generated fraud monitoring telemetry</p>
          </div>
          <div className="report-status-icon">
            <Activity size={20} />
          </div>
        </div>

        <div className="report-metrics-list">
          <div className="status-row">
            <span>Detection Engine</span>
            <span className="report-status-badge online">
              <span className="online-dot"></span> ONLINE
            </span>
          </div>
          <div className="status-row">
            <span>Database</span>
            <span className="report-status-badge demo">
              <span className="demo-dot"></span> DEMO MODE
            </span>
          </div>
          <div className="status-row">
            <span>Risk Monitoring</span>
            <span className="report-status-badge active">
              ACTIVE
            </span>
          </div>
          <div className="status-row">
            <span>Investigation Queue</span>
            <strong className="queue-count">{allHighRiskTransactions.length} Flagged</strong>
          </div>
        </div>

        <div className="report-card-footer">
          <span className="model-tag success">Audit Integrity: Pass</span>
          <span className="model-tag-sub">Ready for Compliance Export</span>
        </div>
      </div>
    </div>

    <section className="card report-cases-card">
      <div className="section-header report-cases-header">
        <div>
          <h2>Investigation Summary</h2>
          <p>High-risk cases included in the current report requiring analyst action</p>
        </div>
        <div className="report-cases-badge">
          <span>{allHighRiskTransactions.length} Flagged Cases</span>
        </div>
      </div>

      <TransactionTable
        transactions={allHighRiskTransactions}
        onInvestigate={openInvestigation}
        status={status}
      />
    </section>
  </div>
)}
      </main>

      {/* ================= INVESTIGATION DRAWER ================= */}
      {selectedTransaction && (
        <>
          <div
            className="overlay"
            onClick={() => setSelectedTransaction(null)}
          />

          <aside className="drawer">
            <button
              className="close-button"
              onClick={() => setSelectedTransaction(null)}
            >
              <X size={22} />
            </button>

            <p className="drawer-label">TRANSACTION INVESTIGATION</p>

            <h2>{selectedTransaction.id}</h2>

            {selectedTransaction.V1 !== undefined && predictLoading && (
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  margin: "12px 0",
                  fontSize: "12px",
                  color: "#1d4ed8",
                }}
              >
                Scoring transaction features (Time, V1–V28, Amount) against live
                POST /predict...
              </div>
            )}

            {selectedTransaction.V1 !== undefined && predictError && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  margin: "12px 0",
                  fontSize: "12px",
                  color: "#dc2626",
                }}
              >
                <span>Scoring error: {predictError}</span>
                <button
                  type="button"
                  className="investigate-button"
                  style={{
                    marginLeft: "8px",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                  onClick={() => scoreTransaction(selectedTransaction)}
                >
                  Retry
                </button>
              </div>
            )}

            {(() => {
              const activePred = predictions[selectedTransaction.id];
              const score = activePred
                ? activePred.risk_score
                : selectedTransaction.riskScore;
              const level = activePred
                ? activePred.risk_level
                : selectedTransaction.riskLevel;
              const summary = activePred
                ? activePred.risk_summary
                : selectedTransaction.riskSummary;
              const rec = activePred
                ? activePred.recommendation.replace(/_/g, " ")
                : selectedTransaction.recommendation;

              return (
                <>
                  <div
                    className={`risk-circle ${getRiskClass(level || "low")}`}
                  >
                    <strong>{score !== undefined ? score : "--"}</strong>
                    <span>/100</span>
                  </div>

                  {level && (
                    <span className={`risk-badge ${getRiskClass(level)}`}>
                      {level}
                    </span>
                  )}

                  <div className="drawer-section">
                    <h3>
                      AI Risk Decision
                      {activePred && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "normal",
                            color: "#667085",
                            marginLeft: "6px",
                          }}
                        >
                          ({activePred.model_version})
                        </span>
                      )}
                    </h3>

                    <p>{summary || "Awaiting live risk inference..."}</p>

                    {rec && <div className="recommendation">{rec}</div>}

                    {activePred && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "8px 12px",
                          background: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      >
                        <div>
                          <b>Fraud Probability:</b>{" "}
                          {(activePred.fraud_probability * 100).toFixed(2)}%
                        </div>
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            marginTop: "3px",
                          }}
                        >
                          Model: {activePred.decision_metadata?.model_type} •
                          High Threshold: &gt;
                          {activePred.decision_metadata?.thresholds?.medium_max}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="drawer-section">
              <h3>
                Transaction Details{" "}
                {selectedTransaction.dataset_index !== undefined &&
                  "(Dataset Verified)"}
              </h3>

              <p>
                <b>Amount:</b> ₹
                {Number(
                  selectedTransaction.Amount ??
                    selectedTransaction.amount ??
                    0
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              {selectedTransaction.dataset_index !== undefined ? (
                <>
                  <p>
                    <b>Dataset Row Index:</b> Row #
                    {selectedTransaction.dataset_index} (data/creditcard.csv)
                  </p>
                  <p>
                    <b>Dataset Elapsed Time:</b> {selectedTransaction.Time}s
                  </p>
                  <p>
                    <b>Ground Truth:</b>{" "}
                    <span
                      className={`risk-badge ${
                        selectedTransaction.Class === 1 ? "critical" : "low"
                      }`}
                      style={{ fontSize: "10px" }}
                    >
                      Class {selectedTransaction.Class} (
                      {selectedTransaction.Class === 1
                        ? "Actual Fraud"
                        : "Actual Genuine"}
                      )
                    </span>
                  </p>
                  <p>
                    <b>Model Features:</b> 30 exact features (Time, V1–V28,
                    Amount)
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <b>Payment:</b> {selectedTransaction.paymentMethod}
                  </p>

                  <p>
                    <b>Time:</b> {selectedTransaction.time}
                  </p>
                </>
              )}
            </div>

            <div className="drawer-section demo-context">
              <h3>Demo Investigation Context</h3>

              <small>
                Demo Context — synthetic metadata for visualization
              </small>

              <p>
                <b>Merchant:</b>{" "}
                {selectedTransaction.merchant ||
                  `Demo Merchant #${selectedTransaction.dataset_index}`}
              </p>

              <p>
                <b>Customer:</b>{" "}
                {selectedTransaction.customer ||
                  `Customer CUST-${selectedTransaction.dataset_index}`}
              </p>

              <p>
                <b>Device:</b>{" "}
                {selectedTransaction.device ||
                  (selectedTransaction.Class === 1
                    ? "Unknown / Anomalous Device"
                    : "Chrome Desktop (Simulated)")}
              </p>

              <p>
                <b>Location:</b>{" "}
                {selectedTransaction.location ||
                  (selectedTransaction.Class === 1
                    ? "Flagged IP Location (Simulated)"
                    : "Mumbai, India (Simulated)")}
              </p>
            </div>

            <div className="drawer-section">
              <h3>Analyst Actions</h3>

              <div className="action-row">
                <button
                  type="button"
                  className="genuine"
                  onClick={() =>
                    updateStatus(
                      selectedTransaction.id,
                      "MARKED GENUINE"
                    )
                  }
                >
                  <CheckCircle2 size={17} />
                  MARK GENUINE
                </button>

                <button
                  type="button"
                  className="fraud"
                  onClick={() =>
                    updateStatus(
                      selectedTransaction.id,
                      "CONFIRMED FRAUD"
                    )
                  }
                >
                  <ShieldAlert size={17} />
                  CONFIRM FRAUD
                </button>
              </div>

              {status[selectedTransaction.id] && (
                <div className="status-label">
                  Status: {status[selectedTransaction.id]}
                </div>
              )}

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add analyst investigation notes..."
              />

              <button
                type="button"
                className="save-button"
                onClick={() =>
                  alert("Investigation saved locally (demo mode).")
                }
              >
                SAVE INVESTIGATION
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

/* ================= KPI ================= */

function Kpi({ title, value, change, icon }) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <span>{title}</span>

        <div className="kpi-icon">{icon}</div>
      </div>

      <h2>{value}</h2>

      <p className="positive">{change} vs previous period</p>
    </div>
  );
}

/* ================= METRIC ================= */

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ================= TRANSACTION TABLE ================= */

function TransactionTable({
  transactions,
  onInvestigate,
  status,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Merchant</th>
            <th>Amount</th>
            <th>Customer</th>
            <th>Risk Score</th>
            <th>Risk Level</th>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                No transactions found.
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>

                <td>{transaction.merchant}</td>

                <td>₹{transaction.amount.toLocaleString()}</td>

                <td>{transaction.customer}</td>

                <td>
                  <strong>{transaction.riskScore}/100</strong>
                </td>

                <td>
                  <span
                    className={`risk-badge ${getRiskClass(
                      transaction.riskLevel
                    )}`}
                  >
                    {transaction.riskLevel}
                  </span>
                </td>

                <td>{transaction.time}</td>

                <td>
                  <button
                    className="investigate-button"
                    onClick={() => onInvestigate(transaction)}
                  >
                    INVESTIGATE
                  </button>

                  {status[transaction.id] && (
                    <small className="status-label">
                      {status[transaction.id]}
                    </small>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;