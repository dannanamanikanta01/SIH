import React, { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "../services/api";
import InspectorScan from "./InspectorScan";

export default function RoleDashboard({ user, onLogout }) {
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    compliant: 0,
    nonCompliant: 0,
  });
  const [busyId, setBusyId] = useState(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [accountMessage, setAccountMessage] = useState(null);
  const [showInspectorScan, setShowInspectorScan] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const isAdmin = user.role === "admin";
  const visibleHistory = isAdmin
    ? history
    : history.filter((item) => item.review?.status === "PENDING");

  useEffect(() => {
    api
      .getHistory()
      .then((result) => setHistory(result.verifications || []))
      .catch(() => {});
    if (isAdmin) {
      api
        .getAdminUsers()
        .then((result) => setUsers(result.users || []))
        .catch(() => {});
      api
        .getAdminStats()
        .then((result) =>
          setStats(
            result.stats || {
              totalVerifications: 0,
              compliant: 0,
              nonCompliant: 0,
            },
          ),
        )
        .catch(() => {});
    }
  }, [isAdmin]);

  const refreshHistory = async () => {
    const result = await api.getHistory();
    setHistory(result.verifications || []);
  };

  useEffect(() => {
    if (isAdmin) return undefined;

    const refreshTimer = window.setInterval(() => {
      refreshHistory().catch(() => {});
    }, 3000);

    return () => window.clearInterval(refreshTimer);
  }, [isAdmin]);

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setAccountMessage(null);
    try {
      await api.createAdminUser(accountForm);
      setAccountForm({ name: "", email: "", password: "", role: "user" });
      setAccountMessage("Account created.");
      const result = await api.getAdminUsers();
      setUsers(result.users || []);
    } catch (error) {
      setAccountMessage(
        error.response?.data?.message || "Could not create account.",
      );
    }
  };

  const handleToggleAccount = async (account) => {
    setBusyId(account.id);
    try {
      const result = await api.updateAdminUser(account.id, {
        isActive: !account.isActive,
      });
      setUsers((current) =>
        current.map((item) => (item.id === account.id ? result.user : item)),
      );
    } finally {
      setBusyId(null);
    }
  };

  if (showInspectorScan) {
    return (
      <InspectorScan
        verification={selectedVerification}
        verificationId={selectedVerification?._id}
        onBack={async () => {
          await refreshHistory();
          setShowInspectorScan(false);
          setSelectedVerification(null);
        }}
        onLogout={onLogout}
      />
    );
  }

  return (
    <main className="role-shell">
      <header className="role-header">
        <div className="role-brand">
          <ShieldCheck size={25} />
          <span>Compliance Desk</span>
        </div>
        <nav className="role-nav" aria-label="Workspace navigation">
          <button className="icon-text-btn" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </nav>
      </header>
      <section className="role-intro">
        <div>
          <p className="eyebrow">
            {isAdmin ? "ADMIN CONTROL ROOM" : "INSPECTOR WORKSPACE"}
          </p>
          <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
          <p>Track package checks and keep every decision traceable.</p>
        </div>
        <span className="role-chip">{user.role}</span>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <ClipboardCheck size={20} />
          <span>Total verifications</span>
          <strong>{isAdmin ? stats.totalVerifications : history.length}</strong>
        </div>
        <div className="metric-card metric-good">
          <BarChart3 size={20} />
          <span>Compliant</span>
          <strong>
            {isAdmin
              ? stats.compliant
              : history.filter((item) => item.status === "COMPLIANT").length}
          </strong>
        </div>
        <div className="metric-card metric-alert">
          <Users size={20} />
          <span>{isAdmin ? "Managed accounts" : "Needs attention"}</span>
          <strong>
            {isAdmin
              ? users.length
              : history.filter((item) => item.status !== "COMPLIANT").length}
          </strong>
        </div>
      </section>

      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {isAdmin ? "ALL ACTIVITY" : "REVIEW QUEUE"}
            </p>
            <h2>Recent verifications</h2>
          </div>
          <span>{visibleHistory.length} records</span>
        </div>
        {visibleHistory.length === 0 ? (
          <p className="empty-state">No verification records yet.</p>
        ) : (
          <div className="record-list">
            {visibleHistory.slice(0, 10).map((item) => (
              <div className="record-row" key={item._id}>
                <div>
                  <strong>{item.productName || "Packaged commodity"}</strong>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </div>
                <span
                  className={`status-tag ${item.status === "COMPLIANT" ? "status-good" : "status-bad"}`}
                >
                  {item.status} / {item.complianceScore}%
                </span>
                <span
                  className={`status-tag ${item.review?.status === "APPROVED" ? "status-good" : item.review?.status === "REJECTED" ? "status-bad" : "status-pending"}`}
                >
                  {item.review?.status || "PENDING"}
                </span>
                {!isAdmin && item.review?.status === "PENDING" && (
                  <button
                    className="small-action-btn approve-btn"
                    onClick={() => {
                      setSelectedVerification(item);
                      setShowInspectorScan(true);
                    }}
                  >
                    Scan & review
                  </button>
                )}
                {isAdmin && (
                  <button
                    className="small-action-btn"
                    onClick={() => api.downloadReport(item._id)}
                    title="Download report"
                  >
                    <FileText size={15} />
                  </button>
                )}
                {!isAdmin && (
                  <span className="review-owner-label">User submission</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW ACCOUNT</p>
              <h2>Add access</h2>
            </div>
          </div>
          <form className="account-form" onSubmit={handleCreateAccount}>
            <input
              placeholder="Full name"
              value={accountForm.name}
              onChange={(event) =>
                setAccountForm({ ...accountForm, name: event.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={accountForm.email}
              onChange={(event) =>
                setAccountForm({ ...accountForm, email: event.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={accountForm.password}
              onChange={(event) =>
                setAccountForm({ ...accountForm, password: event.target.value })
              }
              required
            />
            <select
              value={accountForm.role}
              onChange={(event) =>
                setAccountForm({ ...accountForm, role: event.target.value })
              }
            >
              <option value="user">User</option>
              <option value="inspector">Inspector</option>
              <option value="admin">Admin</option>
            </select>
            <button className="primary-btn" type="submit">
              Create account
            </button>
          </form>
          {accountMessage && <p className="form-note">{accountMessage}</p>}
        </section>
      )}

      {isAdmin && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DIRECTORY</p>
              <h2>Access accounts</h2>
            </div>
            <span>{users.length} accounts</span>
          </div>
          <div className="record-list">
            {users.map((account) => (
              <div className="record-row" key={account.id}>
                <div>
                  <strong>{account.name}</strong>
                  <small>{account.email}</small>
                </div>
                <div className="account-actions">
                  <span className="role-chip">{account.role}</span>
                  <span
                    className={`status-tag ${account.isActive ? "status-good" : "status-bad"}`}
                  >
                    {account.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    className="small-action-btn"
                    disabled={busyId === account.id}
                    onClick={() => handleToggleAccount(account)}
                  >
                    {account.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
