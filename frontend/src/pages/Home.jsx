import React, { useState, useEffect } from "react";
import ImageUploader from "../components/ImageUploader";
import Loading from "../components/Loading";
import VerificationResult from "../components/VerificationResult";
import { api } from "../services/api";
import AppLogo from "../components/AppLogo";
import {
  AlertCircle,
  ClipboardCheck,
  History,
  LogOut,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

export default function Home({ onLogout }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [demoSamples, setDemoSamples] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load demo samples and history on mount
  useEffect(() => {
    async function initData() {
      try {
        const samplesRes = await api.getDemoSamples();
        if (samplesRes.success) {
          setDemoSamples(samplesRes.samples);
        }
      } catch (e) {
        console.warn("Could not fetch demo samples:", e.message);
      }

      try {
        const histRes = await api.getHistory();
        if (histRes.success) {
          setHistory(histRes.verifications || []);
        }
      } catch (e) {
        console.warn("Could not fetch history:", e.message);
      }
    }
    initData();
  }, []);

  const handleSelectFile = (file) => {
    setError(null);
    setSelectedDemo(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSelectDemo = (demo) => {
    setError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedDemo(demo);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedDemo(null);
    setError(null);
  };

  const handleResetAll = () => {
    handleClear();
    setVerificationResult(null);
    setError(null);
  };

  const handleVerify = async () => {
    if (!selectedFile && !selectedDemo) {
      setError("Please upload a package image or select a demo sample.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyProduct({
        file: selectedFile,
        demoSampleId: selectedDemo?.id,
        isDemo: Boolean(selectedDemo),
      });

      if (res.success && res.result) {
        setVerificationResult(res.result);
        // Refresh history
        try {
          const histRes = await api.getHistory();
          if (histRes.success) {
            setHistory(histRes.verifications || []);
          }
        } catch {}
      } else {
        setError(res.message || "Verification could not be completed.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      const msg =
        err.response?.data?.message ||
        "Verification service error. Please try a clearer image.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-logo-row">
          <AppLogo size={52} className="brand-logo" />
        </div>
        <div className="header-copy">
          <div className="header-badge">
            <span>SIH26034</span>
            <span className="badge-dot">•</span>
            <span>Smart India Hackathon</span>
          </div>
          <h1 className="header-title">Product Compliance Checker</h1>
          <p className="header-desc">
            Automated compliance verification under Legal Metrology (Packaged
            Commodities) Rules, 2011
          </p>
        </div>

        <div className="header-actions">
          {onLogout && (
            <button type="button" className="text-btn" onClick={onLogout}>
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          )}
          {history.length > 0 && (
            <button
              type="button"
              className="text-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={15} />
              <span>
                {showHistory
                  ? "Hide History"
                  : `Past Verifications (${history.length})`}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* History panel if toggled */}
      {showHistory && (
        <div className="history-panel">
          <h4 className="history-title">Recent Verifications</h4>
          <div className="history-list">
            {history.slice(0, 5).map((item, i) => (
              <div
                key={item._id || i}
                className="history-item"
                onClick={() => {
                  setVerificationResult(item);
                  setShowHistory(false);
                }}
              >
                <div>
                  <strong>{item.productName || "Packaged Commodity"}</strong>
                  <span className="history-date">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="history-status-col">
                  <span
                    className={`badge-pill ${item.status === "COMPLIANT" ? "pill-pass" : "pill-fail"}`}
                  >
                    {item.status} ({item.complianceScore}%)
                  </span>
                  <span
                    className={`badge-pill review-pill ${item.review?.status === "APPROVED" ? "pill-approved" : item.review?.status === "REJECTED" ? "pill-rejected" : "pill-pending"}`}
                  >
                    {item.review?.status === "APPROVED"
                      ? "Inspector Approved"
                      : item.review?.status === "REJECTED"
                        ? "Inspector Rejected"
                        : "Awaiting Inspector Review"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="error-close-btn"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {loading ? (
          <Loading />
        ) : verificationResult ? (
          <VerificationResult
            result={verificationResult}
            onReset={handleResetAll}
          />
        ) : (
          <div className="verification-workspace">
            <ImageUploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              selectedDemo={selectedDemo}
              demoSamples={demoSamples}
              onSelectFile={handleSelectFile}
              onSelectDemo={handleSelectDemo}
              onClear={handleClear}
              onVerify={handleVerify}
              loading={loading}
            />
            <aside
              className="verification-rail"
              aria-label="Verification scope"
            >
              <div className="rail-heading">
                <span>CHECK SCOPE</span>
                <ShieldCheck size={18} />
              </div>
              <div className="rail-stat">
                <ScanLine size={18} />
                <div>
                  <strong>1</strong>
                  <span>package scan</span>
                </div>
              </div>
              <div className="rail-stat">
                <ClipboardCheck size={18} />
                <div>
                  <strong>7</strong>
                  <span>mandatory declarations</span>
                </div>
              </div>
              <div className="rail-rule" />
              <p>
                Product name, manufacturer, quantity, MRP, date, address, and
                consumer care.
              </p>
              <span className="rail-note">
                Preliminary decision support · Rule 6
              </span>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
