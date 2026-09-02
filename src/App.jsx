import { useState } from "react";

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

function getRiskClass(level) {
  return level.toLowerCase();
}

function App() {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [status, setStatus] = useState({});
  const [notes, setNotes] = useState("");

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
                title="Cases Requiring Review"
                value={allHighRiskTransactions.length}
                change="+8.2%"
                icon={<AlertTriangle size={24} />}
              />

              <Kpi
                title="Critical Cases"
                value={criticalCount}
                change="+5.1%"
                icon={<ShieldAlert size={24} />}
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
                  <h2>AI Investigation Queue</h2>
                  <p>
                    Select a transaction to view AI risk reasoning and analyst
                    actions
                  </p>
                </div>
              </div>

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
                    {allHighRiskTransactions.map((transaction) => (
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
                            onClick={() => openInvestigation(transaction)}
                          >
                            INVESTIGATE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
{/* ================= REPORTS ================= */}
{activePage === "Reports" && (
  <>
    <section className="card report-main-card">
      <div className="section-header">
        <div>
          <h2>Fraud Investigation Report</h2>
          <p>Current transaction risk and investigation summary</p>
        </div>

        <button
          className="investigate-button"
          onClick={() =>
            alert("Report generated locally in demo mode.")
          }
        >
          GENERATE REPORT
        </button>
      </div>

      <div className="report-summary">
        <div>
          <span>Total Transactions</span>
          <strong>{transactions.length}</strong>
        </div>

        <div>
          <span>Critical</span>
          <strong>{criticalCount}</strong>
        </div>

        <div>
          <span>High</span>
          <strong>{highCount}</strong>
        </div>

        <div>
          <span>Confirmed Fraud</span>
          <strong>{confirmedFraudCount}</strong>
        </div>

        <div>
          <span>Amount at Risk</span>
          <strong>₹{amountAtRisk.toLocaleString()}</strong>
        </div>
      </div>
    </section>

    <section className="analytics-grid reports-grid">
      <div className="card model-card">
        <h2>Model Performance</h2>
        <p>Baseline Random Forest Model</p>

        <Metric label="PR-AUC" value="0.8629" />
        <Metric label="Precision" value="0.9059" />
        <Metric label="Recall" value="0.7857" />
        <Metric label="F1 Score" value="0.8415" />
      </div>

      <div className="card model-card">
        <h2>Report Status</h2>
        <p>System-generated fraud monitoring summary</p>

        <Metric label="Detection Engine" value="ONLINE" />
        <Metric label="Database" value="DEMO MODE" />
        <Metric label="Risk Monitoring" value="ACTIVE" />

        <Metric
          label="Investigation Queue"
          value={allHighRiskTransactions.length}
        />
      </div>
    </section>

    <section className="card">
      <div className="section-header">
        <div>
          <h2>Investigation Summary</h2>
          <p>High-risk cases included in the current report</p>
        </div>
      </div>

      <TransactionTable
        transactions={allHighRiskTransactions}
        onInvestigate={openInvestigation}
        status={status}
      />
    </section>
  </>
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

            <div
              className={`risk-circle ${getRiskClass(
                selectedTransaction.riskLevel
              )}`}
            >
              <strong>{selectedTransaction.riskScore}</strong>
              <span>/100</span>
            </div>

            <span
              className={`risk-badge ${getRiskClass(
                selectedTransaction.riskLevel
              )}`}
            >
              {selectedTransaction.riskLevel}
            </span>

            <div className="drawer-section">
              <h3>AI Risk Decision</h3>

              <p>{selectedTransaction.riskSummary}</p>

              <div className="recommendation">
                {selectedTransaction.recommendation}
              </div>
            </div>

            <div className="drawer-section">
              <h3>Transaction Details</h3>

              <p>
                <b>Amount:</b> ₹
                {selectedTransaction.amount.toLocaleString()}
              </p>

              <p>
                <b>Payment:</b> {selectedTransaction.paymentMethod}
              </p>

              <p>
                <b>Time:</b> {selectedTransaction.time}
              </p>
            </div>

            <div className="drawer-section demo-context">
              <h3>Demo Investigation Context</h3>

              <small>
                Demo Context — synthetic metadata for visualization
              </small>

              <p>
                <b>Merchant:</b> {selectedTransaction.merchant}
              </p>

              <p>
                <b>Customer:</b> {selectedTransaction.customer}
              </p>

              <p>
                <b>Device:</b> {selectedTransaction.device}
              </p>

              <p>
                <b>Location:</b> {selectedTransaction.location}
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