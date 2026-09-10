import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import ImageUploader from "../components/ImageUploader";
import Loading from "../components/Loading";
import VerificationResult from "../components/VerificationResult";
import { api } from "../services/api";

export default function InspectorScan({
  verification,
  verificationId,
  onBack,
  onLogout,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [demoSamples, setDemoSamples] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getDemoSamples()
      .then((response) => setDemoSamples(response.samples || []))
      .catch(() => setDemoSamples([]));
  }, []);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedDemo(null);
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
      const response = await api.verifyProduct({
        file: selectedFile,
        demoSampleId: selectedDemo?.id,
        isDemo: Boolean(selectedDemo),
        verificationId,
      });
      if (response.success && response.result) {
        setResult(response.result);
      } else {
        setError(response.message || "Verification could not be completed.");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Verification service error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    clearSelection();
    setResult(null);
  };

  return (
    <main className="role-shell inspector-scan-shell">
      <header className="role-header">
        <div className="role-brand">
          <ShieldCheck size={25} />
          <span>Inspector Scan</span>
        </div>
        <nav className="role-nav" aria-label="Inspector navigation">
          <button className="icon-text-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to queue
          </button>
          <button className="icon-text-btn" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </nav>
      </header>

      <section className="role-intro">
        <div>
          <p className="eyebrow">INSPECTOR ANALYSIS</p>
          <h1>Scan package for review.</h1>
          <p>
            {verification?.productName
              ? `Reviewing ${verification.productName}. Scan the package, download the report, and record the decision.`
              : "Scan the package, download the report, and record the decision."}
          </p>
        </div>
        <span className="role-chip">inspector</span>
      </section>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : result ? (
        <VerificationResult
          result={result}
          onReset={resetScan}
          canReview
          reviewId={verificationId}
          onReviewUpdated={onBack}
        />
      ) : (
        <div className="verification-workspace">
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            selectedDemo={selectedDemo}
            demoSamples={demoSamples}
            onSelectFile={(file) => {
              setSelectedDemo(null);
              setSelectedFile(file);
              setPreviewUrl(URL.createObjectURL(file));
            }}
            onSelectDemo={(demo) => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setSelectedDemo(demo);
            }}
            onClear={clearSelection}
            onVerify={handleVerify}
            loading={loading}
          />
        </div>
      )}
    </main>
  );
}
