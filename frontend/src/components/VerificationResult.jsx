import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Info,
} from "lucide-react";
import { api } from "../services/api";

export default function VerificationResult({
  result,
  onReset,
  canReview = false,
  onReviewUpdated,
  reviewId,
}) {
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [review, setReview] = useState(
    result?.review || { status: "PENDING", note: "" },
  );
  const [reviewNote, setReviewNote] = useState(result?.review?.note || "");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    setReview(result?.review || { status: "PENDING", note: "" });
    setReviewNote(result?.review?.note || "");
  }, [result]);

  if (!result) return null;

  const isCompliant = result.status === "COMPLIANT";
  const score = result.complianceScore ?? 0;
  const checks = result.checks || [];
  const issues = result.detectedIssues || [];
  const extracted = result.extractedData || {};
  const reviewStatus = review.status || "PENDING";
  const reviewApproved = reviewStatus === "APPROVED";
  const reviewRejected = reviewStatus === "REJECTED";
  const canDownloadReport = canReview || reviewApproved || reviewRejected;

  const handleDownloadReport = async () => {
    const reportId = reviewId || result._id;
    if (!reportId) return;
    setReportLoading(true);
    try {
      await api.downloadReport(reportId);
    } finally {
      setReportLoading(false);
    }
  };

  const handleReview = async (status) => {
    const targetId = reviewId || result._id;
    if (!targetId) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const response = await api.updateReview(targetId, {
        status,
        note: reviewNote,
      });
      if (!response.result) {
        throw new Error("The verification record could not be updated.");
      }
      setReview(response.result?.review || { status, note: reviewNote });
      onReviewUpdated?.(
        response.result?.review || { status, note: reviewNote },
      );
    } catch (error) {
      setReviewError(
        error.response?.data?.message ||
          error.message ||
          "Could not save the inspector decision.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="result-card">
      {/* Result Header */}
      <div className="result-header">
        <div className="product-title-row">
          <span className="result-tagline">Verification Result</span>
          <h2 className="product-name">
            {result.productName || "Packaged Commodity"}
          </h2>
          {result.isDemo && (
            <span className="demo-badge">Demo / Prototype Sample</span>
          )}
        </div>
        <div className={`review-summary review-${reviewStatus.toLowerCase()}`}>
          <ShieldCheck size={18} />
          <div>
            <strong>
              {reviewApproved
                ? "Inspector Approved"
                : reviewRejected
                  ? "Inspector Rejected"
                  : "Awaiting Inspector Review"}
            </strong>
            <span>
              {review.note ||
                (reviewApproved
                  ? "This verification has been reviewed and approved."
                  : reviewRejected
                    ? "Please review the inspector feedback below."
                    : "An inspector has not reviewed this verification yet.")}
            </span>
          </div>
        </div>
      </div>

      {/* Status & Score Banner */}
      <div
        className={`status-banner ${isCompliant ? "status-compliant" : "status-non-compliant"}`}
      >
        <div className="status-main">
          <div className="status-icon">
            {isCompliant ? (
              <ShieldCheck size={42} />
            ) : (
              <ShieldAlert size={42} />
            )}
          </div>
          <div className="status-text-block">
            <span className="status-label">Overall Status</span>
            <span className="status-title">
              {isCompliant ? "✓ COMPLIANT" : "✗ NON-COMPLIANT"}
            </span>
          </div>
        </div>

        <div className="score-badge">
          <span className="score-label">Compliance Score</span>
          <div className="score-value-row">
            <span className="score-num">{score}%</span>
          </div>
          <span className="score-sub">
            {result.totalPassed || 0} of {result.totalRules || checks.length}{" "}
            Rules Passed
          </span>
        </div>
      </div>

      {/* Mandatory Declarations Section */}
      <div className="declarations-section">
        <h3 className="section-title">Mandatory Declarations</h3>
        <p className="section-subtitle">
          Under the Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6):
        </p>

        <div className="checks-list">
          {checks.map((check) => {
            const passed = check.status === "PASS";
            return (
              <div
                key={check.id || check.name}
                className={`check-item ${passed ? "check-pass" : "check-fail"}`}
              >
                <div className="check-status-col">
                  {passed ? (
                    <CheckCircle2 size={22} className="pass-icon" />
                  ) : (
                    <XCircle size={22} className="fail-icon" />
                  )}
                </div>

                <div className="check-details-col">
                  <div className="check-name-row">
                    <span className="check-name">{check.name}</span>
                    <span
                      className={`check-badge ${passed ? "badge-pass" : "badge-fail"}`}
                    >
                      {check.status}
                    </span>
                  </div>

                  {passed && check.detectedValue && (
                    <div className="detected-value">
                      <strong>Detected:</strong> {check.detectedValue}
                    </div>
                  )}

                  {!passed && check.reason && (
                    <div className="fail-reason">
                      <AlertTriangle size={14} />
                      <span>{check.reason}</span>
                    </div>
                  )}

                  {check.ruleReference && (
                    <span className="rule-reference">
                      {check.ruleReference}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detected Issues Callout */}
      {issues.length > 0 && (
        <div className="issues-card">
          <div className="issues-header">
            <AlertTriangle size={18} className="issue-header-icon" />
            <h4 className="issues-title">Detected Issues & Violations</h4>
          </div>
          <ol className="issues-list">
            {issues.map((issue, idx) => (
              <li key={idx} className="issue-item">
                {issue}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Raw Extracted Data Accordion */}
      <div className="raw-accordion">
        <button
          type="button"
          className="accordion-toggle"
          onClick={() => setShowRawOcr(!showRawOcr)}
        >
          <FileText size={16} />
          <span>View Extracted Package Data & Raw OCR</span>
          {showRawOcr ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showRawOcr && (
          <div className="accordion-content">
            <div className="key-value-grid">
              <div>
                <strong>Product:</strong>{" "}
                {extracted.productName || "Not detected"}
              </div>
              <div>
                <strong>Manufacturer:</strong>{" "}
                {extracted.manufacturer || "Not detected"}
              </div>
              <div>
                <strong>Address:</strong> {extracted.address || "Not detected"}
              </div>
              <div>
                <strong>Net Quantity:</strong>{" "}
                {extracted.netQuantity || "Not detected"}
              </div>
              <div>
                <strong>MRP:</strong> {extracted.mrp || "Not detected"}
              </div>
              <div>
                <strong>Mfg / Pkd Date:</strong>{" "}
                {extracted.manufacturingDate || "Not detected"}
              </div>
              <div>
                <strong>Consumer Care:</strong>{" "}
                {extracted.consumerCare || "Not detected"}
              </div>
            </div>

            {extracted.rawText && (
              <div className="raw-text-box">
                <span className="raw-text-label">Raw OCR Output:</span>
                <pre>{extracted.rawText}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legal Metrology Disclaimer */}
      <div className="legal-disclaimer">
        <Info size={15} />
        <span>
          <strong>Disclaimer:</strong> Prototype decision-support tool for
          preliminary package compliance checking under Legal Metrology
          (Packaged Commodities) Rules, 2011. Not a legally binding or
          authoritative determination.
        </span>
      </div>

      {/* Action to scan another */}
      <div className="action-footer">
        {canDownloadReport && (
          <button
            type="button"
            className="secondary-btn report-btn"
            onClick={handleDownloadReport}
            disabled={reportLoading || !(reviewId || result._id)}
          >
            <FileText size={18} />
            <span>
              {reportLoading ? "Preparing report..." : "Download Report"}
            </span>
          </button>
        )}
        <button type="button" className="scan-another-btn" onClick={onReset}>
          <RotateCcw size={18} />
          <span>Scan Another Product</span>
        </button>
      </div>

      {canReview && (
        <div className="inspector-review-panel">
          <div>
            <p className="eyebrow">INSPECTOR DECISION</p>
            <h3>Record review outcome</h3>
          </div>
          {reviewError && <p className="form-error">{reviewError}</p>}
          <input
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Add an inspection note"
            aria-label="Inspection note"
          />
          <div className="inspector-review-actions">
            <button
              type="button"
              className="small-action-btn approve-btn"
              disabled={reviewLoading}
              onClick={() => handleReview("APPROVED")}
            >
              Approve
            </button>
            <button
              type="button"
              className="small-action-btn reject-btn"
              disabled={reviewLoading}
              onClick={() => handleReview("REJECTED")}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
